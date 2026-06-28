'use client';

import { AlertTriangle, Clock, ChefHat, TrendingUp, Sparkles, Check, X } from 'lucide-react';

const ICONS = {
  VALIDADE: Clock,
  SUPERPRODUÇÃO: TrendingUp,
  REAPROVEITAMENTO: ChefHat,
  OPORTUNIDADE: Sparkles,
  default: AlertTriangle,
};

const SEVERITY_CLASS = {
  CRITICAL: 'alert-card-critical',
  WARNING: 'alert-card-warning',
  INFO: 'alert-card-info',
};

export default function AlertCard({ alert, onAccept, onDismiss }) {
  const Icon = ICONS[alert.type] || ICONS.default;
  const severityClass = SEVERITY_CLASS[alert.severity] || 'alert-card-info';

  return (
    <div className={`alert-card ${severityClass} animate-slide-in`}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div
          className={`metric-icon metric-icon-${alert.severity === 'CRITICAL' ? 'red' : alert.severity === 'WARNING' ? 'yellow' : 'cyan'}`}
          style={{ width: '36px', height: '36px', minWidth: '36px', borderRadius: '10px' }}
        >
          <Icon size={18} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="alert-title">{alert.title}</div>
            {alert.priority_score !== undefined && alert.priority_score !== null && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '22px',
                  height: '22px',
                  padding: '0 6px',
                  borderRadius: '11px',
                  background: alert.severity === 'CRITICAL'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : alert.severity === 'WARNING'
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(0, 212, 255, 0.15)',
                  color: alert.severity === 'CRITICAL'
                    ? 'var(--accent-red)'
                    : alert.severity === 'WARNING'
                    ? 'var(--accent-yellow)'
                    : 'var(--accent-cyan)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {alert.priority_score}
              </span>
            )}
          </div>
          <div className="alert-message" style={{ marginTop: '4px' }}>
            {alert.message}
          </div>
          {alert.suggestion && (
            <div
              style={{
                marginTop: '8px',
                padding: '8px 12px',
                background: 'rgba(0, 212, 255, 0.06)',
                borderRadius: '8px',
                fontSize: '0.82rem',
                color: 'var(--accent-cyan)',
                borderLeft: '2px solid var(--accent-cyan)',
              }}
            >
              💡 {alert.suggestion}
            </div>
          )}
          {(onAccept || onDismiss) && (
            <div className="alert-actions" style={{ marginTop: '12px' }}>
              {onAccept && (
                <button
                  className="btn btn-primary btn-sm btn-resolve"
                  onClick={() => onAccept(alert)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  🤖 Resolver com Diana
                </button>
              )}
              {onDismiss && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onDismiss(alert)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <X size={14} /> Dispensar
                </button>
              )}
            </div>
          )}
        </div>

        {alert.dias_restantes !== undefined && (
          <div
            className={`badge ${
              alert.dias_restantes <= 0
                ? 'badge-expired'
                : alert.dias_restantes <= 3
                ? 'badge-critical'
                : 'badge-warning'
            }`}
          >
            {alert.dias_restantes <= 0
              ? 'Vencido'
              : `${alert.dias_restantes}d`}
          </div>
        )}
      </div>
    </div>
  );
}
