'use client';

import { useEffect, useState, useMemo } from 'react';
import EstoqueTable from '@/components/EstoqueTable';
import EstoqueModal from '@/components/EstoqueModal';
import MetricCard from '@/components/MetricCard';
import { useEstoque } from '@/hooks/useEstoque';
import { Plus, Search, Filter } from 'lucide-react';

export default function EstoquePage() {
  const {
    items,
    loading,
    stats,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    getExpiryStatus,
    getDaysUntilExpiry,
  } = useEstoque();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, expired, critical, warning, safe
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Filtragem de itens do estoque
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Busca por texto
      const matchSearch = item.nome.toLowerCase().includes(search.toLowerCase()) ||
                          (item.lote && item.lote.toLowerCase().includes(search.toLowerCase()));

      // 2. Filtro por status de validade
      if (filterStatus === 'all') return matchSearch;
      
      const itemStatus = getExpiryStatus(item.data_validade);
      return matchSearch && itemStatus === filterStatus;
    });
  }, [items, search, filterStatus, getExpiryStatus]);

  const handleEditClick = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCreateClick = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleSaveItem = async (formData) => {
    if (editingItem) {
      await updateItem(editingItem.id, formData);
    } else {
      await createItem(formData);
    }
  };

  const handleDeleteItem = async (id) => {
    if (confirm('Tem certeza de que deseja remover este insumo do estoque?')) {
      await deleteItem(id);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Estoque Operacional</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Controle de inventário de matéria-prima e monitoramento ativo de vencimentos.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleCreateClick}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} /> Entrada de Insumo
        </button>
      </div>

      {/* Resumos rápidos */}
      <div className="grid-3" style={{ gap: '20px' }}>
        <MetricCard
          title="Valor Total em Insumos"
          value={stats.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          label={`${stats.total} itens cadastrados no total`}
          icon="Package"
          color="purple"
        />
        <MetricCard
          title="Itens Vencidos / Críticos"
          value={`${stats.expired} / ${stats.critical}`}
          label="Ação corretiva imediata sugerida"
          icon="AlertOctagon"
          color="red"
        />
        <MetricCard
          title="Itens em Atenção"
          value={`${stats.warning}`}
          label="Validade expira em 4 a 7 dias"
          icon="Clock"
          color="yellow"
        />
      </div>

      {/* Toolbar */}
      <div
        className="glass-card animate-fade-in"
        style={{
          padding: '16px 20px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', flex: 1, minWidth: '280px' }}>
          {/* Busca */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar insumo por nome ou lote..."
              style={{ paddingLeft: '36px', width: '100%' }}
            />
          </div>

          {/* Filtro de Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
            <select
              className="select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ minWidth: '160px' }}
            >
              <option value="all">Todos os Status</option>
              <option value="expired">🚨 Expirados</option>
              <option value="critical">🔴 Críticos (≤3d)</option>
              <option value="warning">🟡 Atenção (4-7d)</option>
              <option value="safe">🟢 Seguros (&gt;7d)</option>
            </select>
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Exibindo {filteredItems.length} de {items.length} insumos
        </div>
      </div>

      {/* Tabela de Insumos */}
      <EstoqueTable
        items={filteredItems}
        loading={loading}
        onEdit={handleEditClick}
        onDelete={handleDeleteItem}
        getExpiryStatus={getExpiryStatus}
        getDaysUntilExpiry={getDaysUntilExpiry}
      />

      {/* Modal de CRUD */}
      <EstoqueModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveItem}
        activeItem={editingItem}
      />
    </div>
  );
}
