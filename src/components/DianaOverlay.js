'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bot, MessageCircle, Sparkles, X } from 'lucide-react';
import DianaHub from './DianaHub';
import { useDiana } from '@/hooks/useDiana';

function DianaReactor({ active }) {
  return (
    <div className={`diana-reactor ${active ? 'diana-reactor-active' : ''}`} aria-hidden="true">
      <span className="diana-reactor-ring"></span>
      <span className="diana-reactor-core"></span>
      <span className="diana-reactor-scan"></span>
    </div>
  );
}

export default function DianaOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [voiceState, setVoiceState] = useState('idle');

  const {
    messages,
    streamingMessage,
    isStreaming,
    alerts,
    loading,
    alertsLoading,
    sendMessage,
    fetchAlerts,
    fetchBriefing,
    clearChat,
    briefing,
    briefingLoading,
    suggestions,
    onAcceptAlert,
    onDismissAlert,
  } = useDiana();

  const activeAlerts = useMemo(
    () => alerts.filter((alert) => !alert.dismissed),
    [alerts]
  );

  const isVoiceActive = voiceState === 'playing' || voiceState === 'loading';

  useEffect(() => {
    fetchAlerts();
    fetchBriefing();
  }, [fetchAlerts, fetchBriefing]);

  useEffect(() => {
    if (!isOpen) return;

    fetchAlerts();
    fetchBriefing();
  }, [isOpen, fetchAlerts, fetchBriefing]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className={`diana-launcher ${isOpen ? 'diana-launcher-open' : ''} ${isVoiceActive ? 'diana-launcher-speaking' : ''}`}
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Fechar D_IA_na' : 'Abrir D_IA_na'}
        aria-expanded={isOpen}
      >
        <span className="diana-launcher-icon">
          {isOpen ? <X size={22} /> : <Bot size={24} />}
        </span>
        <span className="diana-launcher-copy">
          <strong>D_IA_na</strong>
          <small>{isStreaming ? 'respondendo' : isVoiceActive ? 'falando' : 'assistente'}</small>
        </span>
        <DianaReactor active={isVoiceActive || isStreaming} />
        {activeAlerts.length > 0 && (
          <span className="diana-launcher-badge">{activeAlerts.length}</span>
        )}
      </button>

      {isOpen && (
        <div className="diana-overlay-shell" role="presentation">
          <button
            type="button"
            className="diana-overlay-backdrop"
            onClick={() => setIsOpen(false)}
            aria-label="Fechar D_IA_na"
          />
          <section
            className="diana-overlay-panel animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-label="D_IA_na"
          >
            <header className="diana-overlay-header">
              <div className="diana-overlay-title">
                <div className="diana-overlay-avatar">
                  <Sparkles size={19} />
                </div>
                <div>
                  <h2>D_IA_na</h2>
                  <p>{isStreaming ? 'Preparando a resposta' : isVoiceActive ? 'Falando com voce' : 'Pronta para decidir com voce'}</p>
                </div>
              </div>
              <div className="diana-overlay-actions">
                <DianaReactor active={isVoiceActive || isStreaming} />
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  onClick={() => setIsOpen(false)}
                  aria-label="Fechar D_IA_na"
                  title="Fechar"
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            <DianaHub
              messages={messages}
              streamingMessage={streamingMessage}
              isStreaming={isStreaming}
              alerts={alerts}
              loading={loading}
              alertsLoading={alertsLoading}
              sendMessage={sendMessage}
              fetchAlerts={fetchAlerts}
              clearChat={clearChat}
              onAcceptAlert={onAcceptAlert}
              onDismissAlert={onDismissAlert}
              briefing={briefing}
              briefingLoading={briefingLoading}
              suggestions={suggestions}
              onVoiceStateChange={setVoiceState}
            />
          </section>
        </div>
      )}

      {!isOpen && isStreaming && (
        <div className="diana-mini-status">
          <MessageCircle size={15} />
          Diana esta respondendo...
        </div>
      )}
    </>
  );
}
