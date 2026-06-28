'use client';

import { useState, useCallback } from 'react';

const EMPRESA_ID = 'demo-padaria-001';

export function useProducao() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/producao?empresa_id=${EMPRESA_ID}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao buscar produção');
      setRecords(data.records || []);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar produção:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createRecord = useCallback(async (recordData) => {
    setError(null);
    try {
      const res = await fetch('/api/producao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...recordData, empresa_id: EMPRESA_ID }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao registrar produção');
      await fetchRecords();
      return data.record;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchRecords]);

  const getPercentualPerda = useCallback((record) => {
    if (!record.qtd_produzida || record.qtd_produzida === 0) return 0;
    return ((record.qtd_perda || 0) / record.qtd_produzida * 100).toFixed(1);
  }, []);

  const stats = {
    totalRegistros: records.length,
    totalProduzido: records.reduce((acc, r) => acc + Number(r.qtd_produzida || 0), 0),
    totalVendido: records.reduce((acc, r) => acc + Number(r.qtd_vendida || 0), 0),
    totalPerda: records.reduce((acc, r) => acc + Number(r.qtd_perda || 0), 0),
    percentualPerda: records.length > 0
      ? (records.reduce((acc, r) => acc + Number(r.qtd_perda || 0), 0) /
         records.reduce((acc, r) => acc + Number(r.qtd_produzida || 0), 0) * 100).toFixed(1)
      : '0.0',
    produtosMaisPerda: Object.entries(
      records.reduce((acc, r) => {
        if (!acc[r.produto_nome]) acc[r.produto_nome] = { produzido: 0, perda: 0 };
        acc[r.produto_nome].produzido += Number(r.qtd_produzida || 0);
        acc[r.produto_nome].perda += Number(r.qtd_perda || 0);
        return acc;
      }, {})
    ).map(([nome, data]) => ({
      nome,
      perda: data.perda,
      percentual: data.produzido > 0 ? (data.perda / data.produzido * 100).toFixed(1) : '0.0',
    })).sort((a, b) => b.perda - a.perda),
  };

  return {
    records,
    loading,
    error,
    stats,
    fetchRecords,
    createRecord,
    getPercentualPerda,
  };
}
