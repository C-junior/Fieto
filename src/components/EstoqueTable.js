'use client';

import { Edit2, Trash2, Shield, AlertTriangle, AlertOctagon, CheckCircle } from 'lucide-react';

export default function EstoqueTable({ items, loading, onEdit, onDelete, getExpiryStatus, getDaysUntilExpiry }) {
  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner"></div>
        <span style={{ marginLeft: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Carregando estoque...</span>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="empty-state">
          <div className="empty-state-text" style={{ fontSize: '1.1rem', fontWeight: 600 }}>Nenhum insumo no estoque</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Adicione insumos para iniciar o gerenciamento inteligente.</div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status, days) => {
    switch (status) {
      case 'expired':
        return <span className="badge badge-critical badge-expired pulse-danger">Expirado</span>;
      case 'critical':
        return <span className="badge badge-critical">Crítico ({days}d)</span>;
      case 'warning':
        return <span className="badge badge-warning">Atenção ({days}d)</span>;
      case 'safe':
      default:
        return <span className="badge badge-safe">Seguro ({days ? `${days}d` : 'Indefinido'})</span>;
    }
  };

  const getRowClass = (status) => {
    if (status === 'expired' || status === 'critical') return 'expiry-critical';
    if (status === 'warning') return 'expiry-warning';
    return '';
  };

  return (
    <div className="glass-card animate-fade-in" style={{ overflowX: 'auto', borderRadius: '16px' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Nome do Insumo</th>
            <th>Categoria</th>
            <th style={{ textAlign: 'right' }}>Qtd Atual</th>
            <th>Unidade</th>
            <th>Lote</th>
            <th>Vencimento</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Custo Unitário</th>
            <th style={{ textAlign: 'center' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const status = getExpiryStatus(item.data_validade);
            const days = getDaysUntilExpiry(item.data_validade);
            const rowClass = getRowClass(status);

            return (
              <tr key={item.id} className={rowClass}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.nome}</td>
                <td>
                  <span style={{ textTransform: 'capitalize', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {item.categoria || 'Geral'}
                  </span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                  {Number(item.quantidade_atual).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </td>
                <td><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.unidade}</span></td>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.lote || '-'}</span></td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                  {item.data_validade ? new Date(item.data_validade + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                </td>
                <td>{getStatusBadge(status, days)}</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                  {item.custo_unitario
                    ? Number(item.custo_unitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : '-'}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      className="btn btn-secondary btn-icon btn-sm"
                      onClick={() => onEdit(item)}
                      title="Editar item"
                      style={{ width: '32px', height: '32px', padding: 0 }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn btn-danger btn-icon btn-sm"
                      onClick={() => onDelete(item.id)}
                      title="Excluir item"
                      style={{ width: '32px', height: '32px', padding: 0 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
