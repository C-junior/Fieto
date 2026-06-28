'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Thermometer,
  Droplets,
  Radio,
  RefreshCw,
  Sliders,
  ShieldAlert,
  CheckCircle,
  Wifi,
  Eye,
  Activity,
  AlertTriangle,
  Play,
  Calendar,
} from 'lucide-react';

export default function SensoresPage() {
  // Target values for sensors
  const [camaraFriaTarget, setCamaraFriaTarget] = useState(4.2);
  const [fermentacaoTempTarget, setFermentacaoTempTarget] = useState(28.0);
  const [fermentacaoHumTarget, setFermentacaoHumTarget] = useState(85.0);
  const [fornoTempTarget, setFornoTempTarget] = useState(180.0);
  const [motionActive, setMotionActive] = useState(false);

  // Live fluctuated values
  const [camaraFria, setCamaraFria] = useState(4.2);
  const [fermentacaoTemp, setFermentacaoTemp] = useState(28.0);
  const [fermentacaoHum, setFermentacaoHum] = useState(85.0);
  const [fornoTemp, setFornoTemp] = useState(180.0);

  // Telemetria logs
  const [logs, setLogs] = useState([
    { id: 1, time: new Date(Date.now() - 600000).toLocaleTimeString('pt-BR'), text: 'Rede IoT conectada com sucesso.' },
    { id: 2, time: new Date(Date.now() - 300000).toLocaleTimeString('pt-BR'), text: 'Telemetria dos sensores calibrada.' },
    { id: 3, time: new Date().toLocaleTimeString('pt-BR'), text: 'Canal de telemetria ativo e online.' },
  ]);

  const addLog = useCallback((text) => {
    setLogs((prev) => [
      {
        id: Date.now(),
        time: new Date().toLocaleTimeString('pt-BR'),
        text,
      },
      ...prev.slice(0, 9), // limit to top 10 logs
    ]);
  }, []);

  // Fluctuating values on interval to look real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setCamaraFria((target) => {
        const diff = (Math.random() - 0.5) * 0.2;
        return Math.round((camaraFriaTarget + diff) * 10) / 10;
      });

      setFermentacaoTemp((target) => {
        const diff = (Math.random() - 0.5) * 0.1;
        return Math.round((fermentacaoTempTarget + diff) * 10) / 10;
      });

      setFermentacaoHum((target) => {
        const diff = (Math.random() - 0.5) * 0.4;
        return Math.round((fermentacaoHumTarget + diff) * 10) / 10;
      });

      setFornoTemp((target) => {
        const diff = (Math.random() - 0.5) * 0.6;
        return Math.round((fornoTempTarget + diff) * 10) / 10;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [camaraFriaTarget, fermentacaoTempTarget, fermentacaoHumTarget, fornoTempTarget]);

  // Chamber Status check
  const camaraFriaStatus = useMemo(() => {
    if (camaraFria > 6.5) return { text: 'Crítico', class: 'text-danger border-danger pulse-danger' };
    if (camaraFria > 5.5) return { text: 'Atenção', class: 'text-warning border-warning' };
    return { text: 'Normal', class: 'text-green border-green' };
  }, [camaraFria]);

  // Fermentation Status check
  const fermentacaoStatus = useMemo(() => {
    const tempOOR = fermentacaoTemp < 25 || fermentacaoTemp > 31;
    const humOOR = fermentacaoHum < 75 || fermentacaoHum > 92;
    if (tempOOR || humOOR) return { text: 'Desvio', class: 'text-warning border-warning' };
    return { text: 'Normal', class: 'text-green border-green' };
  }, [fermentacaoTemp, fermentacaoHum]);

  // Oven status check
  const fornoStatus = useMemo(() => {
    if (fornoTemp > 195) return { text: 'Superaquecido', class: 'text-danger border-danger' };
    if (fornoTemp < 160) return { text: 'Resfriando', class: 'text-cyan border-cyan' };
    return { text: 'Assando', class: 'text-green border-green' };
  }, [fornoTemp]);

  const simulateChamberFailure = () => {
    setCamaraFriaTarget(13.8);
    setCamaraFria(13.8);
    const newAlert = {
      id: 'sensor-alert-chamber',
      type: 'SENSOR',
      severity: 'CRITICAL',
      priority_score: 9.5,
      title: 'Câmara Fria: Temp Crítica',
      message: 'Sensor 01 registrou 13.8°C (ideal: 2.0°C - 6.0°C). Risco de perda de insumos refrigerados.',
      suggestion: 'Verifique o fechamento da porta ou acione a manutenção do compressor.',
      item_name: 'Câmara Fria',
      created_at: new Date().toISOString(),
      dismissed: false,
    };

    try {
      const stored = localStorage.getItem('diana-simulated-alerts');
      let alerts = stored ? JSON.parse(stored) : [];
      alerts = alerts.filter((a) => a.id !== newAlert.id);
      alerts.push(newAlert);
      localStorage.setItem('diana-simulated-alerts', JSON.stringify(alerts));

      window.dispatchEvent(new Event('diana-alerts-updated'));
      addLog('ALERTA: Câmara Fria superou 6°C! Telemetria enviou alarme crítico para DIANA.');
    } catch (e) {
      console.error(e);
    }
  };

  const simulateMotionAlert = () => {
    setMotionActive(true);
    const newAlert = {
      id: 'sensor-alert-motion',
      type: 'SENSOR',
      severity: 'WARNING',
      priority_score: 7.8,
      title: 'Movimento no Estoque',
      message: 'Sensor detectou presença no Estoque de Insumos fora do horário comercial (telemetria noturna ativa).',
      suggestion: 'Verifique as câmeras locais de monitoramento ou acione a portaria.',
      item_name: 'Estoque de Insumos',
      created_at: new Date().toISOString(),
      dismissed: false,
    };

    try {
      const stored = localStorage.getItem('diana-simulated-alerts');
      let alerts = stored ? JSON.parse(stored) : [];
      alerts = alerts.filter((a) => a.id !== newAlert.id);
      alerts.push(newAlert);
      localStorage.setItem('diana-simulated-alerts', JSON.stringify(alerts));

      window.dispatchEvent(new Event('diana-alerts-updated'));
      addLog('ALERTA: Presença detectada no Estoque de Insumos às ' + new Date().toLocaleTimeString('pt-BR'));

      // Keep motion badge active for 8s
      setTimeout(() => {
        setMotionActive(false);
      }, 8000);
    } catch (e) {
      console.error(e);
    }
  };

  const resetSensors = () => {
    setCamaraFriaTarget(4.2);
    setCamaraFria(4.2);
    setFermentacaoTempTarget(28.0);
    setFermentacaoTemp(28.0);
    setFermentacaoHumTarget(85.0);
    setFermentacaoHum(85.0);
    setFornoTempTarget(180.0);
    setFornoTemp(180.0);
    setMotionActive(false);

    try {
      localStorage.removeItem('diana-simulated-alerts');
      window.dispatchEvent(new Event('diana-alerts-updated'));
      addLog('Telemetria reiniciada. Parâmetros operacionais seguros restaurados.');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="animate-fade-in dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-greeting">Sensores IoT & Telemetria</h1>
          <p className="dashboard-subtitle">
            Acompanhamento em tempo real dos parâmetros operacionais da panificadora e segurança patrimonial.
          </p>
        </div>
        <div className="dashboard-header-right">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 }}>
            <Wifi size={14} className="pulse-green" />
            Rede Telemetria Online
          </div>
        </div>
      </div>

      {/* Grid of Sensors */}
      <div className="grid-2">
        {/* Camara Fria */}
        <div className="glass-card" style={{ padding: '24px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="metric-icon metric-icon-cyan" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
                <Thermometer size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Câmara Fria</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Sensor Temp #01</span>
              </div>
            </div>
            <span className={`badge ${camaraFriaStatus.class}`} style={{ border: '1px solid', padding: '4px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700 }}>
              {camaraFriaStatus.text}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '24px 0' }}>
            <strong style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: camaraFria > 6.5 ? 'var(--accent-red)' : 'var(--text-primary)' }}>
              {camaraFria}
            </strong>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>°C</span>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Mínimo ideal: 2.0°C</span>
            <span>Máximo ideal: 6.0°C</span>
          </div>
          <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '999px', marginTop: '8px', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute',
              left: '0',
              height: '100%',
              width: `${Math.min(100, Math.max(0, (camaraFria / 15) * 100))}%`,
              background: camaraFria > 6.5 ? 'var(--accent-red)' : 'var(--accent-cyan)',
              transition: 'width 0.5s ease-out'
            }} />
          </div>
        </div>

        {/* Camara de Fermentacao */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="metric-icon metric-icon-purple" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
                <Droplets size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Câmara de Fermentação</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Sensor Temp/Umidade #02</span>
              </div>
            </div>
            <span className={`badge ${fermentacaoStatus.class}`} style={{ border: '1px solid', padding: '4px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700 }}>
              {fermentacaoStatus.text}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '20px 0' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Temperatura</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                <strong style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{fermentacaoTemp}</strong>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>°C</span>
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Ideal: 28°C (26-30)</span>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '20px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Umidade Relativa</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                <strong style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-cyan)' }}>{fermentacaoHum}</strong>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>%</span>
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Ideal: 85% (80-90)</span>
            </div>
          </div>
        </div>

        {/* Forno */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="metric-icon metric-icon-orange" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
                <Thermometer size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Forno de Lastro</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Sensor Alta Temp #03</span>
              </div>
            </div>
            <span className={`badge ${fornoStatus.class}`} style={{ border: '1px solid', padding: '4px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700 }}>
              {fornoStatus.text}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '24px 0' }}>
            <strong style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-orange)' }}>
              {fornoTemp}
            </strong>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>°C</span>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Alvo Receita: {fornoTempTarget}°C</span>
            <span>Ideal Assar: 175°C - 185°C</span>
          </div>
        </div>

        {/* Sensor de Movimento */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="metric-icon metric-icon-red" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
                <Eye size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Estoque de Insumos</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Sensor de Presença #04</span>
              </div>
            </div>
            <span className={`badge ${motionActive ? 'badge-critical pulsing' : 'text-secondary border-subtle'}`} style={{ border: '1px solid', padding: '4px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700 }}>
              {motionActive ? 'MOVIMENTO DETECTADO' : 'NENHUM MOVIMENTO'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '12px 0' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Histórico Recente de Presença</span>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {logs.filter(l => l.text.includes('Presença')).length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '6px 0' }}>Nenhum movimento registrado recentemente</div>
              ) : (
                logs.filter(l => l.text.includes('Presença')).slice(0, 3).map((log) => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-red)' }}>
                    <span>⚠️ Movimento detectado</span>
                    <strong>{log.time}</strong>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Control & Logs Grid */}
      <div className="grid-2" style={{ gridTemplateColumns: '3fr 2fr', gap: '24px' }}>
        {/* Manual Simulation Controls */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <Sliders size={18} className="text-cyan" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Painel de Simulação (Mockup Interativo)</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Cámara Fria Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                <span>Temperatura Câmara Fria (Ideal &lt; 6°C)</span>
                <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>{camaraFriaTarget}°C</strong>
              </div>
              <input
                type="range"
                min="0"
                max="18"
                step="0.1"
                className="w-full cursor-pointer accent-cyan"
                value={camaraFriaTarget}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCamaraFriaTarget(val);
                  setCamaraFria(val);
                  if (val > 6.5) {
                    addLog(`Simulação: Temperatura da Câmara Fria elevada manualmente para ${val}°C.`);
                  }
                }}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
              />
            </div>

            {/* Cámara de Fermentacao Sliders */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span>Temp. Fermentador</span>
                  <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fermentacaoTempTarget}°C</strong>
                </div>
                <input
                  type="range"
                  min="20"
                  max="35"
                  step="0.5"
                  className="w-full cursor-pointer"
                  value={fermentacaoTempTarget}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setFermentacaoTempTarget(val);
                    setFermentacaoTemp(val);
                  }}
                  style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span>Umidade Fermentador</span>
                  <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fermentacaoHumTarget}%</strong>
                </div>
                <input
                  type="range"
                  min="65"
                  max="98"
                  step="1"
                  className="w-full cursor-pointer"
                  value={fermentacaoHumTarget}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setFermentacaoHumTarget(val);
                    setFermentacaoHum(val);
                  }}
                  style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                />
              </div>
            </div>

            {/* Presets Action Row */}
            <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button
                className="btn btn-resolve btn-sm"
                onClick={simulateChamberFailure}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: 'var(--accent-red)' }}
              >
                <ShieldAlert size={14} /> Simular Falha Câmara Fria
              </button>

              <button
                className="btn btn-resolve btn-sm"
                onClick={simulateMotionAlert}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', color: 'var(--accent-yellow)' }}
              >
                <Eye size={14} /> Simular Movimento no Estoque
              </button>

              <button
                className="btn btn-secondary btn-sm"
                onClick={resetSensors}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--accent-green)' }}
              >
                <RefreshCw size={14} /> Restaurar Sensores
              </button>
            </div>
          </div>
        </div>

        {/* Live Logs */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <Activity size={18} className="text-purple" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Logs de Atividade IoT</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
            {logs.map((log) => {
              const isAlert = log.text.includes('ALERTA');
              return (
                <div key={log.id} style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', padding: '8px', background: isAlert ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.01)', borderRadius: '6px', borderLeft: isAlert ? '3px solid var(--accent-red)' : '3px solid var(--border-accent)' }}>
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
                    {log.time}
                  </span>
                  <span style={{ color: isAlert ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                    {log.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
