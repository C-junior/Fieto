'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Bot, Trash2, Sparkles } from 'lucide-react';

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

export default function DianaChat({ messages, streamingMessage, isStreaming, loading, sendMessage, clearChat, suggestions }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, streamingMessage]);

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
