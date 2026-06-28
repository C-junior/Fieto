'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Factory,
  TrendingUp,
  Sun,
  Moon,
  User,
  Activity,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

const navItems = [
  {
    label: 'Início',
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
  {
    label: 'Sensores',
    href: '/sensores',
    icon: Activity,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo-area">
        <img
          src="/logo.png"
          alt="Integra Logo"
          className="sidebar-logo-img"
        />
        <div className="sidebar-brand">
          <span className="sidebar-brand-name">INTEGRA</span>
          <span className="sidebar-brand-ai">AI</span>
        </div>
      </div>

      <div className="sidebar-divider" />

      <nav className="sidebar-nav">
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

      <div className="sidebar-footer">
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label="Alternar tema"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
        </button>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            <User size={18} />
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">Gestor</span>
            <span className="sidebar-user-role">Administrador</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
