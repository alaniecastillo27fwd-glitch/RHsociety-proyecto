import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Colaborador, SaldoVacaciones } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'rhsociety_super_secret_key_2026';
const JWT_EXPIRES_IN = '12h';

/**
 * Inicia sesión para un colaborador o miembro de RRHH.
 * POST /api/auth/login
 */
export async function login(req, res) {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({
        error: 'Debe proporcionar tanto el correo electrónico como la contraseña.',
      });
    }

    const cleanEmail = correo.trim().toLowerCase();

    // Buscar colaborador por correo corporativo
    const user = await Colaborador.findOne({
      where: { correo: cleanEmail },
      include: [{ model: SaldoVacaciones, as: 'saldo_vacaciones' }],
    });

    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas: No existe una cuenta asociada a ese correo.',
      });
    }

    if (user.estado !== 'activo') {
      return res.status(403).json({
        error: 'Acceso denegado: Tu cuenta se encuentra en estado inactivo.',
      });
    }

    // Verificar contraseña con bcrypt
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Credenciales inválidas: La contraseña ingresada es incorrecta.',
      });
    }

    // Firmar token JWT con payload del colaborador
    const tokenPayload = {
      id: user.id,
      codigo_empleado: user.codigo_empleado,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol,
      departamento: user.departamento,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: {
        id: user.id,
        codigo_empleado: user.codigo_empleado,
        nombre: user.nombre,
        correo: user.correo,
        departamento: user.departamento,
        puesto: user.puesto,
        rol: user.rol,
        proxima_evaluacion: user.proxima_evaluacion,
        fecha_proximo_pago: user.fecha_proximo_pago,
        saldo_vacaciones: user.saldo_vacaciones,
      },
    });
  } catch (error) {
    console.error('[AuthController Error] Error en login:', error);
    return res.status(500).json({
      error: 'Ocurrió un error interno en el servidor al autenticar.',
    });
  }
}

/**
 * Obtiene el perfil del usuario autenticado junto con su saldo de vacaciones vigente.
 * GET /api/auth/me
 */
export async function getProfile(req, res) {
  try {
    const user = await Colaborador.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: SaldoVacaciones, as: 'saldo_vacaciones' }],
    });

    if (!user) {
      return res.status(404).json({ error: 'Colaborador no encontrado.' });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error('[AuthController Error] Error obteniendo perfil:', error);
    return res.status(500).json({
      error: 'Error al recuperar los datos del perfil.',
    });
  }
}

export default {
  login,
  getProfile,
};
