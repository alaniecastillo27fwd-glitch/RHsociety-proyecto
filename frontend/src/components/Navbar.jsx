import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import {
  Building2,
  Bot,
  LayoutDashboard,
  LogOut,
  User,
  ShieldCheck,
  Mail,
  Sparkles,
  MapPin,
  Phone,
  Bookmark,
  Sun,
  Moon,
} from 'lucide-react';

export default function Navbar() {
  const { user, isRRHH, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header style={{
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden',
      backgroundColor: 'var(--navbar-main-bg)',
      color: 'var(--peach-light)',
      borderBottom: '2px solid var(--meadow-green)',
      boxShadow: 'var(--shadow-md)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* 1. TIRA SUPERIOR DE ICONOS UTILITARIOS (DISEÑO IMAGEN 2) */}
      <div style={{
        width: '100%',
        boxSizing: 'border-box',
        borderBottom: '1px solid rgba(241, 210, 161, 0.25)',
        backgroundColor: 'var(--navbar-top-bg)',
        padding: '0.3rem 1.25rem',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: '#F1D2A1',
          letterSpacing: '0.04em',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <Mail size={12} color="#F1D2A1" /> rrhh@rhsociety.cr
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <Phone size={12} color="#F1D2A1" /> +506 2200-RHSOC
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <MapPin size={12} color="#F1D2A1" /> San José, Costa Rica
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.68rem', color: '#F1D2A1' }}>
              Normativa Oficial 2026
            </span>
            <Bookmark size={13} color="#F1D2A1" />
          </div>
        </div>
      </div>

      {/* 2. BARRA PRINCIPAL DE NAVEGACIÓN */}
      <div style={{
        maxWidth: '1280px',
        width: '100%',
        boxSizing: 'border-box',
        margin: '0 auto',
        padding: '0.65rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        {/* LOGO EDITORIAL CON SERIF */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <div style={{
            backgroundColor: 'var(--meadow-green)',
            border: '1.5px solid var(--peach)',
            padding: '0.4rem',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '1px 1px 0px rgba(0, 0, 0, 0.4)',
          }}>
            <Building2 size={22} color="var(--peach)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span className="font-editorial" style={{
                fontSize: '1.45rem',
                fontWeight: 700,
                color: '#FAF6EE',
                letterSpacing: '0.02em',
              }}>
                RHsociety
              </span>
              <span style={{
                fontSize: '0.65rem',
                color: '#1C3326',
                backgroundColor: 'var(--peach)',
                padding: '0.1rem 0.4rem',
                borderRadius: '2px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Costa Rica
              </span>
            </div>
            <div style={{
              fontSize: '0.72rem',
              color: '#F1D2A1',
              fontStyle: 'italic',
              fontFamily: 'Cormorant Garamond, Georgia, serif',
            }}>
              Portal de Políticas & Gestión del Talento
            </div>
          </div>
        </Link>

        {/* PESTAÑAS PILL (DISEÑO IMAGEN 2) */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Link
            to="/chat"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 1rem',
              borderRadius: '9999px',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              backgroundColor: isActive('/chat') || isActive('/') ? 'var(--meadow-green)' : 'rgba(241, 210, 161, 0.08)',
              color: isActive('/chat') || isActive('/') ? '#FFFFFF' : '#F1D2A1',
              border: isActive('/chat') || isActive('/') ? '1.5px solid var(--peach)' : '1px solid rgba(241, 210, 161, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            <Bot size={16} />
            <span>Asistente Virtual</span>
          </Link>

          {/* Enlace exclusivo para personal con rol === 'rrhh' */}
          {isRRHH && (
            <Link
              to="/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 1rem',
                borderRadius: '9999px',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                backgroundColor: isActive('/dashboard') ? 'var(--mustard-green)' : 'rgba(241, 210, 161, 0.08)',
                color: isActive('/dashboard') ? '#FFFFFF' : '#F1D2A1',
                border: isActive('/dashboard') ? '1.5px solid var(--peach)' : '1px solid rgba(241, 210, 161, 0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard RRHH</span>
            </Link>
          )}
        </nav>

        {/* PERFIL DEL USUARIO, MODO CLARO/OSCURO Y SALIR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* BOTÓN CONMUTADOR MODO CLARO / OSCURO */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: isDark ? 'rgba(241, 210, 161, 0.18)' : 'rgba(12, 96, 56, 0.55)',
              color: '#F1D2A1',
              border: '1.5px solid #F1D2A1',
              borderRadius: '9999px',
              padding: '0.35rem 0.8rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
            }}
          >
            {isDark ? (
              <>
                <Sun size={14} color="#F1D2A1" />
                <span style={{ color: '#F1D2A1' }}>Modo Claro</span>
              </>
            ) : (
              <>
                <Moon size={14} color="#F1D2A1" />
                <span style={{ color: '#F1D2A1' }}>Modo Oscuro</span>
              </>
            )}
          </button>

          {user ? (
            <>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#FFFFFF' }}>
                  {user.nombre}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem', marginTop: '0.15rem' }}>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '2px',
                    textTransform: 'uppercase',
                    border: isRRHH ? '1px solid var(--mustard-green)' : '1px solid var(--peach)',
                    backgroundColor: isRRHH ? 'var(--mustard-green-dark)' : 'rgba(241, 210, 161, 0.15)',
                    color: isRRHH ? '#FFFFFF' : '#F1D2A1',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}>
                    {isRRHH ? <ShieldCheck size={11} /> : <User size={11} />}
                    {isRRHH ? 'Directora RRHH' : 'Colaborador'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#F1D2A1' }}>
                    {user.departamento || 'IT'}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                title="Cerrar sesión"
                className="btn btn-sm"
                style={{
                  backgroundColor: 'var(--crimson)',
                  color: '#FFFFFF',
                  borderColor: 'var(--crimson-dark)',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '3px',
                }}
              >
                <LogOut size={15} />
                <span style={{ fontSize: '0.8rem' }}>Salir</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
