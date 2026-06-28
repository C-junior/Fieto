'use client';

import { useState } from 'react';
import { X, FileText, Truck, CheckCircle, Package } from 'lucide-react';
import { showToast } from './Toast';

const NF_MOCK = {
  numero: 'NF-e 001.432.877',
  fornecedor: 'Moinho Sul Catarinense Ltda',
  cnpj: '84.028.316/0001-53',
  emissao: '28/06/2026',
  itens: [
    { nome: 'Farinha de Trigo Especial', qtd: 150, unidade: 'kg', validade: '15/12/2026', custo: 'R$ 4,20' },
    { nome: 'Fermento Biológico Fresco', qtd: 10, unidade: 'kg', validade: '30/07/2026', custo: 'R$ 18,50' },
    { nome: 'Açúcar Refinado', qtd: 80, unidade: 'kg', validade: '20/03/2027', custo: 'R$ 3,90' },
  ],
};

export default function NotaFiscalModal({ isOpen, onClose }) {
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);

  if (!isOpen) return null;

  const totalValue = 'R$ 1.127,00';

  const handleProcess = () => {
    setProcessing(true);
    // Instant for the pitch — no API call
    setTimeout(() => {
      setProcessing(false);
      setProcessed(true);
      showToast({
        title: 'Nota Fiscal processada com sucesso!',
        message: `3 itens adicionados ao estoque. Total: ${totalValue}`,
      });
      setTimeout(() => {
        setProcessed(false);
        onClose();
      }, 400);
    }, 300);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="modal animate-slide-in"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '640px' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="metric-icon metric-icon-green" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
              <FileText size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>📄 Importar Nota Fiscal</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Entrada automática de insumos via NF-e</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} style={{ width: '32px', height: '32px', padding: 0 }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* NF-e Info Card */}
          <div
            style={{
              background: 'rgba(0, 212, 255, 0.06)',
              border: '1px solid rgba(0, 212, 255, 0.15)',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Número</span>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{NF_MOCK.numero}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data de Emissão</span>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{NF_MOCK.emissao}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fornecedor</span>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={14} style={{ color: 'var(--accent-green)' }} />
                {NF_MOCK.fornecedor}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>— CNPJ {NF_MOCK.cnpj}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Package size={14} />
              Itens Identificados ({NF_MOCK.itens.length})
            </div>
            <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Item</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Qtd</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Validade</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Custo Unit.</th>
                  </tr>
                </thead>
                <tbody>
                  {NF_MOCK.itens.map((item, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 500 }}>{item.nome}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{item.qtd} {item.unidade}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '0.8rem' }}>{item.validade}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>{item.custo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 20px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '10px',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Valor Total da Nota</span>
            <span style={{ fontWeight: 700, fontSize: '1.15rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>{totalValue}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={processing}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={handleProcess}
            disabled={processing || processed}
          >
            {processed ? (
              <>
                <CheckCircle size={16} />
                Processada!
              </>
            ) : processing ? (
              <>
                <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                Processando...
              </>
            ) : (
              <>
                <FileText size={16} />
                Processar Nota
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
