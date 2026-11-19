import { useState } from 'react';
import {
  Check,
  X,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export default function PendingRequestsTable({
  solicitudes = [],
  onApprove,
  onReject,
  loadingId = null,
}) {
  const [rejectModalId, setRejectModalId] = useState(null);
  const [rejectComment, setRejectComment] = useState('');

  const handleConfirmReject = (id) => {
    if (onReject) {
      onReject(id, rejectComment);
    }
    setRejectModalId(null);
    setRejectComment('');
  };

  return (
    <div className="card-editorial" style={{ width: '100%', padding: '1.25rem' }}>
      <div className="card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--meadow-green)' }}>
              Bandeja de Solicitudes Pendientes de Aprobación
            </h3>
            <span className="badge badge-mustard" style={{ fontSize: '0.7rem' }}>
              {solicitudes.length} en espera
            </span>
          </div>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            Las solicitudes con más de 3 días de retraso se destacan preventivamente en alerta institucional
          </p>
        </div>
      </div>

      {solicitudes.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2.5rem 1rem',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--peach-light)',
          borderRadius: '4px',
          border: '1px dashed var(--border-color)',
        }}>
          <CheckCircle2 size={36} color="var(--meadow-green)" style={{ margin: '0 auto 0.5rem auto' }} />
          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.2rem' }}>
            ¡Bandeja de Aprobaciones al Día!
          </div>
          <p style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
            No hay solicitudes de vacaciones ni permisos pendientes de resolución en este momento.
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="corporate-table">
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Departamento</th>
                <th>Tipo Solicitud</th>
                <th>Periodo Solicitado</th>
                <th>Días</th>
                <th>Antigüedad</th>
                <th style={{ textAlign: 'center' }}>Acciones RRHH</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((sol) => {
                const esCritica = sol.antiguedad_mayor_3_dias || sol.dias_pendiente > 3;
                const isLoading = loadingId === sol.id;

                return (
                  <tr
                    key={sol.id}
                    style={{
                      backgroundColor: esCritica ? 'var(--peach-subtle)' : 'transparent',
                    }}
                  >
                    {/* COLABORADOR */}
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {sol.nombre}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        ID: #{sol.id} • Radicado el {sol.fecha_solicitud || 'Reciente'}
                      </div>
                    </td>

                    {/* DEPARTAMENTO */}
                    <td>
                      <span className="badge badge-outerspace" style={{ fontSize: '0.7rem' }}>
                        {sol.departamento || 'General'}
                      </span>
                    </td>

                    {/* TIPO */}
                    <td>
                      <span className="badge badge-meadow" style={{ fontSize: '0.7rem' }}>
                        {sol.tipo ? sol.tipo.replace(/_/g, ' ') : 'Vacaciones'}
                      </span>
                    </td>

                    {/* PERIODO */}
                    <td style={{ fontSize: '0.825rem', color: 'var(--text-main)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={13} color="var(--mustard-green)" />
                        <span>
                          {sol.fecha_inicio} <strong style={{ color: 'var(--meadow-green)' }}>➔</strong> {sol.fecha_fin}
                        </span>
                      </div>
                    </td>

                    {/* DÍAS */}
                    <td>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>
                        {sol.dias_solicitados}
                      </strong>{' '}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>días</span>
                    </td>

                    {/* ANTIGÜEDAD */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {esCritica ? (
                          <span className="badge badge-crimson" style={{ fontSize: '0.675rem' }}>
                            <AlertTriangle size={11} />
                            {sol.dias_pendiente} días (Atrasada)
                          </span>
                        ) : (
                          <span className="badge badge-mustard" style={{ fontSize: '0.675rem' }}>
                            <Clock size={11} />
                            {sol.dias_pendiente || 0} día(s)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ACCIONES */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => onApprove && onApprove(sol.id)}
                          className="btn btn-primary btn-sm"
                          title="Aprobar solicitud formalmente"
                          style={{
                            padding: '0.35rem 0.75rem',
                            opacity: isLoading ? 0.65 : 1,
                            cursor: isLoading ? 'wait' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <Check size={14} />
                          <span>{isLoading ? 'Procesando...' : 'Aprobar'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => setRejectModalId(sol.id)}
                          className="btn btn-crimson btn-sm"
                          title="Rechazar solicitud motivada"
                          style={{
                            padding: '0.35rem 0.75rem',
                            opacity: isLoading ? 0.65 : 1,
                            cursor: isLoading ? 'wait' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <X size={14} />
                          <span>Rechazar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL EDITORIAL DE RECHAZO */}
      {rejectModalId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(28, 51, 38, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div className="frame-editorial" style={{
            padding: '1.5rem',
            maxWidth: '460px',
            width: '100%',
            backgroundColor: 'var(--bg-card)',
          }}>
            <h4 style={{
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--crimson)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontFamily: 'Cormorant Garamond, Georgia, serif',
            }}>
              <AlertTriangle size={20} />
              <span>Confirmar Rechazo de Solicitud #{rejectModalId}</span>
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
              Indica el motivo institucional del rechazo para asentar en el expediente del colaborador:
            </p>

            <textarea
              rows={3}
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Ej. Coincide con entrega crítica de sprint o periodo de congelamiento..."
              style={{
                width: '100%',
                marginTop: '0.75rem',
                padding: '0.65rem',
                borderRadius: '2px',
                border: '1.5px solid var(--border-color)',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                resize: 'none',
                backgroundColor: 'var(--peach-light)',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setRejectModalId(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleConfirmReject(rejectModalId)}
                className="btn btn-crimson btn-sm"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
