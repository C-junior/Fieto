'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Factory,
  TrendingUp,
  Bot,
  Sparkles,
} from 'lucide-react';

const navItems = [
  {
    label: 'Diana Hub',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Estoque',
    href: '/estoque',
    icon: Package,
  },
  {
    label: 'Produção',
    href: '/producao',
    icon: Factory,
  },
  {
    label: 'Previsão',
    href: '/previsao',
    icon: TrendingUp,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <img
          src="/logo.png"
          alt="Integra Logo"
          style={{
            height: '60px',
            width: '60px',
            objectFit: 'contain',
            borderRadius: '12px',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            boxShadow: '0 0 15px rgba(0, 212, 255, 0.15)',
          }}
        />
        <div className="sidebar-logo" style={{ fontSize: '1.45rem', letterSpacing: '1px', marginBottom: '2px' }}>
          INTEGRA
        </div>
        <p className="sidebar-subtitle" style={{ marginTop: 0 }}>Gestão Inteligente de Panificação</p>
      </div>

      {/* Divider */}
      <div className="sidebar-divider" />

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="nav-section-label">Menu Principal</span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${isActive ? ' active' : ''}`}
            >
              <Icon className="nav-item-icon" size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px',
            borderRadius: '10px',
            background: 'rgba(0, 212, 255, 0.05)',
            border: '1px solid rgba(0, 212, 255, 0.1)',
          }}
        >
          <Bot size={16} style={{ color: 'var(--accent-cyan)', opacity: 0.8 }} />
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              fontWeight: 500,
              letterSpacing: '0.3px',
            }}
          >
            Powered by{' '}
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
              Diana AI
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}
