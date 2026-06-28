'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Send, Bot, Trash2, Sparkles, Volume2, VolumeX, Loader } from 'lucide-react';

/**
 * Parse Diana messages to apply rich styling.
 * Lines starting with specific emojis get special section classes.
 * Numeric values (R$, kg, %) get monospace styling.
 */
function renderRichContent(text) {
  if (!text) return null;

  const lines = text.split('\n');

  return lines.map((line, i) => {
    let sectionClass = 'diana-section';

    if (/^[⚠️🔥]/.test(line)) {
      sectionClass = 'diana-section diana-section-alert';
    } else if (/^[💡]/.test(line)) {
      sectionClass = 'diana-section diana-section-suggestion';
    } else if (/^[✅]/.test(line)) {
      sectionClass = 'diana-section diana-section-action';
    } else if (/^[📊]/.test(line)) {
      sectionClass = 'diana-section diana-section-data';
    }

    // Apply monospace styling to numeric values
    const styledLine = line.replace(
      /(R\$\s?[\d.,]+|[\d.,]+\s?kg|[\d.,]+\s?%)/g,
      '<span class="diana-value">$1</span>'
    );

    return (
      <div key={i} className={sectionClass} dangerouslySetInnerHTML={{ __html: styledLine }} />
    );
  });
}

/**
 * Get contextual loading message based on the user's last question.
 */
function getContextualLoading(messages) {
  const lastUserMsg = [...messages].reverse().find(m => m.papel === 'user');
  if (!lastUserMsg) return 'Diana está pensando...';

  const text = lastUserMsg.conteudo.toLowerCase();

  if (text.includes('estoque') || text.includes('validade') || text.includes('venc')) {
    return 'Diana está verificando o estoque...';
  }
  if (text.includes('produção') || text.includes('produzir') || text.includes('demanda') || text.includes('previsão')) {
    return 'Diana está calculando previsões...';
  }
  if (text.includes('receita') || text.includes('reaproveit') || text.includes('reaproveitar')) {
    return 'Diana está buscando receitas...';
  }

  return 'Diana está pensando...';
}

function formatTimestamp(isoString) {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/**
 * Limpa texto para TTS — remove emojis e formatação
 */
function cleanTextForSpeech(text) {
  return text
    // Remove all emoji characters (broad Unicode ranges)
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '')
    // Remove decorative characters
    .replace(/[═\*]/g, '')
    // Remove "ALERTA:" prefix for cleaner speech
    .replace(/ALERTA:\s*/g, 'Atenção: ')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Fala texto usando Web Speech API com voz feminina PT-BR
 */
function speakWithBrowserTTS(text, onEnd) {
  if (!('speechSynthesis' in window)) {
    console.warn('Web Speech API não suportada neste navegador');
    onEnd?.();
    return null;
  }

  // Cancelar qualquer fala anterior
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  utterance.rate = 1.05;
  utterance.pitch = 1.1;
  utterance.volume = 1.0;

  // Tentar encontrar uma voz feminina PT-BR
  const voices = window.speechSynthesis.getVoices();
  const ptBRFemale = voices.find(v =>
    v.lang.startsWith('pt') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('feminina') || v.name.includes('Microsoft Francisca') || v.name.includes('Google'))
  );
  const ptBRAny = voices.find(v => v.lang.startsWith('pt'));

  if (ptBRFemale) {
    utterance.voice = ptBRFemale;
  } else if (ptBRAny) {
    utterance.voice = ptBRAny;
  }

  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  window.speechSynthesis.speak(utterance);
  return utterance;
}

/**
 * TTS Speaker Button component — plays Diana's response as audio.
 * Tries ElevenLabs first, falls back to Web Speech API.
 */
function TTSButton({ text, autoPlay = false }) {
  const [ttsState, setTtsState] = useState('idle'); // idle | loading | playing
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);
  const utteranceRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Load voices for Web Speech API (some browsers load them asynchronously)
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlay = useCallback(async () => {
    // If already playing or loading, stop
    if (ttsState === 'playing' || ttsState === 'loading') {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setTtsState('idle');
      return;
    }

    setTtsState('loading');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // Check if we already have the audio cached (ElevenLabs)
      if (blobUrlRef.current) {
        const audio = new Audio(blobUrlRef.current);
        audioRef.current = audio;
        audio.onended = () => setTtsState('idle');
        audio.onerror = () => setTtsState('idle');
        await audio.play();
        setTtsState('playing');
        return;
      }

      // Try ElevenLabs via API route
      const res = await fetch('/api/diana/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: abortControllerRef.current.signal,
      });

      if (res.ok) {
        const contentType = res.headers.get('Content-Type');

        if (contentType && contentType.includes('audio/')) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;

          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => setTtsState('idle');
          audio.onerror = () => {
            console.warn('Audio playback error, falling back to browser TTS');
            fallbackToBrowserTTS();
          };
          await audio.play();
          setTtsState('playing');
          return;
        }

        const data = await res.json();
        if (data.fallback) {
          fallbackToBrowserTTS(data.cleanText);
          return;
        }
      }

      fallbackToBrowserTTS();
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('TTS error, using browser fallback:', err);
      fallbackToBrowserTTS();
    }
  }, [text, ttsState]);

  const fallbackToBrowserTTS = useCallback((cleanedText) => {
    const speechText = cleanedText || cleanTextForSpeech(text);
    utteranceRef.current = speakWithBrowserTTS(speechText, () => {
      setTtsState('idle');
    });
    setTtsState('playing');
  }, [text]);

  // Auto-play on mount if enabled
  useEffect(() => {
    if (autoPlay && text && !hasAutoPlayed) {
      setHasAutoPlayed(true);
      handlePlay();
    }
  }, [autoPlay, text, hasAutoPlayed, handlePlay]);

  const Icon = ttsState === 'loading' ? Loader
    : ttsState === 'playing' ? VolumeX
    : Volume2;

  return (
    <button
      className={`tts-btn ${ttsState === 'playing' ? 'tts-btn-playing' : ''} ${ttsState === 'loading' ? 'tts-btn-loading' : ''}`}
      onClick={handlePlay}
      title={
        ttsState === 'playing' ? 'Parar áudio'
        : ttsState === 'loading' ? 'Gerando áudio...'
        : 'Ouvir Diana'
      }
      disabled={ttsState === 'loading'}
    >
      <Icon size={14} className={ttsState === 'loading' ? 'tts-spin' : ''} />
    </button>
  );
}

export default function DianaChat({ messages, streamingMessage, isStreaming, loading, sendMessage, clearChat, suggestions }) {
  const [input, setInput] = useState('');
  const [autoTTS, setAutoTTS] = useState(true);
  const messagesEndRef = useRef(null);
  const lastMessageIdRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, streamingMessage]);

  // Track the latest Diana message for auto-play
  const latestDianaMsg = useMemo(() => {
    const dianaMessages = messages.filter(m => m.papel === 'assistant' && m.id !== 'welcome');
    return dianaMessages[dianaMessages.length - 1] || null;
  }, [messages]);

  const isNewMessage = latestDianaMsg && latestDianaMsg.id !== lastMessageIdRef.current;

  useEffect(() => {
    if (latestDianaMsg) {
      lastMessageIdRef.current = latestDianaMsg.id;
    }
  }, [latestDianaMsg]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading || isStreaming) return;
    sendMessage(input);
    setInput('');
  };

  const handleQuickQuestion = (question) => {
    if (loading || isStreaming) return;
    sendMessage(question);
  };

  const contextualLoading = useMemo(() => getContextualLoading(messages), [messages]);

  const placeholder = messages.length <= 1
    ? 'Pergunte qualquer coisa sobre sua padaria...'
    : 'Continue a conversa com Diana...';

  return (
    <div className="chat-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(15, 22, 41, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="metric-icon metric-icon-cyan" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
            <Bot size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Conversar com Diana</div>
            <div style={{ fontSize: '0.75rem', color: isStreaming ? 'var(--accent-cyan)' : 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isStreaming ? 'var(--accent-cyan)' : 'var(--accent-green)', display: 'inline-block', animation: isStreaming ? 'cursor-blink 1s step-end infinite' : 'none' }}></span>
              {isStreaming ? 'Diana está respondendo...' : 'Online e Monitorando'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Auto-TTS toggle */}
          <button
            className={`tts-toggle-btn ${autoTTS ? 'tts-toggle-active' : ''}`}
            onClick={() => setAutoTTS(!autoTTS)}
            title={autoTTS ? 'Desativar voz automática' : 'Ativar voz automática — Diana fala suas respostas'}
          >
            {autoTTS ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
          {messages.length > 1 && (
            <button
              className="btn btn-ghost btn-sm btn-icon"
              onClick={clearChat}
              title="Limpar conversa"
              style={{ padding: 0, width: '32px', height: '32px' }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages" style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className="chat-bubble-wrapper"
            style={{ marginBottom: '20px' }}
          >
            <div
              className={`chat-bubble ${
                msg.papel === 'user'
                  ? 'chat-bubble-user'
                  : 'chat-bubble-diana'
              } animate-fade-in`}
              style={
                msg.papel === 'user'
                  ? { background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)' }
                  : undefined
              }
            >
              {msg.papel === 'assistant'
                ? renderRichContent(msg.conteudo)
                : msg.conteudo
              }
              {/* TTS Button for Diana messages */}
              {msg.papel === 'assistant' && msg.id !== 'welcome' && msg.conteudo && (
                <TTSButton
                  text={msg.conteudo}
                  autoPlay={autoTTS && isNewMessage && msg.id === latestDianaMsg?.id}
                />
              )}
            </div>
            <div className={`chat-timestamp ${msg.papel === 'user' ? 'chat-timestamp-user' : 'chat-timestamp-diana'}`}>
              {formatTimestamp(msg.criado_em)}
            </div>
          </div>
        ))}

        {/* Streaming message bubble */}
        {isStreaming && streamingMessage !== null && (
          <div className="chat-bubble-wrapper" style={{ marginBottom: '20px' }}>
            <div className="chat-bubble chat-bubble-diana chat-bubble-streaming animate-fade-in">
              {renderRichContent(streamingMessage)}
              <span className="typing-cursor"></span>
            </div>
          </div>
        )}

        {/* Contextual loading indicator (when loading but not yet streaming) */}
        {loading && !isStreaming && (
          <div className="diana-thinking">
            <div className="diana-thinking-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span>{contextualLoading}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Dynamic Suggestion Chips */}
      {suggestions && suggestions.length > 0 && messages.length <= 2 && (
        <div className="suggestion-chips">
          {suggestions.map((s, i) => (
            <button
              key={i}
              className="suggestion-chip"
              onClick={() => handleQuickQuestion(s.question)}
              disabled={loading || isStreaming}
            >
              <span>{s.icon}</span>
              <Sparkles size={12} style={{ opacity: 0.6 }} />
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="chat-input-area">
        <input
          type="text"
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={loading || isStreaming}
        />
        <button type="submit" className="chat-send-btn" disabled={!input.trim() || loading || isStreaming}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
