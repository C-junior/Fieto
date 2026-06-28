'use client';

import { useEffect } from 'react';
import DianaChat from './DianaChat';
import AlertCard from './AlertCard';
import { Bot, BellOff, Sun, Moon } from 'lucide-react';

function BriefingCard({ briefing, briefingLoading }) {
  if (briefingLoading) {
    return (
      <div className="briefing-card" style={{ textAlign: 'center', padding: '24px' }}>
        <div className="spinner" style={{ margin: '0 auto 8px' }}></div>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Carregando briefing...</span>
      </div>
    );
  }

  if (!briefing) return null;

  const hour = new Date().getHours();
  const isDaytime = hour >= 6 && hour < 18;
  const TimeIcon = isDaytime ? Sun : Moon;

  return (
    <div className="briefing-card">
      <div className="briefing-card-header">
        <TimeIcon size={20} style={{ color: isDaytime ? 'var(--accent-yellow)' : 'var(--accent-purple)' }} />
        <span>{briefing.saudacao || 'Olá!'}</span>
      </div>

      {briefing.resumo_estoque && (
        <>
          <div className="briefing-stat">
            <span>Itens críticos</span>
            <span className="briefing-stat-value briefing-stat-critical">
              {briefing.resumo_estoque.criticos}
            </span>
          </div>
          <div className="briefing-stat">
            <span>Vencidos</span>
            <span className="briefing-stat-value briefing-stat-critical">
              {briefing.resumo_estoque.vencidos}
            </span>
          </div>
          <div className="briefing-stat">
            <span>Atenção</span>
            <span className="briefing-stat-value briefing-stat-warning">
              {briefing.resumo_estoque.atencao}
            </span>
          </div>
        </>
      )}

      {briefing.sugestao_producao && briefing.sugestao_producao.length > 0 && (
        <div className="briefing-stat" style={{ marginTop: '8px', background: 'rgba(0, 212, 255, 0.06)', borderLeft: '2px solid var(--accent-cyan)' }}>
          <span>🍞 {briefing.sugestao_producao[0].produto}</span>
          <span className="briefing-stat-value">
            {briefing.sugestao_producao[0].quantidade_sugerida} un
          </span>
        </div>
      )}

      {briefing.economia_mes !== undefined && (
        <div className="briefing-stat" style={{ marginTop: '8px' }}>
          <span>💰 Economia do mês</span>
          <span className="briefing-stat-value" style={{ color: 'var(--accent-green)' }}>
            {Number(briefing.economia_mes).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      )}
    </div>
  );
}

export default function DianaHub({
  messages,
  streamingMessage,
  isStreaming,
  alerts,
  loading,
  alertsLoading,
  sendMessage,
  fetchAlerts,
  clearChat,
  onAcceptAlert,
  onDismissAlert,
  briefing,
  briefingLoading,
  suggestions,
}) {
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const activeAlerts = alerts.filter((a) => !a.dismissed);

  return (
    <div className="diana-hub-grid animate-fade-in">
      {/* Coluna 1: Briefing + Alertas Proativos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {/* Briefing Card */}
        <BriefingCard briefing={briefing} briefingLoading={briefingLoading} />

        {/* Alerts Panel */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
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
      </div>

      {/* Coluna 2: Chat Conversacional */}
      <DianaChat
        messages={messages}
        streamingMessage={streamingMessage}
        isStreaming={isStreaming}
        loading={loading}
        sendMessage={sendMessage}
        clearChat={clearChat}
        suggestions={suggestions}
      />
    </div>
  );
}
