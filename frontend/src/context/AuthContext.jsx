import { createContext, useContext, useState, useEffect } from 'react';
import { loginRequest, getProfileRequest } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('rhsociety_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('rhsociety_token') || null;
  });

  const [loading, setLoading] = useState(true);

  // Al montar la aplicación, verificar la vigencia del token y refrescar el perfil
  useEffect(() => {
    async function verifySession() {
      const storedToken = localStorage.getItem('rhsociety_token');
      if (!storedToken) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      try {
        const data = await getProfileRequest();
        if (data && data.user) {
          setUser(data.user);
          localStorage.setItem('rhsociety_user', JSON.stringify(data.user));
        }
      } catch (error) {
        console.warn('[AuthContext] Sesión expirada o token inválido al cargar perfil:', error.message);
        localStorage.removeItem('rhsociety_token');
        localStorage.removeItem('rhsociety_user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, []);

  /**
   * Inicia sesión con correo corporativo y contraseña.
   */
  const login = async (correo, password) => {
    try {
      const data = await loginRequest(correo, password);
      if (data && data.token && data.user) {
        localStorage.setItem('rhsociety_token', data.token);
        localStorage.setItem('rhsociety_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, error: 'Credenciales inválidas.' };
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || 'Error al iniciar sesión.';
      return { success: false, error: msg };
    }
  };

  /**
   * Cierra la sesión activa y limpia el almacenamiento local.
   */
  const logout = () => {
    localStorage.removeItem('rhsociety_token');
    localStorage.removeItem('rhsociety_user');
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    isRRHH: user?.rol === 'rrhh',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}

export default AuthContext;
