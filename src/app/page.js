'use client';

import { useEffect, useState } from 'react';
import MetricCard from '@/components/MetricCard';
import DianaHub from '@/components/DianaHub';
import { useDiana } from '@/hooks/useDiana';
import { useEstoque } from '@/hooks/useEstoque';
import { useProducao } from '@/hooks/useProducao';

export default function Home() {
  const {
    messages,
    alerts,
    loading: dianaLoading,
    alertsLoading,
    sendMessage,
    fetchAlerts,
    clearChat,
  } = useDiana();

  const {
    items: estoqueItems,
    loading: estoqueLoading,
    fetchItems: fetchEstoque,
    stats: estoqueStats,
  } = useEstoque();

  const {
    records: producaoRecords,
    loading: producaoLoading,
    fetchRecords: fetchProducao,
    stats: producaoStats,
  } = useProducao();

  const [localAlerts, setLocalAlerts] = useState([]);

  // Fetch inicial de dados
  useEffect(() => {
    fetchEstoque();
    fetchProducao();
  }, [fetchEstoque, fetchProducao]);

  // Sincronizar alertas da Diana
  useEffect(() => {
    setLocalAlerts(alerts);
  }, [alerts]);

  // Ações de alertas
  const handleAcceptAlert = async (alert) => {
    // Ação interativa na apresentação:
    // Se o usuário clicar em "Aceitar" num alerta de reaproveitamento, por exemplo, a Diana responde no chat
    const prompts = {
      VALIDADE: `Diana, eu aceito a sugestão sobre o item ${alert.item_name}. O que devo fazer agora?`,
      SUPERPRODUÇÃO: `Diana, reduza a produção sugerida de ${alert.item_name} como recomendado.`,
      REAPROVEITAMENTO: `Diana, aceito a sugestão. Me dê a receita detalhada de ${alert.suggestion.split(' ')[0] || 'reaproveitamento'} para usar o item ${alert.item_name}.`,
    };

    const promptMessage = prompts[alert.type] || `Diana, aceito o alerta sobre ${alert.item_name}.`;
    
    // Remover alerta localmente (ou riscar como resolvido)
    setLocalAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, dismissed: true } : a));
    
    // Envia mensagem ao chat simulando a resposta do mestre padeiro
    await sendMessage(promptMessage);
  };

  const handleDismissAlert = (alert) => {
    setLocalAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, dismissed: true } : a));
  };

  // Calcular economia estimada da panificadora e KPI de perdas
  const totalPerdaKG = Number(producaoStats.totalPerda || 0);
  const valorPerdido = totalPerdaKG * 8.5; // Custo estimado ponderado por kg de produto final
  const percentualPerda = producaoStats.percentualPerda || '0.0';
  
  // Economia mensal calculada na previsão da Diana
  const economiaEstimada = valorPerdido * 0.45; // Diana reduz em média 45% das perdas com IA

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Diana Hub</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Painel inteligente de controle de desperdício e IA operacional.
          </p>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          🕒 Local: {new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-4" style={{ gap: '20px' }}>
        <MetricCard
          title="Economia Projetada"
          value={economiaEstimada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          label="Redução de perda estimada (Mês)"
          icon="TrendingUp"
          color="green"
          trend={{ value: 12.4, isPositive: true }}
        />
        <MetricCard
          title="Perdas Registradas"
          value={`${Number(producaoStats.totalPerda || 0).toLocaleString('pt-BR')} kg`}
          label={`Desperdício médio de ${percentualPerda}%`}
          icon="Trash2"
          color="red"
          trend={{ value: 4.8, isPositive: false }}
        />
        <MetricCard
          title="Validades Críticas"
          value={`${estoqueStats.critical + estoqueStats.expired} itens`}
          label={`${estoqueStats.expired} vencido(s) e ${estoqueStats.critical} em risco`}
          icon="AlertTriangle"
          color="orange"
        />
        <MetricCard
          title="Valor em Risco"
          value={estoqueStats.valorEmRisco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          label="Insumos prestes a expirar"
          icon="Shield"
          color="cyan"
        />
      </div>

      {/* Diana Hub: Feed de Alertas + Chat */}
      <DianaHub
        messages={messages}
        alerts={localAlerts}
        loading={dianaLoading}
        alertsLoading={alertsLoading || estoqueLoading || producaoLoading}
        sendMessage={sendMessage}
        fetchAlerts={fetchAlerts}
        clearChat={clearChat}
        onAcceptAlert={handleAcceptAlert}
        onDismissAlert={handleDismissAlert}
      />
    </div>
  );
}
