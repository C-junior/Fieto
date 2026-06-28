'use client';

import { useState, useCallback, useRef } from 'react';

const EMPRESA_ID = 'demo-padaria-001';

export function useDiana() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      papel: 'assistant',
      conteudo: 'Diana online. Monitorando estoque e produção. Pergunte-me sobre validades, previsões ou reaproveitamento.',
      criado_em: new Date().toISOString(),
    },
  ]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

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
        }),
        signal: abortRef.current.signal,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao comunicar com Diana');

      const dianaMsg = {
        id: `diana-${Date.now()}`,
        papel: 'assistant',
        conteudo: data.response,
        criado_em: new Date().toISOString(),
      };

      setMessages(prev => [...prev, dianaMsg]);
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

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        papel: 'assistant',
        conteudo: 'Diana online. Chat limpo. Como posso ajudar?',
        criado_em: new Date().toISOString(),
      },
    ]);
  }, []);

  return {
    messages,
    alerts,
    loading,
    alertsLoading,
    error,
    sendMessage,
    fetchAlerts,
    clearChat,
  };
}
