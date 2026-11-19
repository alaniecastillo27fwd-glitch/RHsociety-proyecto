import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1.5px solid var(--meadow-green)',
        borderRadius: '4px',
        padding: '0.65rem 0.85rem',
        boxShadow: '3px 3px 0px rgba(12, 96, 56, 0.15)',
        fontSize: '0.8rem',
      }}>
        <div style={{
          fontWeight: 700,
          color: 'var(--text-main)',
          marginBottom: '0.35rem',
          borderBottom: '1px dashed var(--border-color)',
          paddingBottom: '0.2rem',
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '0.95rem',
        }}>
          Fecha: {label}
        </div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: entry.color, display: 'inline-block' }} />
            <span style={{ color: 'var(--text-muted)' }}>{entry.name}:</span>
            <strong style={{ color: 'var(--text-main)' }}>
              {entry.name.includes('%') ? `${entry.value}%` : entry.value}
            </strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function TrendChart30Days({ data = [] }) {
  // Formatear fechas para el eje X ("YYYY-MM-DD" -> "DD/MM")
  const chartData = (data || []).map((item) => {
    let shortDate = item.fecha;
    if (item.fecha && item.fecha.includes('-')) {
      const parts = item.fecha.split('-');
      shortDate = `${parts[2]}/${parts[1]}`;
    }
    return {
      ...item,
      fechaCorta: shortDate,
    };
  });

  return (
    <div className="card-editorial" style={{ height: '360px', width: '100%', padding: '1.25rem' }}>
      <div className="card-header">
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--meadow-green)' }}>
            Tendencia Histórica de 30 Días
          </h3>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            Evolución de volumen de consultas al chatbot, resolución autónoma y ausentismo laboral
          </p>
        </div>
      </div>

      <div style={{ width: '100%', height: '270px', marginTop: '0.5rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorConsultas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0C6038" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0C6038" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorResolucion" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#808B47" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#808B47" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorAusencias" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6C1D24" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6C1D24" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis
              dataKey="fechaCorta"
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              tickLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              tickLine={false}
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: '0.75rem', paddingBottom: '0.5rem' }}
            />

            <Area
              type="monotone"
              dataKey="total_consultas"
              name="Consultas Chat"
              stroke="#0C6038"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorConsultas)"
            />
            <Area
              type="monotone"
              dataKey="tasa_resolucion_pct"
              name="Resolución Autónoma (%)"
              stroke="#808B47"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorResolucion)"
            />
            <Area
              type="monotone"
              dataKey="total_ausencias"
              name="Ausencias Totales"
              stroke="#6C1D24"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorAusencias)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
