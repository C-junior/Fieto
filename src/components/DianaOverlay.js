'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bot, MessageCircle, Sparkles, X } from 'lucide-react';
import DianaHub from './DianaHub';
import { useDiana } from '@/hooks/useDiana';



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
    const handleUpdate = () => {
      fetchAlerts();
    };
    window.addEventListener('diana-alerts-updated', handleUpdate);
    return () => window.removeEventListener('diana-alerts-updated', handleUpdate);
  }, [fetchAlerts]);

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
        aria-label={isOpen ? 'Fechar DIANA' : 'Abrir DIANA'}
        aria-expanded={isOpen}
      >
        <span className="diana-launcher-icon">
          {isOpen ? <X size={22} /> : <Bot size={24} />}
        </span>
        <span className="diana-launcher-copy">
          <strong>D<span className="diana">IA</span>NA</strong>
          <small>{isStreaming ? 'respondendo' : isVoiceActive ? 'falando' : 'assistente'}</small>
        </span>
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
            aria-label="Fechar DIANA"
          />
          <section
            className="diana-overlay-panel animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-label="DIANA"
          >
            <header className="diana-overlay-header">
              <div className="diana-overlay-title">
                <div className="diana-overlay-avatar">
                  <Sparkles size={19} />
                </div>
                <div>
                  <h2>D<span className="diana">IA</span>NA</h2>
                  <p>{isStreaming ? 'Preparando a resposta' : isVoiceActive ? 'Falando com voce' : 'Pronta para decidir com voce'}</p>
                </div>
              </div>
              <div className="diana-overlay-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  onClick={() => setIsOpen(false)}
                  aria-label="Fechar DIANA"
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
          DIANA esta respondendo...
        </div>
      )}
    </>
  );
}
