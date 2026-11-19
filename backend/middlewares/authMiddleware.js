import jwt from 'jsonwebtoken';
import { Colaborador } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'rhsociety_super_secret_key_2026';

/**
 * Middleware para verificar la validez del token JWT en el header Authorization.
 * Inyecta el objeto req.user con los datos del colaborador autenticado.
 */
export async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({
        error: 'Acceso no autorizado: Se requiere el encabezado Authorization con formato Bearer <token>.',
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Formato de token inválido. Debe ser: Bearer <token>',
      });
    }

    const token = parts[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Validar que el usuario siga existiendo y esté activo en la base de datos
    const user = await Colaborador.findByPk(decoded.id, {
      attributes: ['id', 'codigo_empleado', 'nombre', 'correo', 'departamento', 'puesto', 'rol', 'estado'],
    });

    if (!user) {
      return res.status(401).json({
        error: 'Sesión inválida: El usuario no existe en los registros corporativos.',
      });
    }

    if (user.estado !== 'activo') {
      return res.status(403).json({
        error: 'Cuenta inactiva: El colaborador se encuentra desvinculado o inactivo.',
      });
    }

    req.user = user.toJSON();
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesión expirada. Por favor inicia sesión nuevamente.' });
    }
    return res.status(401).json({ error: 'Token de autenticación inválido o alterado.' });
  }
}

/**
 * Middleware para restringir endpoints según el rol del usuario (ej. 'rrhh').
 * @param {string} role Rol requerido
 */
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }

    if (req.user.rol !== role) {
      return res.status(403).json({
        error: `Acceso denegado: Esta operación requiere permisos con rol '${role}'. Tu rol actual es '${req.user.rol}'.`,
      });
    }

    next();
  };
}

export default {
  verifyToken,
  requireRole,
};
