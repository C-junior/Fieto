'use client';

import { useEffect, useState } from 'react';
import MetricCard from '@/components/MetricCard';
import { useProducao } from '@/hooks/useProducao';
import { Plus, Save, History, AlertTriangle } from 'lucide-react';

const PRODUTOS_SUGERIDOS = [
  'Pão Francês',
  'Bolo de Chocolate',
  'Pão de Forma',
  'Biscoito Amanteigado',
  'Croissant',
];

export default function ProducaoPage() {
  const {
    records,
    loading,
    stats,
    fetchRecords,
    createRecord,
    getPercentualPerda,
  } = useProducao();

  const [form, setForm] = useState({
    produto_nome: PRODUTOS_SUGERIDOS[0],
    data: new Date().toISOString().split('T')[0],
    qtd_produzida: '',
    qtd_vendida: '',
    qtd_perda: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!form.qtd_produzida || Number(form.qtd_produzida) <= 0) {
      setError('A quantidade produzida deve ser maior que zero.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        produto_nome: form.produto_nome,
        data: form.data,
        qtd_produzida: Number(form.qtd_produzida),
        qtd_vendida: form.qtd_vendida !== '' ? Number(form.qtd_vendida) : 0,
        qtd_perda: form.qtd_perda !== '' ? Number(form.qtd_perda) : undefined,
      };

      await createRecord(payload);
      
      // Limpar campos de quantidade
      setForm((prev) => ({
        ...prev,
        qtd_produzida: '',
        qtd_vendida: '',
        qtd_perda: '',
      }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Erro ao registrar produção.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Produção & Vendas</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Registro de lotes de panificação e calibração de dados históricos para motores de IA.
          </p>
        </div>
      </div>

      {/* Estatísticas Rápidas de Produção */}
      <div className="grid-3" style={{ gap: '20px' }}>
        <MetricCard
          title="Produção Total Acumulada"
          value={`${Number(stats.totalProduzido || 0).toLocaleString('pt-BR')} un`}
          label="Soma de todos os lotes históricos"
          icon="Factory"
          color="purple"
        />
        <MetricCard
          title="Vendas Efetivas"
          value={`${Number(stats.totalVendido || 0).toLocaleString('pt-BR')} un`}
          label={`Eficiência comercial de ${(100 - Number(stats.percentualPerda)).toFixed(1)}%`}
          icon="TrendingUp"
          color="green"
        />
        <MetricCard
          title="Desperdício de Balcão"
          value={`${Number(stats.totalPerda || 0).toLocaleString('pt-BR')} un`}
          label={`Média de ${stats.percentualPerda}% de perda diária`}
          icon="Trash2"
          color="red"
        />
      </div>

      {/* Grid: Formulário + Top perdas */}
      <div className="grid-2" style={{ gap: '24px', alignItems: 'stretch' }}>
        {/* Formulário de Registro */}
        <div className="glass-card animate-fade-in" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} style={{ color: 'var(--accent-cyan)' }} /> Registrar Produção Diária
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  color: 'var(--accent-red)',
                  fontSize: '0.85rem',
                }}
              >
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div
                style={{
                  padding: '12px 16px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  color: 'var(--accent-green)',
                  fontSize: '0.85rem',
                }}
              >
                ✨ Lote registrado e recalibrado com sucesso no banco de dados!
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Nome do Produto</label>
              <select name="produto_nome" className="select" value={form.produto_nome} onChange={handleChange}>
                {PRODUTOS_SUGERIDOS.map((prod) => (
                  <option key={prod} value={prod}>
                    {prod}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Data da Produção</label>
              <input type="date" name="data" className="input" value={form.data} onChange={handleChange} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Quantidade Assada (un)</label>
                <input
                  type="number"
                  name="qtd_produzida"
                  className="input"
                  value={form.qtd_produzida}
                  onChange={handleChange}
                  placeholder="Ex: 150"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Quantidade Vendida (un)</label>
                <input
                  type="number"
                  name="qtd_vendida"
                  className="input"
                  value={form.qtd_vendida}
                  onChange={handleChange}
                  placeholder="Ex: 132"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Perda/Descarte Manual (Opcional - un)</label>
              <input
                type="number"
                name="qtd_perda"
                className="input"
                value={form.qtd_perda}
                onChange={handleChange}
                placeholder="Deixe em branco para calcular automaticamente"
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                *Se omitido, a perda será a diferença entre assado e vendido.
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginTop: '8px' }} disabled={submitting}>
              {submitting ? <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span> : <Save size={16} />}
              Salvar Lote Operacional
            </button>
          </form>
        </div>

        {/* Top Perdas por Produto */}
        <div className="glass-card animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} style={{ color: 'var(--accent-orange)' }} /> Rank de Desperdício por Produto
          </h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
            {stats.produtosMaisPerda && stats.produtosMaisPerda.length > 0 ? (
              stats.produtosMaisPerda.slice(0, 5).map((prod, idx) => {
                const color = idx === 0 ? 'red' : idx === 1 ? 'orange' : 'yellow';
                return (
                  <div key={prod.nome} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600 }}>{prod.nome}</span>
                      <span style={{ color: `var(--accent-${color})`, fontWeight: 500 }}>
                        {prod.perda.toLocaleString('pt-BR')} un descarte ({prod.percentual}%)
                      </span>
                    </div>
                    {/* Barra de Progresso */}
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, Number(prod.percentual) * 2.5)}%`,
                          background: `var(--accent-${color})`,
                          borderRadius: '4px',
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                Nenhum histórico encontrado para gerar estatísticas.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabela Histórica */}
      <div className="glass-card animate-fade-in" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={18} style={{ color: 'var(--text-secondary)' }} /> Histórico Recente de Lotes (Últimos 90 Dias)
        </h3>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="spinner"></div>
          </div>
        ) : records.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhum lote registrado. Use o formulário acima para criar o primeiro registro.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Produto</th>
                  <th style={{ textAlign: 'right' }}>Assado/Produzido</th>
                  <th style={{ textAlign: 'right' }}>Vendido</th>
                  <th style={{ textAlign: 'right' }}>Perda/Sobras</th>
                  <th style={{ textAlign: 'center' }}>Índice de Perda</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => {
                  const percentual = getPercentualPerda(rec);
                  const isHighLoss = Number(percentual) > 20;
                  return (
                    <tr key={rec.id} className={isHighLoss ? 'expiry-critical' : ''}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        {new Date(rec.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td style={{ fontWeight: 600 }}>{rec.produto_nome}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{Number(rec.qtd_produzida).toLocaleString('pt-BR')}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{Number(rec.qtd_vendida).toLocaleString('pt-BR')}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: isHighLoss ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                        {Number(rec.qtd_perda).toLocaleString('pt-BR')}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${isHighLoss ? 'badge-critical' : Number(percentual) > 10 ? 'badge-warning' : 'badge-safe'}`}>
                          {percentual}%
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
