import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { MessageSquare, Users } from 'lucide-react';

const PALETTE_COLORS = ['#0C6038', '#808B47', '#2D4C39', '#6C1D24', '#9DAA58', '#536A5C'];

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1.5px solid var(--meadow-green)',
        borderRadius: '4px',
        padding: '0.55rem 0.75rem',
        boxShadow: '3px 3px 0px rgba(12, 96, 56, 0.15)',
        fontSize: '0.8rem',
      }}>
        <div style={{
          fontWeight: 700,
          color: 'var(--text-main)',
          marginBottom: '0.2rem',
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '0.95rem',
        }}>
          {label}
        </div>
        <div style={{ color: 'var(--text-muted)' }}>
          Valor: <strong style={{ color: data.color }}>{data.value} {data.payload.porcentaje ? `(${data.payload.porcentaje}%)` : ''}</strong>
        </div>
      </div>
    );
  }
  return null;
}

export default function DepartmentAndTopicsCharts({
  topTemas = [],
  porDepartamento = {},
}) {
  const [activeTab, setActiveTab] = useState('temas'); // 'temas' | 'departamentos'

  // Preparar datos del Top 5 de temas
  const temasData = (topTemas || []).map((t, idx) => ({
    nombre: t.tema ? (t.tema.length > 25 ? `${t.tema.slice(0, 23)}...` : t.tema) : `Tema ${idx + 1}`,
    nombreCompleto: t.tema,
    valor: t.cantidad || t.porcentaje || 10,
    porcentaje: t.porcentaje,
  }));

  // Preparar datos de ausencias por departamento
  const deptData = Object.entries(porDepartamento || {}).map(([dept, count]) => ({
    nombre: dept,
    valor: count,
  }));

  const currentData = activeTab === 'temas' ? temasData : deptData;

  return (
    <div className="card-editorial" style={{ height: '360px', width: '100%', padding: '1.25rem' }}>
      <div className="card-header" style={{ marginBottom: '0.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--meadow-green)' }}>
            {activeTab === 'temas' ? 'Top 5 de Temas Consultados' : 'Ausencias por Departamento'}
          </h3>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            {activeTab === 'temas'
              ? 'Políticas con mayor interés acumulado en el portal'
              : 'Distribución nominal de ausencias justificadas hoy'}
          </p>
        </div>

        {/* SELECTOR DE PESTAÑA EDITORIAL */}
        <div style={{
          display: 'flex',
          gap: '0.35rem',
          backgroundColor: 'var(--peach-light)',
          padding: '0.25rem',
          borderRadius: '4px',
          border: '1px solid var(--border-color)',
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('temas')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '2px',
              border: activeTab === 'temas' ? '1.5px solid var(--meadow-green)' : '1px solid transparent',
              cursor: 'pointer',
              backgroundColor: activeTab === 'temas' ? 'var(--meadow-green)' : 'transparent',
              color: activeTab === 'temas' ? 'var(--peach-light)' : 'var(--text-main)',
              transition: 'all 0.15s ease',
            }}
          >
            <MessageSquare size={13} />
            <span>Top Temas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('departamentos')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '2px',
              border: activeTab === 'departamentos' ? '1.5px solid var(--mustard-green)' : '1px solid transparent',
              cursor: 'pointer',
              backgroundColor: activeTab === 'departamentos' ? 'var(--mustard-green)' : 'transparent',
              color: activeTab === 'departamentos' ? '#FFFFFF' : 'var(--text-main)',
              transition: 'all 0.15s ease',
            }}
          >
            <Users size={13} />
            <span>Por Departamento</span>
          </button>
        </div>
      </div>

      <div style={{ width: '100%', height: '265px', marginTop: '0.5rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={currentData} margin={{ top: 10, right: 15, left: -20, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis
              dataKey="nombre"
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              angle={-15}
              textAnchor="end"
              interval={0}
              height={40}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={45}>
              {currentData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PALETTE_COLORS[index % PALETTE_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
