import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { askChatRequest, getChatHistoryRequest } from '../services/api.js';
import Navbar from '../components/Navbar.jsx';
import ChatMessage from '../components/ChatMessage.jsx';
import QuickQuestionsBar from '../components/QuickQuestionsBar.jsx';
import {
  Send,
  Bot,
  User,
  Sparkles,
  CreditCard,
  Briefcase,
  Palmtree,
  Laptop,
  Stethoscope,
  Gift,
  AlertCircle,
  RefreshCw,
  Bookmark,
} from 'lucide-react';

export default function ChatPortalPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll al final de la conversación
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Cargar historial previo de consultas al montar la página
  useEffect(() => {
    async function loadHistory() {
      try {
        setInitialLoading(true);
        const data = await getChatHistoryRequest();
        if (data && Array.isArray(data.history) && data.history.length > 0) {
          const formattedMessages = [];
          const chronological = [...data.history].reverse();

          chronological.forEach((item) => {
            formattedMessages.push({
              id: `user-${item.id}`,
              rol: 'user',
              texto: item.pregunta,
              fecha: item.fecha,
            });
            formattedMessages.push({
              id: `bot-${item.id}`,
              rol: 'assistant',
              texto: item.resuelta
                ? `(Consulta resuelta y registrada en auditoría)`
                : `Consulta procesada por los agentes de RHsociety.`,
              agente: item.agente,
              citas: item.documentos_citados || [],
              escalada: item.escalada,
              latencia_ms: item.latencia_ms,
              fecha: item.fecha,
            });
          });

          setMessages(formattedMessages);
        } else {
          setMessages([
            {
              id: 'welcome-1',
              rol: 'assistant',
              texto: `¡Bienvenido al Portal de Recursos Humanos, **${user?.nombre || 'Colaborador'}**! 👋\n\nSoy tu **Asistente Virtual de Recursos Humanos**. Estoy conectado directamente al repositorio oficial de políticas corporativas y a tus registros laborales.\n\nPuedes consultarme sobre tu **saldo de vacaciones**, el reglamento de **teletrabajo**, procedimientos de **incapacidad**, cálculo de **aguinaldo** o cualquier inquietud laboral.`,
              agente: 'Orquestador Central',
              citas: [],
              latencia_ms: 12,
            },
          ]);
        }
      } catch (err) {
        console.warn('[ChatPortal] Error cargando historial inicial:', err.message);
        setMessages([
          {
            id: 'welcome-default',
            rol: 'assistant',
            texto: `¡Hola, **${user?.nombre || 'Colaborador'}**! 👋\n\nSoy el Asistente Virtual de RRHH de RHsociety. ¿Qué política o dato laboral deseas verificar hoy?`,
            agente: 'Orquestador Central',
            citas: [],
          },
        ]);
      } finally {
        setInitialLoading(false);
      }
    }

    loadHistory();
  }, [user]);

  // Enviar mensaje al backend
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    setErrorBanner(null);
    setInputMessage('');

    // 1. Agregar mensaje del usuario a la interfaz
    const userMsg = {
      id: `user-${Date.now()}`,
      rol: 'user',
      texto: query,
      fecha: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // 2. Extraer memoria reciente (últimos 6 mensajes)
      const recentHistory = messages.slice(-6).map((m) => ({
        rol: m.rol === 'user' ? 'user' : 'assistant',
        texto: m.texto,
      }));

      // 3. Invocar endpoint del backend /api/chat/ask
      const response = await askChatRequest(query, {
        historial: recentHistory,
      });

      // 4. Agregar respuesta del asistente
      const botMsg = {
        id: `bot-${Date.now()}`,
        rol: 'assistant',
        texto: response.respuesta || 'Respuesta procesada.',
        agente: response.agente || 'Políticas de Recursos Humanos',
        citas: response.citas || [],
        escalada: response.escalada === true,
        ticketId: response.ticketId,
        latencia_ms: response.latenciaMs,
        confianza: response.confianza,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('[ChatPortal Error] Falló consulta al asistente:', err);
      const errorMsg = {
        id: `err-${Date.now()}`,
        rol: 'assistant',
        texto: '⚠️ Ocurrió una interrupción al consultar con los agentes de RHsociety. Por favor, verifica tu conexión o intenta reformular tu pregunta.',
        agente: 'Orquestador · Error',
        citas: [],
      };
      setMessages((prev) => [...prev, errorMsg]);
      setErrorBanner('No se pudo completar la consulta. El servidor no respondió a tiempo.');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
      <Navbar />

      {/* 1. SECCIÓN SUPERIOR DE DISEÑO EDITORIAL (CÁPSULAS CIRCULARES EN HILERA - IMAGEN 2) */}
      <div style={{
        backgroundColor: 'var(--header-bg, var(--bg-card))',
        borderBottom: '2px solid var(--meadow-green)',
        boxShadow: '0 2px 6px rgba(12, 96, 56, 0.08)',
        padding: '0.75rem 1.25rem',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          {/* TITULAR EDITORIAL ESTILO IMAGEN 2 */}
          <div>
            <div className="subtitle-script" style={{ fontSize: '1.05rem', color: 'var(--mustard-green)' }}>
              Acceso Rápido por Temáticas
            </div>
            <div className="font-editorial" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--heading-color, var(--meadow-green))' }}>
              Políticas Laborales de Costa Rica
            </div>
          </div>

          {/* LAS 4 CÁPSULAS CIRCULARES EN HILERA (DISEÑO EDITORIAL LIMPIO) */}
          <div className="capsule-row" style={{ padding: 0 }}>
            {/* CÁPSULA 1: VACACIONES */}
            <div
              className="capsule-item"
              onClick={() => handleSendMessage('¿Cuántos días de vacaciones me quedan disponibles y cómo solicitarlas?')}
              title="Consultar saldo y política de vacaciones"
            >
              <div className="capsule-circle">
                <Palmtree size={26} color="currentColor" />
              </div>
              <span className="capsule-label">Vacaciones</span>
            </div>

            {/* CÁPSULA 2: TELETRABAJO */}
            <div
              className="capsule-item"
              onClick={() => handleSendMessage('¿Cuáles son los requisitos y condiciones de la política de teletrabajo híbrido bajo la Ley 9738?')}
              title="Consultar reglamento de teletrabajo"
            >
              <div className="capsule-circle">
                <Laptop size={26} color="currentColor" />
              </div>
              <span className="capsule-label">Teletrabajo</span>
            </div>

            {/* CÁPSULA 3: INCAPACIDADES */}
            <div
              className="capsule-item"
              onClick={() => handleSendMessage('¿Cuál es el procedimiento y plazos para reportar una incapacidad de la CCSS o del INS?')}
              title="Consultar procedimiento de incapacidades"
            >
              <div className="capsule-circle">
                <Stethoscope size={26} color="currentColor" />
              </div>
              <span className="capsule-label">Incapacidades</span>
            </div>

            {/* CÁPSULA 4: BENEFICIOS */}
            <div
              className="capsule-item"
              onClick={() => handleSendMessage('¿Cuándo se paga el aguinaldo y qué beneficios complementarios ofrece RHsociety?')}
              title="Consultar aguinaldo y catálogo de beneficios"
            >
              <div className="capsule-circle">
                <Gift size={26} color="currentColor" />
              </div>
              <span className="capsule-label">Beneficios</span>
            </div>
          </div>
        </div>
      </div>

      <main style={{
        flex: 1,
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto',
        padding: '1.25rem',
        display: 'grid',
        gridTemplateColumns: 'minmax(270px, 310px) minmax(0, 1fr)',
        gap: '1.25rem',
        alignItems: 'start',
        minWidth: 0,
        boxSizing: 'border-box',
      }}>
        {/* PANEL LATERAL: PERFIL CON ARCO EDITORIAL */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0, maxWidth: '100%' }}>
          {/* TARJETA CON ARCO ARQUITECTÓNICO (IMAGEN 2) */}
          <div className="frame-editorial" style={{ padding: '1.25rem' }}>
            {/* ARCO DE PERFIL */}
            <div className="arch-frame" style={{ maxWidth: '180px', margin: '0 auto 0.85rem auto' }}>
              <div className="arch-inner">
                <div style={{
                  backgroundColor: 'var(--outerspace)',
                  color: 'var(--peach-light)',
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  border: '2px solid var(--peach)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.35rem',
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                }}>
                  {user?.nombre ? user.nombre.charAt(0) : 'U'}
                </div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  color: 'var(--meadow-green)',
                  marginTop: '0.4rem',
                }}>
                  {user?.nombre || 'Colaborador'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--mustard-green-dark)' }}>
                  {user?.correo}
                </div>
              </div>
            </div>

            {/* PUNTOS INDICADORES DEBAJO DEL ARCO */}
            <div className="arch-dots" style={{ marginBottom: '1rem' }}>
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.825rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                <Briefcase size={16} color="var(--mustard-green)" />
                <span>Puesto: <strong>{user?.puesto || 'Puesto no asignado'}</strong></span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                <User size={16} color="var(--mustard-green)" />
                <span>Departamento: <strong>{user?.departamento || 'Tecnología'}</strong></span>
              </div>

              {/* SALDO DE VACACIONES EN MARCO PEACH */}
              <div style={{
                backgroundColor: 'var(--peach-light)',
                border: '1.5px solid var(--meadow-green)',
                padding: '0.85rem',
                borderRadius: '4px',
                marginTop: '0.35rem',
                boxShadow: '2px 2px 0px rgba(12, 96, 56, 0.1)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--meadow-green)', fontSize: '0.75rem', fontWeight: 700 }}>
                  <Palmtree size={16} color="var(--meadow-green)" />
                  <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Saldo Vacaciones Disponibles</span>
                </div>
                <div style={{
                  fontSize: '1.6rem',
                  fontWeight: 700,
                  color: 'var(--meadow-green-dark)',
                  marginTop: '0.2rem',
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                }}>
                  {user?.saldo_vacaciones?.dias_disponibles !== undefined
                    ? `${user.saldo_vacaciones.dias_disponibles} días`
                    : '14 días'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Periodo laboral {user?.saldo_vacaciones?.periodo || '2025-2026'}
                </div>
              </div>

              {/* PRÓXIMO PAGO */}
              <div style={{
                backgroundColor: 'var(--peach-subtle)',
                border: '1.5px solid var(--mustard-green)',
                padding: '0.85rem',
                borderRadius: '4px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--mustard-green-dark)', fontSize: '0.75rem', fontWeight: 700 }}>
                  <CreditCard size={16} color="var(--mustard-green)" />
                  <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Fecha Próximo Pago</span>
                </div>
                <div style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginTop: '0.2rem',
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                }}>
                  {user?.fecha_proximo_pago || '2026-11-30'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Planilla quincenal bancaria
                </div>
              </div>
            </div>
          </div>

          {/* CAJA DE DECLARACIÓN / HADITH-STYLE STATEMENT BOX (DISEÑO IMAGEN 2) */}
          <div className="frame-editorial" style={{ overflow: 'hidden' }}>
            <div className="ribbon-header">
              Aviso Normativo y Privacidad
            </div>
            <div style={{ padding: '0.85rem', backgroundColor: 'var(--peach-light)' }}>
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--text-main)',
                lineHeight: 1.55,
                fontStyle: 'italic',
                fontFamily: 'Cormorant Garamond, Georgia, serif',
              }}>
                «Toda información provista en este portal se encuentra auditada y validada oficialmente bajo el marco de la <strong>Ley N° 8968</strong> de Costa Rica. La información salarial y sensible de terceros permanece estrictamente protegida.»
              </p>
              <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
                <span className="editorial-badge" style={{ fontSize: '0.65rem' }}>
                  PRODHAB • 2026
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* ÁREA DE CONVERSACIÓN PRINCIPAL (MARCO EDITORIAL) */}
        <section className="frame-editorial" style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 200px)',
          minHeight: '560px',
          minWidth: 0,
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}>
          {/* ENCABEZADO DEL CHAT CON ESTILO EDITORIAL */}
          <div style={{
            padding: '0.85rem 1.25rem',
            borderBottom: '2px solid var(--meadow-green)',
            backgroundColor: 'var(--peach-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                backgroundColor: 'var(--meadow-green)',
                color: 'var(--peach-light)',
                padding: '0.45rem',
                borderRadius: '4px',
                display: 'flex',
                border: '1.5px solid var(--peach)',
              }}>
                <Bot size={22} />
              </div>
              <div>
                <div className="font-editorial" style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--meadow-green)' }}>
                  Asistente Virtual de Políticas de RRHH
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--mustard-green-dark)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 8, height: 8, backgroundColor: 'var(--meadow-green)', borderRadius: '50%', display: 'inline-block' }} />
                  <span>En línea • Asesoría Oficial de Políticas y Gestión del Talento</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setMessages([
                  {
                    id: `new-${Date.now()}`,
                    rol: 'assistant',
                    texto: `Conversación reiniciada. ¿Qué consulta tienes sobre tus vacaciones, incapacidades o políticas de la empresa?`,
                    agente: 'Orquestador Central',
                    citas: [],
                  },
                ]);
              }}
              className="btn btn-secondary btn-sm"
              title="Reiniciar conversación"
            >
              <RefreshCw size={13} />
              <span>Limpiar Chat</span>
            </button>
          </div>

          {/* BANNER DE ERROR SI OCURRE */}
          {errorBanner && (
            <div style={{
              backgroundColor: 'var(--crimson-light)',
              color: 'var(--crimson)',
              padding: '0.5rem 1rem',
              fontSize: '0.775rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              borderBottom: '1.5px solid var(--crimson)',
            }}>
              <AlertCircle size={15} />
              <span>{errorBanner}</span>
            </div>
          )}

          {/* CONTENEDOR DE MENSAJES (SCROLLABLE) */}
          <div style={{
            flex: 1,
            padding: '1.25rem',
            overflowY: 'auto',
            overflowX: 'hidden',
            backgroundColor: 'var(--bg-page)',
            minWidth: 0,
            boxSizing: 'border-box',
          }}>
            {initialLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto', color: 'var(--meadow-green)' }} />
                <p style={{ fontSize: '0.85rem' }}>Cargando conversación y políticas vigentes...</p>
              </div>
            ) : (
              messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
            )}

            {/* ESTADO DE CARGA ANIMADO */}
            {loading && (
              <div className="chat-message-row bot animate-fade-in">
                <div className="chat-avatar bot-avatar">
                  <Bot size={18} color="var(--meadow-green)" />
                </div>
                <div className="chat-bubble bot-bubble" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <RefreshCw size={15} className="animate-spin" color="var(--meadow-green)" />
                  <span>Consultando agentes de RHsociety y verificando políticas oficiales...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* BARRA DE PREGUNTAS RÁPIDAS DE DEMO */}
          <QuickQuestionsBar
            disabled={loading}
            onSelectQuestion={(qText) => handleSendMessage(qText)}
          />

          {/* FORMULARIO DE ENTRADA CON ESTILO EDITORIAL */}
          <div style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: 'var(--header-bg, var(--bg-card))',
            borderTop: '2px solid var(--meadow-green)',
            width: '100%',
            boxSizing: 'border-box',
          }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', width: '100%', minWidth: 0, boxSizing: 'border-box' }}
            >
              <input
                ref={inputRef}
                type="text"
                disabled={loading}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu consulta aquí... (ej. ¿Cuántos días de vacaciones me quedan?)"
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '0.75rem 1.15rem',
                  borderRadius: '4px',
                  border: '1.5px solid var(--border-color)',
                  fontSize: '0.875rem',
                  color: 'var(--text-main)',
                  outline: 'none',
                  backgroundColor: 'var(--bg-subtle)',
                  transition: 'all 0.15s ease',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--meadow-green)';
                  e.target.style.backgroundColor = 'var(--bg-card)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-color)';
                  e.target.style.backgroundColor = 'var(--bg-subtle)';
                }}
              />

              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="btn btn-primary"
                style={{
                  flexShrink: 0,
                  padding: '0.75rem 1.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: '1rem',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>Preguntar</span>
                <Send size={15} />
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
