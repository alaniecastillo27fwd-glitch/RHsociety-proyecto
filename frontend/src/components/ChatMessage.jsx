import {
  FileText,
  ExternalLink,
  Clock,
  Sparkles,
  AlertTriangle,
  User,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';

/**
 * Renderizador de formato Markdown básico y saltos de línea sin dependencias pesadas.
 */
function renderFormattedText(text, isUser = false) {
  if (!text) return null;

  // Separar párrafos por saltos de línea
  const lines = text.split('\n');

  return lines.map((line, idx) => {
    // Si la línea es un ítem de lista
    const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
    const isNumbered = /^\d+\.\s/.test(line.trim());

    // Procesar negritas con **texto**
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const formattedParts = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong
            key={pIdx}
            style={{
              fontWeight: 700,
              color: isUser ? '#FFFFFF' : 'var(--primary)',
            }}
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    if (isBullet || isNumbered) {
      return (
        <div
          key={idx}
          style={{
            marginLeft: '1rem',
            marginTop: '0.25rem',
            marginBottom: '0.25rem',
            color: isUser ? '#FFFFFF' : 'var(--text-main)',
          }}
        >
          • {formattedParts}
        </div>
      );
    }

    if (line.trim() === '') {
      return <div key={idx} style={{ height: '0.45rem' }} />;
    }

    return (
      <p
        key={idx}
        style={{
          marginBottom: idx === lines.length - 1 ? 0 : '0.45rem',
          color: isUser ? '#FFFFFF' : 'var(--text-main)',
          lineHeight: 1.6,
        }}
      >
        {formattedParts}
      </p>
    );
  });
}

export default function ChatMessage({ message }) {
  const isUser = message.rol === 'user' || message.sender === 'user';
  const citas = message.documentos_citados || message.citas || [];
  const agente = message.agente || message.tipo_respuesta || 'Agente RHsociety';
  const latencia = message.latencia_ms !== undefined ? message.latencia_ms : message.latency;
  const esEscalada = message.escalada === true;
  const ticketId = message.ticket_id || message.ticketId;

  // Asignar color y etiqueta de agente bajo la paleta estricta
  let agentBadgeStyle = 'badge-meadow';
  let agentLabel = agente;

  if (agente.includes('Politicas') || agente.includes('politica')) {
    agentBadgeStyle = 'badge-meadow';
    agentLabel = 'Políticas y Normativa';
  } else if (agente.includes('Datos') || agente.includes('dato_personal')) {
    agentBadgeStyle = 'badge-mustard';
    agentLabel = 'Datos del Colaborador';
  } else if (agente.includes('Mixt') || agente.includes('mixta')) {
    agentBadgeStyle = 'badge-outerspace';
    agentLabel = 'Consulta Integrada';
  } else if (agente.includes('Validador') || agente.includes('restringida')) {
    agentBadgeStyle = 'badge-crimson';
    agentLabel = 'Filtro de Privacidad';
  }

  return (
    <div className={`chat-message-row ${isUser ? 'user' : 'bot'}`}>
      {/* AVATAR EDITORIAL */}
      <div className={`chat-avatar ${isUser ? 'user-avatar' : 'bot-avatar'}`}>
        {isUser ? <User size={20} /> : <Sparkles size={18} color="var(--meadow-green)" />}
      </div>

      {/* BURBUJA DE MENSAJE */}
      <div className={`chat-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`}>
        {/* TEXTO PRINCIPAL */}
        <div style={{ color: isUser ? '#FFFFFF' : 'var(--text-main)' }}>
          {renderFormattedText(message.texto || message.contenido || message.pregunta || '', isUser)}
        </div>

        {/* ALERTA DE TICKET ESCALADO */}
        {esEscalada && (
          <div
            style={{
              marginTop: '0.85rem',
              padding: '0.75rem 0.95rem',
              backgroundColor: 'var(--bg-subtle)',
              border: '1.5px solid var(--mustard-green)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
            }}
          >
            <AlertTriangle size={18} color="var(--crimson)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--text-main)' }}>
                Ticket Formal de Gestión de Talento: {ticketId || 'TCK-20261119-XXXX'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Tu solicitud ha sido radicada formalmente ante el equipo de Gestión Humana para su estudio particular.
              </div>
            </div>
          </div>
        )}

        {/* TARJETAS DE CITAS VERIFICABLES */}
        {!isUser && citas && citas.length > 0 && (
          <div style={{ marginTop: '0.9rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--mustard-green)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.4rem',
              fontFamily: 'Cormorant Garamond, Georgia, serif',
            }}>
              <Bookmark size={13} color="var(--primary)" />
              <span>Fuentes Normativas Oficiales Citadas ({citas.length}):</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {citas.map((cita, cIdx) => (
                <a
                  key={cIdx}
                  href={cita.enlace || cita.drive_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="citation-card"
                  title="Abrir política oficial en Google Drive / Repositorio local"
                >
                  <FileText size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 700,
                      fontSize: '0.825rem',
                      color: 'var(--primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {cita.documento || cita.nombre || 'Política de Recursos Humanos'}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      marginTop: '0.15rem',
                    }}>
                      <span>Sección: <strong>{cita.seccion || 'General'}</strong></span>
                      <span>•</span>
                      <span>Versión: <strong>{cita.version || 'v1.0'}</strong></span>
                    </div>
                  </div>
                  <ExternalLink size={14} color="var(--mustard-green)" style={{ flexShrink: 0 }} />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* PIE DE METADATOS Y AUDITORÍA */}
        {!isUser && (
          <div className="chat-footer">
            <span className={`badge ${agentBadgeStyle}`} style={{ fontSize: '0.675rem' }}>
              <CheckCircle2 size={10} />
              {agentLabel}
            </span>

            {latencia !== undefined && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <Clock size={11} />
                <span>{latencia} ms</span>
              </span>
            )}

            <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginLeft: 'auto' }}>
              Información Oficial Verificada
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
