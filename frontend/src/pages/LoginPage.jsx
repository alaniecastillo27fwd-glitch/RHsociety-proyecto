import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  User,
  AlertCircle,
  Sparkles,
  Bookmark,
  Award,
  Sun,
  Moon,
} from 'lucide-react';

export default function LoginPage() {
  const { login, isAuthenticated, isRRHH, loading: authLoading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirigir automáticamente si ya existe sesión activa
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (isRRHH) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/chat', { replace: true });
      }
    }
  }, [isAuthenticated, isRRHH, authLoading, navigate]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!correo.trim() || !password.trim()) {
      setError('Por favor ingresa tu correo corporativo y contraseña.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await login(correo.trim(), password);
    setLoading(false);

    if (result.success) {
      if (result.user?.rol === 'rrhh') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/chat', { replace: true });
      }
    } else {
      setError(result.error || 'Credenciales inválidas. Verifica tu correo y contraseña.');
    }
  };

  /**
   * Atajo de acceso rápido de 1 clic para demostración
   */
  const handleQuickLogin = async (demoCorreo, demoPassword) => {
    setCorreo(demoCorreo);
    setPassword(demoPassword);
    setLoading(true);
    setError(null);

    const result = await login(demoCorreo, demoPassword);
    setLoading(false);

    if (result.success) {
      if (result.user?.rol === 'rrhh') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/chat', { replace: true });
      }
    } else {
      setError(result.error || 'Error en inicio de sesión rápido.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-page)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem 1.5rem',
      backgroundImage: 'radial-gradient(var(--peach) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
    }}>
      {/* CONTENEDOR EDITORIAL CON DOBLE MARCO (DISEÑO IMAGEN 2) */}
      <div style={{
        maxWidth: '480px',
        width: '100%',
        backgroundColor: 'var(--bg-card)',
        border: '2px solid var(--meadow-green)',
        boxShadow: '6px 6px 0px rgba(12, 96, 56, 0.2)',
        position: 'relative',
      }}>
        {/* CINTA DECORATIVA SUPERIOR */}
        <div style={{
          backgroundColor: 'var(--meadow-green)',
          color: 'var(--peach-light)',
          padding: '0.4rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontWeight: 700,
          borderBottom: '2px solid var(--outerspace-dark)',
        }}>
          <span>RHsociety • Costa Rica</span>
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--peach)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {isDark ? <Sun size={13} color="var(--peach)" /> : <Moon size={13} color="var(--peach)" />}
            <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
          </button>
        </div>

        {/* ÁREA DEL ARCO DE MEDIO PUNTO (ARCH PORTAL) */}
        <div style={{
          padding: '2rem 1.75rem 1.25rem 1.75rem',
          backgroundColor: 'var(--peach-light)',
          borderBottom: '2px solid var(--meadow-green)',
          textAlign: 'center',
        }}>
          {/* ARCO ARQUITECTÓNICO */}
          <div style={{
            maxWidth: '220px',
            margin: '0 auto',
            border: '2.5px solid var(--meadow-green)',
            borderRadius: '9999px 9999px 8px 8px',
            padding: '8px',
            backgroundColor: 'var(--bg-card)',
            boxShadow: 'inset 0 0 0 1px var(--peach)',
          }}>
            <div style={{
              borderRadius: '9999px 9999px 4px 4px',
              border: '1px dashed var(--mustard-green)',
              backgroundColor: 'var(--peach-light)',
              padding: '1.75rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: 'var(--meadow-green)',
                border: '2px solid var(--peach)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(12, 96, 56, 0.25)',
                marginBottom: '0.5rem',
              }}>
                <Building2 size={28} color="var(--peach-light)" />
              </div>
              <div style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontStyle: 'italic',
                fontSize: '0.95rem',
                color: 'var(--mustard-green-dark)',
                fontWeight: 600,
              }}>
                Portal de Personas
              </div>
            </div>
          </div>

          {/* INDICADOR DE 3 PUNTOS (• • •) DEBAJO DEL ARCO */}
          <div className="arch-dots" style={{ margin: '0.85rem auto 0 auto' }}>
            <span></span>
            <span></span>
            <span></span>
          </div>

          {/* TITULARES EDITORIALES */}
          <div style={{ marginTop: '0.75rem' }}>
            <div className="subtitle-script" style={{ fontSize: '1.2rem' }}>
              Gestión del Talento & Políticas
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--meadow-green)',
              margin: '0.15rem 0',
              lineHeight: 1.1,
            }}>
              RHsociety
            </h1>
            <div style={{
              display: 'inline-block',
              backgroundColor: 'var(--mustard-green)',
              color: 'var(--peach-light)',
              padding: '0.2rem 0.65rem',
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: '1px solid var(--meadow-green)',
              marginTop: '0.35rem',
            }}>
              Autoservicio • Gestión de Personas • People Analytics
            </div>
          </div>
        </div>

        {/* CUERPO DEL FORMULARIO */}
        <div style={{ padding: '1.75rem' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              backgroundColor: 'var(--crimson-light)',
              border: '1.5px solid var(--crimson)',
              color: 'var(--crimson)',
              padding: '0.75rem',
              borderRadius: '2px',
              fontSize: '0.825rem',
              marginBottom: '1.25rem',
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* CORREO */}
            <div style={{ marginBottom: '1.15rem' }}>
              <label style={{
                display: 'block',
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginBottom: '0.35rem',
              }}>
                Correo Electrónico Corporativo
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={17} color="var(--mustard-green)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="ej. carlos.mendez@rhsociety.cr"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem 0.65rem 2.35rem',
                    borderRadius: '2px',
                    border: '1.5px solid var(--border-color)',
                    backgroundColor: 'var(--peach-light)',
                    fontSize: '0.875rem',
                    color: 'var(--text-main)',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--meadow-green)';
                    e.target.style.backgroundColor = 'var(--bg-card)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color)';
                    e.target.style.backgroundColor = 'var(--peach-light)';
                  }}
                />
              </div>
            </div>

            {/* CONTRASEÑA */}
            <div style={{ marginBottom: '1.4rem' }}>
              <label style={{
                display: 'block',
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginBottom: '0.35rem',
              }}>
                Contraseña de Acceso
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={17} color="var(--mustard-green)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem 0.65rem 2.35rem',
                    borderRadius: '2px',
                    border: '1.5px solid var(--border-color)',
                    backgroundColor: 'var(--peach-light)',
                    fontSize: '0.875rem',
                    color: 'var(--text-main)',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--meadow-green)';
                    e.target.style.backgroundColor = 'var(--bg-card)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color)';
                    e.target.style.backgroundColor = 'var(--peach-light)';
                  }}
                />
              </div>
            </div>

            {/* BOTÓN INGRESAR */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.95rem',
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                letterSpacing: '0.04em',
                fontWeight: 700,
              }}
            >
              <span>{loading ? 'Autenticando...' : 'Entrar al Portal'}</span>
              <ArrowRight size={17} />
            </button>
          </form>

          {/* SEPARADOR EDITORIAL */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '1.5rem 0 1.15rem 0',
            color: 'var(--mustard-green)',
            fontSize: '0.72rem',
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
            <span style={{
              padding: '0 0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 700,
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '0.85rem',
              color: 'var(--text-main)',
            }}>
              Acceso Rápido de Demostración
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
          </div>

          {/* BOTONES DE DEMOSTRACIÓN (1 CLIC) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('carlos.mendez@rhsociety.cr', '123456')}
              className="btn"
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                padding: '0.65rem 0.85rem',
                border: '1.5px solid var(--meadow-green)',
                backgroundColor: 'var(--peach-light)',
                color: 'var(--meadow-green-dark)',
                boxShadow: '2px 2px 0px rgba(12, 96, 56, 0.15)',
              }}
            >
              <div style={{
                backgroundColor: 'var(--meadow-green)',
                color: 'var(--peach-light)',
                padding: '0.35rem',
                borderRadius: '2px',
                display: 'flex',
              }}>
                <User size={16} />
              </div>
              <div style={{ textAlign: 'left', marginLeft: '0.65rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Entrar como Colaborador (Carlos Méndez)
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--mustard-green-dark)' }}>
                  Consulta de políticas, vacaciones (14 días) y teletrabajo
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('laura.solis@rhsociety.cr', '123456')}
              className="btn"
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                padding: '0.65rem 0.85rem',
                border: '1.5px solid var(--mustard-green)',
                backgroundColor: 'var(--peach-subtle)',
                color: 'var(--text-main)',
                boxShadow: '2px 2px 0px rgba(128, 139, 71, 0.25)',
              }}
            >
              <div style={{
                backgroundColor: 'var(--mustard-green)',
                color: '#FFFFFF',
                padding: '0.35rem',
                borderRadius: '2px',
                display: 'flex',
              }}>
                <ShieldCheck size={16} />
              </div>
              <div style={{ textAlign: 'left', marginLeft: '0.65rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Entrar como Directora RRHH (Laura Solís)
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--mustard-green-dark)' }}>
                  Acceso exclusivo a Dashboard analítico, KPIs y reportes diarios
                </div>
              </div>
            </button>
          </div>

          {/* BADGES AL PIE (ESTILO IMAGEN 2) */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '0.85rem',
            borderTop: '1px dashed var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
          }}>
            <span className="editorial-badge">Portal de Gestión del Talento</span>
            <span className="editorial-badge" style={{ borderColor: 'var(--mustard-green)', color: 'var(--mustard-green-dark)' }}>
              Ley N° 8968 • Costa Rica
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
