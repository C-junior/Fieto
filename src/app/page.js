'use client';

import { useEffect } from 'react';
import MetricCard from '@/components/MetricCard';
import { useEstoque } from '@/hooks/useEstoque';
import { useProducao } from '@/hooks/useProducao';
import { Bell, Factory, Package } from 'lucide-react';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function Home() {
  const {
    loading: estoqueLoading,
    fetchItems: fetchEstoque,
    stats: estoqueStats,
  } = useEstoque();

  const {
    loading: producaoLoading,
    fetchRecords: fetchProducao,
    stats: producaoStats,
  } = useProducao();

  useEffect(() => {
    fetchEstoque();
    fetchProducao();
  }, [fetchEstoque, fetchProducao]);

  const totalPerdaKG = Number(producaoStats.totalPerda || 0);
  const valorPerdido = totalPerdaKG * 8.5;
  const percentualPerda = producaoStats.percentualPerda || '0.0';
  const economiaEstimada = valorPerdido * 0.45;
  const criticalCount = estoqueStats.critical + estoqueStats.expired;
  const isLoading = estoqueLoading || producaoLoading;

  return (
    <div className="animate-fade-in dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-greeting">{getGreeting()}, Gestor!</h1>
          <p className="dashboard-subtitle">
            {isLoading ? 'Atualizando indicadores...' : 'Tudo sob controle hoje.'}
          </p>
        </div>
        <div className="dashboard-header-right">
          <div className="dashboard-date">
            {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>
          <div className="dashboard-notification" title="Itens criticos">
            <Bell size={20} />
            {criticalCount > 0 && (
              <span className="notification-badge">{criticalCount}</span>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-kpi-row">
        <MetricCard
          title="Valor em Estoque"
          value={estoqueStats.valorEmRisco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          label="Insumos totais"
          icon="Package"
          color="cyan"
        />
        <MetricCard
          title="Alertas de Validade"
          value={`${criticalCount} itens`}
          label="Proximos a vencer"
          icon="AlertTriangle"
          color="orange"
        />
        <MetricCard
          title="Economia Projetada"
          value={economiaEstimada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          label="Reducao de perda no mes"
          icon="TrendingUp"
          color="green"
          trend={{ value: 12.4, isPositive: true }}
        />
        <MetricCard
          title="Perdas Registradas"
          value={`${totalPerdaKG.toLocaleString('pt-BR')} kg`}
          label={`Desperdicio medio de ${percentualPerda}%`}
          icon="Trash2"
          color="red"
          trend={{ value: 4.8, isPositive: false }}
        />
      </div>

      <div className="dashboard-quick-actions">
        <h3 className="quick-actions-title">Acoes Rapidas</h3>
        <div className="quick-actions-grid">
          <a href="/estoque" className="quick-action-card">
            <Package size={24} />
            <span>Novo Produto</span>
          </a>
          <a href="/producao" className="quick-action-card">
            <Factory size={24} />
            <span>Registrar Producao</span>
          </a>
          <a href="/previsao" className="quick-action-card">
            <Bell size={24} />
            <span>Ver Previsao</span>
          </a>
        </div>
      </div>
    </div>
  );
}
