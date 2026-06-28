'use client';

import { AlertTriangle, Clock, ChefHat, TrendingUp, Check, X } from 'lucide-react';

const ICONS = {
  expiry: Clock,
  overproduction: TrendingUp,
  reuse: ChefHat,
  default: AlertTriangle,
};

const SEVERITY_CLASS = {
  critical: 'alert-card-critical',
  warning: 'alert-card-warning',
  info: 'alert-card-info',
};

export default function AlertCard({ alert, onAccept, onDismiss }) {
  const Icon = ICONS[alert.type] || ICONS.default;
  const severityClass = SEVERITY_CLASS[alert.severity] || 'alert-card-info';

  return (
    <div className={`alert-card ${severityClass} animate-fade-in`}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div
          className={`metric-icon metric-icon-${alert.severity === 'critical' ? 'red' : alert.severity === 'warning' ? 'yellow' : 'cyan'}`}
          style={{ width: '36px', height: '36px', minWidth: '36px', borderRadius: '10px' }}
        >
          <Icon size={18} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="alert-title">{alert.title}</div>
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
                  className="btn btn-primary btn-sm"
                  onClick={() => onAccept(alert)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Check size={14} /> Aceitar
                </button>
              )}
              {onDismiss && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onDismiss(alert)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <X size={14} /> Ignorar
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
