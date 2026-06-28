'use client';

import { useEffect, useState, useMemo } from 'react';
import MetricCard from '@/components/MetricCard';
import DemandChart from '@/components/DemandChart';
import { Bot, Info, Calendar } from 'lucide-react';

export default function PrevisaoPage() {
  const [predictions, setPredictions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Produto selecionado no gráfico
  const [selectedProduct, setSelectedProduct] = useState('Pão Francês');
  
  // Dados históricos (para compor a linha de produção real anterior ao gráfico de previsões)
  const [historicoRecente, setHistoricoRecente] = useState([]);

  // Buscar dados de previsão da API
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        // 1. Chamar a API de previsão
        const resPrevisao = await fetch('/api/previsao?empresa_id=demo-padaria-001');
        const dataPrevisao = await resPrevisao.json();
        if (!resPrevisao.ok) throw new Error(dataPrevisao.error || 'Erro ao buscar previsões');

        setPredictions(dataPrevisao.predictions || []);
        setMetrics(dataPrevisao.metrics || null);

        // 2. Chamar a API de produção para pegar o histórico anterior e mesclar no gráfico
        const resProducao = await fetch('/api/producao?empresa_id=demo-padaria-001');
        const dataProducao = await resProducao.json();
        if (resProducao.ok) {
          setHistoricoRecente(dataProducao.records || []);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'Erro ao carregar previsões de demanda.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Lista única de produtos com previsões geradas
  const produtosDisponiveis = useMemo(() => {
    const list = new Set(predictions.map((p) => p.produto_nome));
    return Array.from(list);
  }, [predictions]);

  // Seletor automático inicial para o primeiro produto da lista
  useEffect(() => {
    if (produtosDisponiveis.length > 0 && !produtosDisponiveis.includes(selectedProduct)) {
      setSelectedProduct(produtosDisponiveis[0]);
    }
  }, [produtosDisponiveis, selectedProduct]);

  // Prepara dataset composto de dados reais antigos + projeções futuras para o gráfico
  const chartData = useMemo(() => {
    if (!selectedProduct) return [];

    // 1. Filtrar histórico do produto selecionado (últimos 10 dias)
    const histProd = historicoRecente
      .filter((h) => h.produto_nome === selectedProduct)
      .slice(0, 10)
      .map((h) => ({
        data: h.data,
        qtd_produzida: Number(h.qtd_produzida),
        qtd_vendida: Number(h.qtd_vendida),
        qtd_perda: Number(h.qtd_perda),
      }))
      .reverse(); // Ordenar do mais antigo para o mais recente

    // 2. Filtrar previsões do produto selecionado (próximos 7 dias)
    const prevProd = predictions
      .filter((p) => p.produto_nome === selectedProduct)
      .map((p) => ({
        data: p.data,
        qtd_prevista: Number(p.qtd_prevista),
      }));

    // Mesclar histórico real e previsão
    return [...histProd, ...prevProd];
  }, [selectedProduct, predictions, historicoRecente]);

  // Previsões do produto selecionado
  const itemPredictions = useMemo(() => {
    return predictions.filter((p) => p.produto_nome === selectedProduct);
  }, [predictions, selectedProduct]);

  // Recomendação de produção para amanhã do produto selecionado
  const recomendacaoAmanha = useMemo(() => {
    if (itemPredictions.length === 0) return null;
    // Pega a primeira previsão do array (que representa D+1/amanhã)
    return itemPredictions[0];
  }, [itemPredictions]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Previsão de Demanda</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Algoritmos preditivos ponderados para planejamento inteligente de fornadas.
          </p>
        </div>
      </div>

      {/* Métricas do Modelo */}
      {metrics && (
        <div className="grid-3" style={{ gap: '20px' }}>
          <MetricCard
            title={<span>Acurácia Média da D<span className="diana">IA</span>NA</span>}
            value={`${metrics.acuracia_media || '92.5'}%`}
            label={`Erro percentual médio de ${metrics.mape || '7.5'}%`}
            icon="Bot"
            color="cyan"
          />
          <MetricCard
            title="Produção Sugerida (Amanhã)"
            value={recomendacaoAmanha ? `${recomendacaoAmanha.qtd_prevista} un` : 'Carregando...'}
            label={`Sugestão ideal para ${selectedProduct}`}
            icon="TrendingUp"
            color={recomendacaoAmanha ? 'green' : 'cyan'}
          />
          <MetricCard
            title="Sazonalidade Identificada"
            value="Fim de Semana"
            label="Sábados e domingos registram +35% de demanda"
            icon="Calendar"
            color="purple"
          />
        </div>
      )}

      {/* Seletor de Produto */}
      <div
        className="glass-card animate-fade-in"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label className="input-label" style={{ margin: 0, fontWeight: 600 }}>Visualizar Previsão de:</label>
          <select
            className="select"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            style={{ minWidth: '220px' }}
          >
            {produtosDisponiveis.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
            {produtosDisponiveis.length === 0 && <option value="Pão Francês">Pão Francês</option>}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <Info size={14} style={{ color: 'var(--accent-cyan)' }} />
          Gráfico mostra os últimos 10 dias reais + projeção futura de 7 dias da IA.
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            color: 'var(--accent-red)',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Gráfico de Demanda */}
      {loading ? (
        <div className="glass-card" style={{ height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <DemandChart data={chartData} />
      )}

      {/* Projeção Diária Detalhada */}
      <div className="glass-card animate-fade-in" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} style={{ color: 'var(--text-secondary)' }} /> Detalhamento Estatístico (Próximos 7 Dias)
        </h3>

        {itemPredictions.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhuma previsão detalhada disponível para o item selecionado.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Dia da Semana</th>
                  <th>Data Planejada</th>
                  <th>Produto</th>
                  <th style={{ textAlign: 'right' }}>Sugestão de Assados</th>
                  <th style={{ textAlign: 'center' }}>Confiança da IA</th>
                  <th>Status de Confiança</th>
                </tr>
              </thead>
              <tbody>
                {itemPredictions.map((pred, idx) => {
                  const confPercent = Math.round(pred.confianca * 100);
                  const isHighConf = confPercent >= 80;
                  return (
                    <tr key={pred.data}>
                      <td style={{ fontWeight: 600 }}>{pred.dia_semana}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        {new Date(pred.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td>{pred.produto_nome}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        {pred.qtd_prevista} un
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{confPercent}%</td>
                      <td>
                        <span className={`badge ${isHighConf ? 'badge-safe' : 'badge-warning'}`}>
                          {isHighConf ? 'Elevada' : 'Moderada'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
