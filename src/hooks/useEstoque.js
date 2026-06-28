'use client';

import { useState, useCallback } from 'react';

const EMPRESA_ID = 'demo-padaria-001';

export function useEstoque() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/estoque?empresa_id=${EMPRESA_ID}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao buscar estoque');
      setItems(data.items || []);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar estoque:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = useCallback(async (itemData) => {
    setError(null);
    try {
      const res = await fetch('/api/estoque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...itemData, empresa_id: EMPRESA_ID }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar item');
      await fetchItems();
      return data.item;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchItems]);

  const updateItem = useCallback(async (id, itemData) => {
    setError(null);
    try {
      const res = await fetch(`/api/estoque/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar item');
      await fetchItems();
      return data.item;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchItems]);

  const deleteItem = useCallback(async (id) => {
    setError(null);
    try {
      const res = await fetch(`/api/estoque/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir item');
      await fetchItems();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchItems]);

  const getExpiryStatus = useCallback((dataValidade) => {
    if (!dataValidade) return 'safe';
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const validade = new Date(dataValidade);
    const diffDays = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expired';
    if (diffDays <= 3) return 'critical';
    if (diffDays <= 7) return 'warning';
    return 'safe';
  }, []);

  const getDaysUntilExpiry = useCallback((dataValidade) => {
    if (!dataValidade) return null;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const validade = new Date(dataValidade);
    return Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
  }, []);

  const stats = {
    total: items.length,
    critical: items.filter(i => getExpiryStatus(i.data_validade) === 'critical').length,
    warning: items.filter(i => getExpiryStatus(i.data_validade) === 'warning').length,
    expired: items.filter(i => getExpiryStatus(i.data_validade) === 'expired').length,
    safe: items.filter(i => getExpiryStatus(i.data_validade) === 'safe').length,
    valorTotal: items.reduce((acc, i) => acc + (i.quantidade_atual * (i.custo_unitario || 0)), 0),
    valorEmRisco: items
      .filter(i => ['critical', 'expired'].includes(getExpiryStatus(i.data_validade)))
      .reduce((acc, i) => acc + (i.quantidade_atual * (i.custo_unitario || 0)), 0),
  };

  return {
    items,
    loading,
    error,
    stats,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    getExpiryStatus,
    getDaysUntilExpiry,
  };
}
