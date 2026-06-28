'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

const EMPRESA_ID = 'demo-padaria-001';

const WELCOME_MESSAGE = {
  id: 'welcome',
  papel: 'assistant',
  conteudo: 'Diana online. Monitorando estoque e produção. Pergunte-me sobre validades, previsões ou reaproveitamento.',
  criado_em: new Date().toISOString(),
};

function getTimeSuggestions() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return [
      { label: 'Briefing do dia', icon: '☀️', question: 'Diana, me dê o briefing completo do dia.' },
      { label: 'O que produzir hoje?', icon: '🍞', question: 'O que devo produzir hoje com base na previsão de demanda?' },
      { label: 'Validades críticas', icon: '⏰', question: 'Quais itens estão com validade crítica hoje?' },
    ];
  }

  if (hour >= 12 && hour < 18) {
    return [
      { label: 'Análise de vendas', icon: '📊', question: 'Como estão as vendas de hoje até agora?' },
      { label: 'Status do estoque', icon: '📦', question: 'Qual o status atual do estoque?' },
      { label: 'Receitas de reaproveitamento', icon: '💡', question: 'Quais receitas de reaproveitamento posso fazer com os itens disponíveis?' },
    ];
  }

  // Night: 18-5
  return [
    { label: 'Resumo do dia', icon: '📋', question: 'Me dê um resumo completo do dia de hoje.' },
    { label: 'Previsão para amanhã', icon: '📊', question: 'Qual a previsão de demanda para amanhã?' },
    { label: 'Economia do mês', icon: '💰', question: 'Quanto economizamos este mês com a Diana?' },
  ];
}

function loadMessagesFromStorage() {
  if (typeof window === 'undefined') return [WELCOME_MESSAGE];

  try {
    const stored = localStorage.getItem('diana-chat-messages');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return [WELCOME_MESSAGE];
}

function saveMessagesToStorage(messages) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('diana-chat-messages', JSON.stringify(messages));
  } catch {
    // ignore storage errors
  }
}

export function useDiana() {
  const [messages, setMessages] = useState(() => loadMessagesFromStorage());
  const [streamingMessage, setStreamingMessage] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [briefing, setBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(() => getTimeSuggestions());
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  // Persist messages to localStorage
  useEffect(() => {
    saveMessagesToStorage(messages);
  }, [messages]);

  // Update suggestions periodically based on time of day
  useEffect(() => {
    const interval = setInterval(() => {
      setSuggestions(getTimeSuggestions());
    }, 60000); // check every minute
    return () => clearInterval(interval);
  }, []);

  const sendMessage = useCallback(async (userMessage) => {
    if (!userMessage.trim()) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      papel: 'user',
      conteudo: userMessage.trim(),
      criado_em: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setIsStreaming(true);
    setStreamingMessage('');
    setError(null);

    try {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      const res = await fetch('/api/diana/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.trim(),
          empresa_id: EMPRESA_ID,
          stream: true,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao comunicar com Diana');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split('\n');
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const jsonStr = trimmed.slice(6); // remove 'data: '
          try {
            const parsed = JSON.parse(jsonStr);

            if (parsed.done) {
              // Streaming complete — move to messages array
              const dianaMsg = {
                id: `diana-${Date.now()}`,
                papel: 'assistant',
                conteudo: accumulated,
                criado_em: new Date().toISOString(),
              };
              setMessages(prev => [...prev, dianaMsg]);
              setStreamingMessage(null);
              setIsStreaming(false);
              setLoading(false);
              return;
            }

            if (parsed.token) {
              accumulated += parsed.token;
              setStreamingMessage(accumulated);
            }
          } catch {
            // skip malformed JSON lines
          }
        }
      }

      // If we reach here without a done event, finalize with what we have
      if (accumulated) {
        const dianaMsg = {
          id: `diana-${Date.now()}`,
          papel: 'assistant',
          conteudo: accumulated,
          criado_em: new Date().toISOString(),
        };
        setMessages(prev => [...prev, dianaMsg]);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
      const errorMsg = {
        id: `error-${Date.now()}`,
        papel: 'assistant',
        conteudo: '⚠️ Erro de conexão. Verifique sua internet e tente novamente.',
        criado_em: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setStreamingMessage(null);
      setIsStreaming(false);
      setLoading(false);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const res = await fetch(`/api/diana/alerts?empresa_id=${EMPRESA_ID}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao buscar alertas');
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Erro ao buscar alertas:', err);
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  const fetchBriefing = useCallback(async () => {
    setBriefingLoading(true);
    try {
      const res = await fetch(`/api/diana/briefing?empresa_id=${EMPRESA_ID}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao buscar briefing');
      setBriefing(data.briefing || null);
    } catch (err) {
      console.error('Erro ao buscar briefing:', err);
    } finally {
      setBriefingLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    const resetMsg = {
      id: 'welcome',
      papel: 'assistant',
      conteudo: 'Diana online. Chat limpo. Como posso ajudar?',
      criado_em: new Date().toISOString(),
    };
    setMessages([resetMsg]);
    localStorage.removeItem('diana-chat-messages');
  }, []);

  const onAcceptAlert = useCallback(async (alert) => {
    const prompts = {
      VALIDADE: `Diana, eu aceito a sugestao sobre o item ${alert.item_name}. O que devo fazer agora?`,
      'SUPERPRODUCAO': `Diana, reduza a producao sugerida de ${alert.item_name} como recomendado.`,
      'SUPERPRODUÇÃO': `Diana, reduza a producao sugerida de ${alert.item_name} como recomendado.`,
      REAPROVEITAMENTO: `Diana, aceito a sugestao. Me de a receita detalhada para usar o item ${alert.item_name}.`,
    };

    const promptMessage = prompts[alert.type] || `Diana, aceito o alerta sobre ${alert.item_name}.`;
    setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, dismissed: true } : a));
    await sendMessage(promptMessage);
  }, [sendMessage]);

  const onDismissAlert = useCallback((alert) => {
    setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, dismissed: true } : a));
  }, []);

  return {
    messages,
    streamingMessage,
    isStreaming,
    loading,
    alerts,
    alertsLoading,
    briefing,
    briefingLoading,
    suggestions,
    error,
    sendMessage,
    fetchAlerts,
    fetchBriefing,
    clearChat,
    onAcceptAlert,
    onDismissAlert,
  };
}
