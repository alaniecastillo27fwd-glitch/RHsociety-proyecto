import { useState } from 'react';
import {
  AlertTriangle,
  Ticket,
  Send,
  CheckCircle,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';

export default function TicketsAndRisksPanel({
  colaboradoresRiesgo = [],
  ticketsEscalados = [],
  onResolveTicket,
  resolvingId = null,
}) {
  const [activeTab, setActiveTab] = useState('pasivo'); // 'pasivo' | 'tickets'
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [respuestaTexto, setRespuestaTexto] = useState('');

  const handleSendResolution = (ticketId) => {
    if (!respuestaTexto.trim()) return;
    if (onResolveTicket) {
      onResolveTicket(ticketId, respuestaTexto.trim());
    }
    setSelectedTicketId(null);
    setRespuestaTexto('');
  };

  return (
    <div className="card-editorial" style={{ width: '100%', padding: '1.25rem' }}>
      {/* HEADER CON TABS */}
      <div className="card-header" style={{ marginBottom: '0.85rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--meadow-green)' }}>
            {activeTab === 'pasivo' ? 'Control de Pasivo Laboral (Vacaciones > 20 días)' : 'Tickets de Escalamiento del Chatbot'}
          </h3>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            {activeTab === 'pasivo'
              ? 'Colaboradores con acumulación crítica de vacaciones que requieren descanso institucional'
              : 'Preguntas sin cobertura en políticas derivadas a RRHH para resolución formal'}
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
            onClick={() => setActiveTab('pasivo')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '2px',
              border: activeTab === 'pasivo' ? '1.5px solid var(--crimson)' : '1px solid transparent',
              cursor: 'pointer',
              backgroundColor: activeTab === 'pasivo' ? 'var(--crimson)' : 'transparent',
              color: activeTab === 'pasivo' ? '#FFFFFF' : 'var(--text-main)',
              transition: 'all 0.15s ease',
            }}
          >
            <ShieldAlert size={13} />
            <span>Pasivo Laboral ({colaboradoresRiesgo.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '2px',
              border: activeTab === 'tickets' ? '1.5px solid var(--mustard-green)' : '1px solid transparent',
              cursor: 'pointer',
              backgroundColor: activeTab === 'tickets' ? 'var(--mustard-green)' : 'transparent',
              color: activeTab === 'tickets' ? '#FFFFFF' : 'var(--text-main)',
              transition: 'all 0.15s ease',
            }}
          >
            <Ticket size={13} />
            <span>Tickets Escalamiento ({ticketsEscalados.length})</span>
          </button>
        </div>
      </div>

      {/* CONTENIDO: TAB 1 - PASIVO LABORAL */}
      {activeTab === 'pasivo' && (
        <div>
          {colaboradoresRiesgo.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--peach-light)',
              borderRadius: '4px',
              border: '1px dashed var(--border-color)',
            }}>
              <CheckCircle size={32} color="var(--meadow-green)" style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>No hay colaboradores con acumulación crítica de vacaciones (&gt; 20 días).</div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="corporate-table">
                <thead>
                  <tr>
                    <th>Colaborador</th>
                    <th>Departamento</th>
                    <th>Puesto</th>
                    <th>Días Disponibles</th>
                    <th>Estado de Riesgo</th>
                  </tr>
                </thead>
                <tbody>
                  {colaboradoresRiesgo.map((c, idx) => (
                    <tr key={idx} style={{ backgroundColor: 'var(--peach-subtle)' }}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{c.nombre}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>ID: #{c.colaborador_id}</div>
                      </td>
                      <td>
                        <span className="badge badge-outerspace" style={{ fontSize: '0.7rem' }}>
                          {c.departamento}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.825rem', color: 'var(--text-main)' }}>{c.puesto}</td>
                      <td>
                        <strong style={{ color: 'var(--crimson)', fontSize: '1.05rem', fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                          {c.dias_disponibles}
                        </strong>{' '}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>días hábiles</span>
                      </td>
                      <td>
                        <span className="badge badge-crimson" style={{ fontSize: '0.675rem' }}>
                          <AlertTriangle size={11} />
                          Alerta: Pasivo Alto
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO: TAB 2 - TICKETS ESCALADOS */}
      {activeTab === 'tickets' && (
        <div>
          {ticketsEscalados.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--peach-light)',
              borderRadius: '4px',
              border: '1px dashed var(--border-color)',
            }}>
              <CheckCircle size={32} color="var(--meadow-green)" style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>No hay tickets escalados pendientes de respuesta.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {ticketsEscalados.map((ticket) => {
                const isSelected = selectedTicketId === ticket.id;
                const isResolved = ticket.estado === 'resuelto';

                return (
                  <div
                    key={ticket.id}
                    style={{
                      border: '1.5px solid var(--border-color)',
                      borderRadius: '4px',
                      padding: '1rem 1.25rem',
                      backgroundColor: isResolved ? 'var(--peach-light)' : 'var(--bg-card)',
                      boxShadow: '2px 2px 0px rgba(12, 96, 56, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`badge ${isResolved ? 'badge-meadow' : 'badge-mustard'}`}>
                          <Ticket size={11} />
                          Ticket #{ticket.id}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                          {ticket.colaborador?.nombre || ticket.nombre || 'Colaborador'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ({ticket.colaborador?.departamento || 'General'})
                        </span>
                      </div>

                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        Estado: <strong style={{ color: isResolved ? 'var(--meadow-green)' : 'var(--mustard-green-dark)' }}>{ticket.estado}</strong>
                      </div>
                    </div>

                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                      <strong>Pregunta:</strong> "{ticket.pregunta_original || ticket.pregunta}"
                    </div>

                    <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Motivo: {ticket.motivo_escalamiento || ticket.motivo || 'No contemplado en políticas documentadas'}
                    </div>

                    {/* RESPUESTA RRHH REGISTRADA */}
                    {ticket.respuesta_rrhh && (
                      <div style={{
                        marginTop: '0.65rem',
                        padding: '0.65rem 0.85rem',
                        backgroundColor: 'var(--peach-light)',
                        border: '1.5px solid var(--meadow-green)',
                        borderRadius: '2px',
                        fontSize: '0.825rem',
                        color: 'var(--meadow-green-dark)',
                      }}>
                        <strong>Resolución Oficial RRHH:</strong> {ticket.respuesta_rrhh}
                      </div>
                    )}

                    {/* FORMULARIO DE RESPUESTA */}
                    {!isResolved && (
                      <div style={{ marginTop: '0.75rem' }}>
                        {isSelected ? (
                          <div style={{ marginTop: '0.5rem' }}>
                            <textarea
                              rows={2}
                              value={respuestaTexto}
                              onChange={(e) => setRespuestaTexto(e.target.value)}
                              placeholder="Escribe la respuesta oficial que se notificará al colaborador..."
                              style={{
                                width: '100%',
                                padding: '0.65rem',
                                borderRadius: '2px',
                                border: '1.5px solid var(--border-color)',
                                fontSize: '0.825rem',
                                fontFamily: 'inherit',
                                resize: 'none',
                                backgroundColor: 'var(--peach-light)',
                                color: 'var(--text-main)',
                              }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.45rem', marginTop: '0.45rem' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedTicketId(null)}
                                className="btn btn-secondary btn-sm"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                disabled={resolvingId === ticket.id || !respuestaTexto.trim()}
                                onClick={() => handleSendResolution(ticket.id)}
                                className="btn btn-primary btn-sm"
                              >
                                <Send size={13} />
                                <span>{resolvingId === ticket.id ? 'Guardando...' : 'Responder y Resolver'}</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTicketId(ticket.id);
                              setRespuestaTexto('');
                            }}
                            className="btn btn-mustard btn-sm"
                          >
                            <MessageSquare size={13} />
                            <span>Responder Ticket</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
