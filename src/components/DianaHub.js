'use client';

import { useEffect } from 'react';
import DianaChat from './DianaChat';
import AlertCard from './AlertCard';
import { Activity, AlertTriangle, BellOff, Bot, Moon, Package, Sun } from 'lucide-react';

function formatCurrency(value) {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  if (typeof value === 'string') return value;

  if (typeof value === 'object') {
    return value.economia_estimada_mensal || value.economia_realizada || null;
  }

  return null;
}

function BriefingPanel({ briefing, briefingLoading }) {
  const hour = new Date().getHours();
  const isDaytime = hour >= 6 && hour < 18;
  const TimeIcon = isDaytime ? Sun : Moon;
  const resumo = briefing?.resumo_estoque;
  const sugestao = briefing?.sugestao_producao?.[0];
  const economia = formatCurrency(briefing?.economia_mes);

  return (
    <section className="diana-ops-section">
      <div className="diana-ops-section-header">
        <div className="diana-ops-heading">
          <TimeIcon size={18} />
          <span>{briefing?.saudacao || 'Briefing operacional'}</span>
        </div>
        {briefingLoading && <span className="diana-status-pill">Atualizando</span>}
      </div>

      <div className="diana-briefing-grid">
        <div className="diana-briefing-metric diana-briefing-metric-critical">
          <span>Criticos</span>
          <strong>{resumo?.criticos ?? '-'}</strong>
        </div>
        <div className="diana-briefing-metric diana-briefing-metric-critical">
          <span>Vencidos</span>
          <strong>{resumo?.vencidos ?? '-'}</strong>
        </div>
        <div className="diana-briefing-metric diana-briefing-metric-warning">
          <span>Atencao</span>
          <strong>{resumo?.atencao ?? '-'}</strong>
        </div>
      </div>

      <div className="diana-briefing-lines">
        <div className="diana-briefing-line">
          <Package size={15} />
          <span>{sugestao?.produto || 'Sem sugestao principal'}</span>
          <strong>{sugestao ? `${sugestao.quantidade_sugerida} un` : '-'}</strong>
        </div>
        <div className="diana-briefing-line">
          <Activity size={15} />
          <span>Economia do mes</span>
          <strong>{economia || '-'}</strong>
        </div>
      </div>
    </section>
  );
}

function AlertsPanel({ alerts, alertsLoading, onAcceptAlert, onDismissAlert }) {
  const activeAlerts = alerts.filter((alert) => !alert.dismissed);

  return (
    <section className="diana-ops-section diana-alerts-section">
      <div className="diana-ops-section-header">
        <div className="diana-ops-heading">
          <Bot size={18} />
          <span>Decisoes proativas</span>
        </div>
        <span className="diana-status-pill">{activeAlerts.length} sugestoes</span>
      </div>

      <div className="diana-alerts-list">
        {alertsLoading ? (
          <div className="diana-empty-state">
            <div className="spinner"></div>
            <span>Diana esta analisando estoque e producao...</span>
          </div>
        ) : activeAlerts.length === 0 ? (
          <div className="diana-empty-state">
            <BellOff size={34} />
            <strong>Tudo sob controle</strong>
            <span>Nenhuma validade critica ou desvio relevante no momento.</span>
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
    </section>
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
  onVoiceStateChange,
}) {
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const activeAlerts = alerts.filter((alert) => !alert.dismissed);

  return (
    <div className="diana-hub-grid animate-fade-in">
      <aside className="diana-ops-panel">
        <div className="diana-ops-topline">
          <div>
            <span className="diana-eyebrow">D_IA_na Core</span>
            <h3>Central operacional</h3>
          </div>
          <div className="diana-risk-chip">
            <AlertTriangle size={14} />
            {activeAlerts.length}
          </div>
        </div>

        <BriefingPanel briefing={briefing} briefingLoading={briefingLoading} />
        <AlertsPanel
          alerts={alerts}
          alertsLoading={alertsLoading}
          onAcceptAlert={onAcceptAlert}
          onDismissAlert={onDismissAlert}
        />
      </aside>

      <section className="diana-chat-panel">
        <DianaChat
          messages={messages}
          streamingMessage={streamingMessage}
          isStreaming={isStreaming}
          loading={loading}
          sendMessage={sendMessage}
          clearChat={clearChat}
          suggestions={suggestions}
          onVoiceStateChange={onVoiceStateChange}
        />
      </section>
    </div>
  );
}
