import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { RefreshCw } from 'lucide-react';

/**
 * Componente Guardián de Rutas Protegidas por Rol.
 * 
 * @param {Array<string>} allowedRoles Lista de roles permitidos (ej. ['rrhh'])
 * @param {React.ReactNode} children Elemento hijo opcional (si no se usa Outlet)
 */
export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // 1. Mientras verifica la vigencia de la sesión en localStorage o backend
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        color: '#64748b',
      }}>
        <RefreshCw size={32} className="animate-spin" color="#1e3a8a" style={{ marginBottom: '1rem' }} />
        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
          Verificando sesión en RHsociety...
        </div>
      </div>
    );
  }

  // 2. Si no hay sesión activa, redirigir al Login preservando la intención
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Verificación de roles permitidos (ej. exclusividad de RRHH en el Dashboard)
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
    console.warn(`[ProtectedRoute] Acceso denegado: el usuario '${user.nombre}' con rol '${user.rol}' intentó ingresar a una ruta restringida para: [${allowedRoles.join(', ')}]. Redirigiendo a /chat...`);
    return <Navigate to="/chat" replace />;
  }

  // 4. Acceso autorizado: renderizar contenido hijo o Outlet
  return children ? children : <Outlet />;
}
