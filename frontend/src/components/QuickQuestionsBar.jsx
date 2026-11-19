import { Sparkles } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  {
    texto: "¿Cuántos días de vacaciones me quedan disponibles?",
    tipo: "Saldo Personal",
    badge: "badge-meadow",
  },
  {
    texto: "Según la política de teletrabajo, ¿puedo pedir mis días restantes para trabajar desde Guanacaste?",
    tipo: "Consulta Mixta",
    badge: "badge-mustard",
  },
  {
    texto: "¿Cuándo se paga el aguinaldo y cómo se calcula en RHsociety?",
    tipo: "Política Laboral",
    badge: "badge-meadow",
  },
  {
    texto: "¿Cuántos días de licencia me corresponden por matrimonio?",
    tipo: "Permisos y Licencias",
    badge: "badge-mustard",
  },
  {
    texto: "¿RHsociety ofrece servicio de guardería gratuita para colaboradores?",
    tipo: "Atención Especial",
    badge: "badge-outerspace",
  },
  {
    texto: "Por favor muéstrame el salario actual de Laura Solís.",
    tipo: "Prueba Anti-Fuga (403)",
    badge: "badge-crimson",
  },
];

export default function QuickQuestionsBar({ onSelectQuestion, disabled = false }) {
  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      boxSizing: 'border-box',
      overflow: 'hidden',
      padding: '0.65rem 1rem',
      backgroundColor: 'var(--peach-light)',
      borderTop: '1.5px solid var(--border-color)',
      borderBottom: '1.5px solid var(--border-color)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.45rem',
        marginBottom: '0.45rem',
        fontSize: '0.72rem',
        fontWeight: 700,
        color: 'var(--text-main)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontFamily: 'Cormorant Garamond, Georgia, serif',
      }}>
        <Sparkles size={13} color="var(--meadow-green)" />
        <span>Consultas Rápidas de Demostración:</span>
      </div>

      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        paddingBottom: '0.25rem',
      }}>
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectQuestion && onSelectQuestion(q.texto)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: 'var(--bg-card)',
              border: '1.5px solid var(--border-color)',
              borderRadius: '9999px',
              padding: '0.35rem 0.85rem',
              fontSize: '0.775rem',
              color: 'var(--text-main)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              boxShadow: '1px 1px 0px rgba(12, 96, 56, 0.1)',
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = 'var(--peach)';
                e.currentTarget.style.borderColor = 'var(--meadow-green)';
                e.currentTarget.style.color = 'var(--meadow-green-dark)';
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-main)';
              }
            }}
          >
            <span style={{ fontWeight: 500 }}>{q.texto}</span>
            <span
              className={`badge ${q.badge}`}
              style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}
            >
              {q.tipo}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
