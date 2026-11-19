import { Op } from 'sequelize';
import {
  Colaborador,
  SaldoVacaciones,
  Solicitud,
  Incapacidad,
} from '../models/index.js';
import { getGeminiClient, hasGeminiKey } from '../config/googleDrive.js';
import { DATA_AGENT_SYSTEM_PROMPT, DATA_AGENT_PROMPT_VERSION } from '../prompts/dataAgentPrompt.js';

const TODAY_STR = '2026-11-18';

/**
 * Capa de extracción segura de datos personales aislada por usuario autenticado.
 * Aplica el principio de Zero-Trust: el id del colaborador se extrae directamente
 * del objeto de sesión verificado, nunca del texto del usuario.
 *
 * @param {object} authenticatedUser Objeto del usuario autenticado { id, rol, ... }
 * @returns {Promise<object>} Contexto seguro y sanitizado
 */
export async function fetchUserSafeContext(authenticatedUser) {
  if (!authenticatedUser || !authenticatedUser.id) {
    throw new Error('[DataAgent Security] Usuario no autenticado o ID inválido.');
  }

  const userId = authenticatedUser.id;
  const userRole = authenticatedUser.rol || 'colaborador';

  // 1. Datos propios del colaborador (excluyendo password_hash)
  const profile = await Colaborador.findByPk(userId, {
    attributes: [
      'id',
      'codigo_empleado',
      'nombre',
      'correo',
      'departamento',
      'puesto',
      'salario_mensual',
      'fecha_ingreso',
      'proxima_evaluacion',
      'fecha_proximo_pago',
      'rol',
      'estado',
    ],
  });

  if (!profile) {
    throw new Error(`[DataAgent Security] Colaborador con ID ${userId} no encontrado en la base de datos.`);
  }

  // 2. Saldo de vacaciones del propio colaborador
  const saldo = await SaldoVacaciones.findOne({
    where: { colaborador_id: userId },
    order: [['periodo', 'DESC']],
    attributes: ['periodo', 'dias_asignados', 'dias_tomados', 'dias_disponibles'],
  });

  // 3. Últimas 10 solicitudes del propio colaborador
  const solicitudes = await Solicitud.findAll({
    where: { colaborador_id: userId },
    order: [['creada_en', 'DESC']],
    limit: 10,
    attributes: ['id', 'tipo', 'fecha_inicio', 'fecha_fin', 'dias_solicitados', 'motivo', 'estado', 'creada_en'],
  });

  // 4. Incapacidades del propio colaborador
  const incapacidades = await Incapacidad.findAll({
    where: { colaborador_id: userId },
    order: [['fecha_inicio', 'DESC']],
    limit: 5,
    attributes: ['id', 'tipo', 'fecha_inicio', 'dias', 'entidad', 'numero_boleta'],
  });

  // 5. Métricas globales de la empresa (SOLO si el usuario tiene rol 'rrhh')
  let metricasGlobalesRRHH = null;
  if (userRole === 'rrhh') {
    const totalActivos = await Colaborador.count({ where: { estado: 'activo' } });
    
    // Ausencias aprobadas vigentes HOY (desglosadas)
    const vacacionesHoy = await Solicitud.count({
      where: {
        tipo: 'vacaciones',
        estado: 'aprobada',
        fecha_inicio: { [Op.lte]: TODAY_STR },
        fecha_fin: { [Op.gte]: TODAY_STR },
      },
    });

    const permisosHoy = await Solicitud.count({
      where: {
        tipo: { [Op.ne]: 'vacaciones' },
        estado: 'aprobada',
        fecha_inicio: { [Op.lte]: TODAY_STR },
        fecha_fin: { [Op.gte]: TODAY_STR },
      },
    });

    // Incapacidades activas HOY (fecha_inicio <= HOY y fecha_inicio + dias >= HOY)
    const incsActivas = await Incapacidad.findAll({
      where: {
        fecha_inicio: { [Op.lte]: TODAY_STR },
      },
      attributes: ['fecha_inicio', 'dias'],
    });

    let incapacidadesHoy = 0;
    const todayDate = new Date(`${TODAY_STR}T00:00:00Z`);
    for (const inc of incsActivas) {
      const start = new Date(`${inc.fecha_inicio}T00:00:00Z`);
      const end = new Date(start.getTime() + (inc.dias * 24 * 60 * 60 * 1000));
      if (todayDate >= start && todayDate <= end) {
        incapacidadesHoy++;
      }
    }

    const solicitudesPendientes = await Solicitud.count({
      where: { estado: 'pendiente' },
    });

    metricasGlobalesRRHH = {
      total_colaboradores_activos: totalActivos,
      personas_vacaciones_hoy: vacacionesHoy,
      personas_permisos_hoy: permisosHoy,
      personas_incapacitadas_hoy: incapacidadesHoy,
      total_ausentes_hoy: vacacionesHoy + permisosHoy + incapacidadesHoy,
      solicitudes_pendientes_global: solicitudesPendientes,
    };
  }

  return {
    perfil: profile.toJSON(),
    saldo_vacaciones: saldo ? saldo.toJSON() : null,
    solicitudes: solicitudes.map(s => s.toJSON()),
    incapacidades: incapacidades.map(i => i.toJSON()),
    metricas_globales_rrhh: metricasGlobalesRRHH,
  };
}

/**
 * Agente de Datos del Colaborador.
 * Consulta exclusivamente los registros correspondientes al usuario autenticado
 * y formula una respuesta natural mediante Gemini (o fallback determinista).
 *
 * @param {string} query Pregunta del usuario
 * @param {object} authenticatedUser Usuario autenticado extraído del token JWT
 * @returns {Promise<{
 *   respuesta: string,
 *   datosConsultados: object,
 *   promptVersion: string
 * }>}
 */
export async function runDataAgent(query, authenticatedUser) {
  if (!authenticatedUser || !authenticatedUser.id) {
    return {
      respuesta: 'Error de autenticación: No se proporcionó una sesión de usuario válida para consultar los registros.',
      datosConsultados: null,
      promptVersion: DATA_AGENT_PROMPT_VERSION,
    };
  }

  console.log(`[DataAgent] Procesando consulta para usuario: ${authenticatedUser.correo} (ID: ${authenticatedUser.id}, Rol: ${authenticatedUser.rol})`);

  // 1. Detección de intento de consultar métricas globales por parte de un colaborador sin rol rrhh
  const queryLower = query.toLowerCase();
  const isAskingGlobal = queryLower.includes('cuántas personas') ||
    queryLower.includes('cuantos empleados') ||
    queryLower.includes('están de vacaciones hoy') ||
    queryLower.includes('ausentes hoy') ||
    queryLower.includes('plantilla');

  if (isAskingGlobal && authenticatedUser.rol !== 'rrhh') {
    console.log(`[DataAgent Security] Acceso denegado: Usuario ${authenticatedUser.correo} intentó consultar métricas globales sin rol rrhh.`);
    return {
      respuesta: 'Acceso restringido: Las métricas y estadísticas globales de la plantilla son exclusivas para el personal de Recursos Humanos. Como colaborador, puedes consultar únicamente tus propios saldos, solicitudes y fechas laborales.',
      datosConsultados: { acceso_denegado: true, motivo: 'Rol insuficiente' },
      promptVersion: DATA_AGENT_PROMPT_VERSION,
    };
  }

  // 2. Extraer contexto seguro de la base de datos
  const safeContext = await fetchUserSafeContext(authenticatedUser);

  // 3. Invocar Gemini para formatear la respuesta si la API key está disponible
  const ai = getGeminiClient();

  if (ai && hasGeminiKey()) {
    try {
      const userPrompt = `CONTEXTO DE DATOS SEGUROS DEL USUARIO AUTENTICADO:
${JSON.stringify(safeContext, null, 2)}

FECHA ACTUAL DEL SISTEMA: ${TODAY_STR}

CONSULTA DEL USUARIO: "${query}"

Responde en formato JSON respetando las cifras exactas.`;

      console.log(`[DataAgent] Invocando gemini-2.5-flash (temperatura: 0.0)...`);
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: DATA_AGENT_SYSTEM_PROMPT,
          temperature: 0.0,
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text ? response.text.trim() : '';
      const parsed = JSON.parse(responseText);

      return {
        respuesta: parsed.respuesta,
        datosConsultados: safeContext,
        promptVersion: DATA_AGENT_PROMPT_VERSION,
      };
    } catch (llmError) {
      console.warn(`[DataAgent Warning] Error invocando Gemini: ${llmError.message}. Recurriendo a generador determinista.`);
    }
  }

  // 4. Generador determinista de alta fidelidad basado en los datos seguros extraídos
  let respuestaTexto = '';
  const p = safeContext.perfil;
  const s = safeContext.saldo_vacaciones;
  const solics = safeContext.solicitudes || [];

  if (isAskingGlobal && authenticatedUser.rol === 'rrhh') {
    const m = safeContext.metricas_globales_rrhh;
    respuestaTexto = `Estimada ${p.nombre} (${p.puesto}):\n\nAl día de hoy (${TODAY_STR}), se registran ${m.personas_vacaciones_hoy} colaboradores en disfrute de vacaciones aprobadas en toda la empresa. Adicionalmente, hay ${m.personas_incapacitadas_hoy} colaboradores incapacitados y ${m.personas_permisos_hoy} con permiso aprobado, para un total consolidado de ${m.total_ausentes_hoy} personas ausentes sobre una plantilla activa de ${m.total_colaboradores_activos} colaboradores.`;
  } else if (queryLower.includes('vacacion') || queryLower.includes('saldo') || queryLower.includes('días')) {
    if (s) {
      respuestaTexto = `Hola ${p.nombre}. De acuerdo con tus registros actuales en RHsociety, dispones de exactamente ${s.dias_disponibles} días hábiles de vacaciones correspondientes al periodo ${s.periodo} (has tomado ${s.dias_tomados} días de tus ${s.dias_asignados} días asignados).`;
    } else {
      respuestaTexto = `Hola ${p.nombre}. No se encontró un registro activo de saldo de vacaciones para tu perfil.`;
    }
  } else if (queryLower.includes('ingres') || queryLower.includes('antigüedad') || queryLower.includes('contrat')) {
    respuestaTexto = `Hola ${p.nombre}. Tu fecha formal de ingreso a RHsociety es el ${p.fecha_ingreso} (asignado al departamento de ${p.departamento} como ${p.puesto}).`;
  } else if (queryLower.includes('incapacidad') || queryLower.includes('ccss') || queryLower.includes('enfermedad')) {
    const incs = safeContext.incapacidades || [];
    if (incs.length > 0) {
      respuestaTexto = `Hola ${p.nombre}. Cuentas con ${incs.length} registro(s) de incapacidad médica en tu expediente institucional.`;
    } else {
      respuestaTexto = `Hola ${p.nombre}. No registras incapacidades médicas activas en tu expediente durante este periodo.`;
    }
  } else if (queryLower.includes('puesto') || queryLower.includes('departamento') || queryLower.includes('cargo')) {
    respuestaTexto = `Hola ${p.nombre}. Tu puesto oficial en RHsociety es ${p.puesto} y perteneces al departamento de ${p.departamento}.`;
  } else if (queryLower.includes('pago') || queryLower.includes('salario') || queryLower.includes('quincena')) {
    respuestaTexto = `Hola ${p.nombre}. Tu próximo pago quincenal de nómina está programado para el día ${p.fecha_proximo_pago || '30 de noviembre de 2026'}, mediante depósito electrónico en tu cuenta bancaria registrada.`;
  } else if (queryLower.includes('evaluacion') || queryLower.includes('evaluación') || queryLower.includes('desempeño')) {
    respuestaTexto = `Hola ${p.nombre}. Tu próxima evaluación semestral de desempeño está calendarizada para el día ${p.proxima_evaluacion || '10 de diciembre de 2026'}.`;
  } else if (queryLower.includes('solicitud') || queryLower.includes('permiso') || queryLower.includes('viernes')) {
    if (solics.length > 0) {
      const ultima = solics[0];
      const estadoDesc = ultima.estado === 'pendiente' ? 'pendiente de aprobación por tu jefatura' : (ultima.estado === 'aprobada' ? 'aprobada' : 'rechazada');
      respuestaTexto = `Hola ${p.nombre}. Tu solicitud de ${ultima.tipo.replace(/_/g, ' ')} para la fecha ${ultima.fecha_inicio}${ultima.fecha_fin !== ultima.fecha_inicio ? ' al ' + ultima.fecha_fin : ''} se encuentra actualmente en estado "${ultima.estado.toUpperCase()}" (${estadoDesc}).`;
    } else {
      respuestaTexto = `Hola ${p.nombre}. No tienes solicitudes registradas recientemente en el sistema.`;
    }
  } else {
    respuestaTexto = `Hola ${p.nombre}. Tus datos laborales en RHsociety son: Puesto: ${p.puesto} (${p.departamento}), Próximo pago: ${p.fecha_proximo_pago}, Próxima evaluación: ${p.proxima_evaluacion}, Saldo vacaciones: ${s ? s.dias_disponibles : 'N/A'} días hábiles disponibles.`;
  }

  return {
    respuesta: respuestaTexto,
    datosConsultados: safeContext,
    promptVersion: DATA_AGENT_PROMPT_VERSION,
  };
}

export default {
  runDataAgent,
  fetchUserSafeContext,
};
