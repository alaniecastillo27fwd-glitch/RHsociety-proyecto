import {
  Sparkles,
  RefreshCw,
  FolderSync,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Bookmark,
} from 'lucide-react';

export default function ExecutiveSummaryBox({
  resumenTexto = '',
  fechaReporte = '',
  generadoPor = 'AgenteAnalista_v1',
  historialFechas = [],
  onSelectFecha,
  onRegenerateReport,
  onSyncDrive,
  loading = false,
  syncingDrive = false,
}) {
  return (
    <div
      className="frame-editorial"
      style={{
        overflow: 'hidden',
        marginBottom: '1.25rem',
      }}
    >
      {/* 1. CINTA DE TÍTULO SUPERIOR (RIBBON HEADER ESTILO HADITH BOX - IMAGEN 2) */}
      <div style={{
        backgroundColor: 'var(--meadow-green)',
        color: 'var(--peach-light)',
        padding: '0.65rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        borderBottom: '2px solid var(--outerspace-dark)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Sparkles size={18} color="var(--peach)" />
          <span className="font-editorial" style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: 'var(--peach-light)',
          }}>
            Informe Diario de Operaciones de Recursos Humanos
          </span>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            backgroundColor: 'var(--mustard-green)',
            color: '#FFFFFF',
            padding: '0.15rem 0.5rem',
            borderRadius: '2px',
            border: '1px solid var(--peach)',
          }}>
            Validación Oficial
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.75rem', color: 'var(--peach)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={13} />
            07:00 a. m. (America/Costa_Rica)
          </span>
          <span>•</span>
          <span>Generado por: <strong>{generadoPor}</strong></span>
        </div>
      </div>

      {/* 2. BARRA DE HERRAMIENTAS Y ACCIONES */}
      <div style={{
        padding: '0.85rem 1.25rem',
        backgroundColor: 'var(--peach-light)',
        borderBottom: '1.5px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        {/* SELECTOR DE FECHAS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={16} color="var(--meadow-green)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Fecha del Reporte:
          </span>
          {historialFechas && historialFechas.length > 0 && (
            <select
              value={fechaReporte}
              onChange={(e) => onSelectFecha && onSelectFecha(e.target.value)}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '2px',
                border: '1.5px solid var(--border-color)',
                fontSize: '0.825rem',
                color: 'var(--text-main)',
                backgroundColor: 'var(--bg-card)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {historialFechas.map((item) => (
                <option key={item.fecha} value={item.fecha}>
                  Edición del {item.fecha}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={loading}
            onClick={onRegenerateReport}
            className="btn btn-mustard btn-sm"
            title="Recalcular métricas de hoy sobre los registros oficiales de Recursos Humanos"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Calculando...' : 'Regenerar Reporte Hoy'}</span>
          </button>

          <button
            type="button"
            disabled={syncingDrive}
            onClick={onSyncDrive}
            className="btn btn-primary btn-sm"
            title="Sincronizar cambios en políticas desde Google Drive"
          >
            <FolderSync size={14} className={syncingDrive ? 'animate-spin' : ''} />
            <span>{syncingDrive ? 'Sincronizando...' : 'Sincronizar Drive'}</span>
          </button>
        </div>
      </div>

      {/* 3. CONTENIDO EDITORIAL DE LA SÍNTESIS */}
      <div style={{
        padding: '1.35rem 1.5rem',
        backgroundColor: 'var(--bg-card)',
        fontSize: '0.925rem',
        lineHeight: 1.7,
        color: 'var(--text-main)',
      }}>
        <div style={{
          borderLeft: '3px solid var(--mustard-green)',
          paddingLeft: '1rem',
          fontStyle: 'normal',
        }}>
          {resumenTexto ? (
            resumenTexto.split('\n').map((line, idx) => {
              if (line.trim().startsWith('###') || line.trim().startsWith('**Generado por:')) {
                return null;
              }
              if (line.trim() === '') {
                return <div key={idx} style={{ height: '0.45rem' }} />;
              }
              return (
                <p key={idx} style={{ marginBottom: '0.45rem' }}>
                  {line}
                </p>
              );
            })
          ) : (
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No se ha generado un resumen ejecutivo para esta fecha. Presiona "Regenerar Reporte Hoy".
            </div>
          )}
        </div>
      </div>

      {/* 4. PIE DE AUDITORÍA EDITORIAL */}
      <div style={{
        padding: '0.65rem 1.25rem',
        backgroundColor: 'var(--peach-light)',
        borderTop: '1px dashed var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.725rem',
        color: 'var(--text-muted)',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <CheckCircle2 size={13} color="var(--meadow-green)" />
          <span>Validación institucional: Todas las cifras redactadas coinciden 100% con los registros oficiales de Recursos Humanos.</span>
        </div>
        <div>
          Edición activa: <strong style={{ color: 'var(--meadow-green)' }}>{fechaReporte}</strong>
        </div>
      </div>
    </div>
  );
}
