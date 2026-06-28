'use client';

import { useEffect } from 'react';
import DianaChat from './DianaChat';
import AlertCard from './AlertCard';
import { Bot, BellOff } from 'lucide-react';

export default function DianaHub({
  messages,
  alerts,
  loading,
  alertsLoading,
  sendMessage,
  fetchAlerts,
  clearChat,
  onAcceptAlert,
  onDismissAlert,
}) {
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const activeAlerts = alerts.filter((a) => !a.dismissed);

  return (
    <div className="grid-2 animate-fade-in" style={{ gap: '24px', alignItems: 'stretch' }}>
      {/* Coluna 1: Alertas Proativos da Diana */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '520px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bot size={20} className="pulse-danger" style={{ color: 'var(--accent-cyan)' }} />
            <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 600 }}>Decisões Proativas da Diana</h3>
          </div>
          <span className="badge badge-info">{activeAlerts.length} Sugestões</span>
        </div>

        {/* Feed de Alertas */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px' }}>
          {alertsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
              <div className="spinner"></div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Diana está analisando o estoque...</div>
            </div>
          ) : activeAlerts.length === 0 ? (
            <div
              className="empty-state"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                padding: '48px 0',
              }}
            >
              <BellOff size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <div style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Tudo sob controle!</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '280px', textAlign: 'center' }}>
                Nenhuma validade crítica ou desvio de superprodução detectado no momento.
              </div>
            </div>
          ) : (
            activeAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAccept={onAcceptAlert}
                onDismiss={onDismissAlert}
              />
            ))
          )}
        </div>
      </div>

      {/* Coluna 2: Chat Conversacional */}
      <DianaChat
        messages={messages}
        loading={loading}
        sendMessage={sendMessage}
        clearChat={clearChat}
      />
    </div>
  );
}
