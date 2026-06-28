'use client';

import * as LucideIcons from 'lucide-react';

const ICON_COLORS = {
  cyan: 'metric-icon-cyan',
  orange: 'metric-icon-orange',
  green: 'metric-icon-green',
  red: 'metric-icon-red',
  purple: 'metric-icon-purple',
  yellow: 'metric-icon-yellow',
};

export default function MetricCard({ title, value, label, icon, color = 'cyan', trend }) {
  const IconComponent = LucideIcons[icon] || LucideIcons.TrendingUp;
  const colorClass = ICON_COLORS[color] || ICON_COLORS.cyan;

  return (
    <div className="glass-card metric-card animate-fade-in" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
      <div className={`metric-icon ${colorClass}`}>
        <IconComponent size={24} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="metric-label">{title}</div>
        <div className="metric-value" style={{ margin: '4px 0' }}>{value}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{label}</span>
          {trend && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: trend.isPositive ? 'var(--accent-green)' : 'var(--accent-red)',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
