'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export default function DemandChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div
        className="glass-card"
        style={{
          height: '350px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        Nenhum dado disponível para renderizar o gráfico.
      </div>
    );
  }

  // Customização do Tooltip para bater com o Design System do Integra
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dateStr = new Date(label + 'T12:00:00').toLocaleDateString('pt-BR');
      return (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            padding: '12px 16px',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
            📅 {dateStr}
          </p>
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {payload.map((entry, index) => (
              <span key={index} style={{ fontSize: '0.8rem', color: entry.color }}>
                {entry.name}: {Number(entry.value).toFixed(0)} un
              </span>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container animate-fade-in">
      <div className="chart-title">Análise de Demanda vs. Produção Real</div>
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <ComposedChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              bottom: 0,
              left: -10,
            }}
          >
            <defs>
              <linearGradient id="colorPrevista" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
            <XAxis
              dataKey="data"
              stroke="var(--text-muted)"
              style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}
              tickFormatter={(tick) => {
                const date = new Date(tick + 'T12:00:00');
                return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
              }}
            />
            <YAxis
              stroke="var(--text-muted)"
              style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                paddingTop: '16px',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
              }}
            />
            {/* Área de Previsão */}
            <Area
              name="Previsão de Demanda"
              type="monotone"
              dataKey="qtd_prevista"
              stroke="var(--accent-cyan)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPrevista)"
              strokeDasharray="4 4"
            />
            {/* Barra de Produzido */}
            <Bar
              name="Produção Real"
              dataKey="qtd_produzida"
              barSize={16}
              fill="var(--accent-purple)"
              radius={[4, 4, 0, 0]}
              opacity={0.7}
            />
            {/* Linha de Vendas */}
            <Line
              name="Vendas Reais"
              type="monotone"
              dataKey="qtd_vendida"
              stroke="var(--accent-green)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            {/* Linha de Perdas */}
            <Line
              name="Perdas Reais"
              type="monotone"
              dataKey="qtd_perda"
              stroke="var(--accent-red)"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={{ r: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
