'use client';

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const CATEGORIAS = [
  { value: 'laticínios', label: 'Laticínios' },
  { value: 'farinhas', label: 'Farinhas e Grãos' },
  { value: 'proteínas', label: 'Proteínas e Ovos' },
  { value: 'frutas', label: 'Frutas e Verduras' },
  { value: 'fermentação', label: 'Fermentação' },
  { value: 'açúcares', label: 'Açúcares e Adoçantes' },
  { value: 'óleos', label: 'Óleos e Gorduras' },
  { value: 'temperos', label: 'Temperos' },
  { value: 'chocolates', label: 'Chocolates' },
  { value: 'doces', label: 'Doces e Caldas' },
  { value: 'geral', label: 'Geral' },
];

const UNIDADES = [
  { value: 'kg', label: 'Quilograma (kg)' },
  { value: 'gramas', label: 'Gramas (g)' },
  { value: 'litros', label: 'Litros (L)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'unidades', label: 'Unidades (un)' },
  { value: 'caixas', label: 'Caixas' },
  { value: 'sacos', label: 'Sacos' },
];

export default function EstoqueModal({ isOpen, onClose, onSave, activeItem }) {
  const [formData, setFormData] = useState({
    nome: '',
    categoria: 'geral',
    quantidade_atual: '',
    unidade: 'kg',
    lote: '',
    data_validade: '',
    custo_unitario: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeItem) {
      setFormData({
        nome: activeItem.nome || '',
        categoria: activeItem.categoria || 'geral',
        quantidade_atual: activeItem.quantidade_atual || '',
        unidade: activeItem.unidade || 'kg',
        lote: activeItem.lote || '',
        data_validade: activeItem.data_validade || '',
        custo_unitario: activeItem.custo_unitario || '',
      });
    } else {
      setFormData({
        nome: '',
        categoria: 'geral',
        quantidade_atual: '',
        unidade: 'kg',
        lote: '',
        data_validade: '',
        custo_unitario: '',
      });
    }
    setError('');
  }, [activeItem, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validações básicas
    if (!formData.nome.trim()) {
      setError('O nome do insumo é obrigatório.');
      return;
    }
    if (formData.quantidade_atual === '' || Number(formData.quantidade_atual) < 0) {
      setError('A quantidade deve ser um número maior ou igual a zero.');
      return;
    }
    if (!formData.data_validade) {
      setError('A data de validade é obrigatória.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        quantidade_atual: Number(formData.quantidade_atual),
        custo_unitario: formData.custo_unitario ? Number(formData.custo_unitario) : null,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Ocorreu um erro ao salvar o item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal animate-slide-in" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '540px' }}>
        {/* Header */}
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
            {activeItem ? '📝 Editar Insumo' : '📦 Adicionar Insumo'}
          </h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} style={{ width: '32px', height: '32px', padding: 0 }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

            <div className="input-group">
              <label className="input-label">Nome do Insumo</label>
              <input
                type="text"
                name="nome"
                className="input"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Ex: Leite Integral"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Categoria</label>
                <select name="categoria" className="select" value={formData.categoria} onChange={handleChange}>
                  {CATEGORIAS.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Lote</label>
                <input
                  type="text"
                  name="lote"
                  className="input"
                  value={formData.lote}
                  onChange={handleChange}
                  placeholder="Ex: LT-2025"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Quantidade</label>
                <input
                  type="number"
                  name="quantidade_atual"
                  className="input"
                  value={formData.quantidade_atual}
                  onChange={handleChange}
                  placeholder="Ex: 30"
                  step="any"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Unidade de Medida</label>
                <select name="unidade" className="select" value={formData.unidade} onChange={handleChange}>
                  {UNIDADES.map((un) => (
                    <option key={un.value} value={un.value}>
                      {un.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Data de Validade</label>
                <input
                  type="date"
                  name="data_validade"
                  className="input"
                  value={formData.data_validade}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Custo Unitário (R$)</label>
                <input
                  type="number"
                  name="custo_unitario"
                  className="input"
                  value={formData.custo_unitario}
                  onChange={handleChange}
                  placeholder="Ex: 4.50"
                  step="any"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} disabled={submitting}>
              {submitting ? (
                <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
              ) : (
                <Save size={16} />
              )}
              {activeItem ? 'Salvar Alterações' : 'Adicionar ao Estoque'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
