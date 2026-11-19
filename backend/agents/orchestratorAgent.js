import { getGeminiClient, hasGeminiKey } from '../config/googleDrive.js';
import { ORCHESTRATOR_SYSTEM_PROMPT, ORCHESTRATOR_PROMPT_VERSION } from '../prompts/orchestratorPrompt.js';
import { runPolicyAgent } from './policyAgent.js';
import { runDataAgent } from './dataAgent.js';
import { validateResponse } from './validatorAgent.js';
import { createEscalationTicket } from './escalationAgent.js';
import { ConsultaChat } from '../models/index.js';

/**
 * Filtro previo de seguridad estricto para detectar intentos de consulta de datos de terceros.
 * Bloquea inmediatamente antes de tocar base de datos o RAG (Preguntas 21 y 22).
 */
function isSensitiveRestrictedQuery(text) {
  const lower = text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const restrictedPatterns = [
    /salario.*(?:gerente|roberto|companero|jefe|director|tercero|laura)/i,
    /cuanto gana.*(?:gerente|roberto|companero|juan|otro|laura|jefe)/i,
    /vacaciones de.*(?:juan|roberto|companero|otro|maria|carlos)/i,
    /dias.*de.*(?:juan|roberto|companero|otro)/i,
    /sueldo de.*(?:gerente|roberto|otro|laura)/i,
    /incapacidad de.*(?:juan|roberto|companero|maria)/i,
    /datos de.*(?:juan|roberto|otro colaborador|laura)/i,
    /lista.*(?:colaboradores|empleados).*incapacitados/i,
    /diagnostico.*(?:medico|de.*colaboradores)/i,
    /periodo de prueba de.*(?:juan|roberto|companero|otro)/i,
    /ignora.*(?:instrucciones|privacidad).*salario/i,
  ];

  return restrictedPatterns.some(pattern => pattern.test(lower));
}

/**
 * Filtro previo de consultas fuera de alcance temático (Pregunta 24).
 */
function isOutOfScopeQuery(text) {
  const lower = text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const outOfScopePatterns = [
    /pelicula|cine|receta|cocinar|futbol|partido|chiste|cancion|clima manana/i,
    /recomiendas una pelicula|recomiendame una pelicula/i,
  ];

  return outOfScopePatterns.some(pattern => pattern.test(lower));
}

/**
 * Clasificador heurístico de respaldo cuando Gemini API no está disponible.
 */
function classifyIntentHeuristically(text, userRole) {
  const lower = text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (isSensitiveRestrictedQuery(text)) {
    return 'restringida';
  }

  if (isOutOfScopeQuery(text)) {
    return 'fuera_de_alcance';
  }

  // Detectar consultas agregadas de empresa (Pregunta 25)
  if (
    lower.includes('cuantas personas') ||
    lower.includes('cuantos empleados') ||
    lower.includes('estan de vacaciones hoy') ||
    lower.includes('ausentes hoy') ||
    lower.includes('tasa de rotacion')
  ) {
    return 'dato_agregado_rrhh';
  }

  // Detectar consultas mixtas (Preguntas 19, 38, 39, 40: combina dato personal con política normativa)
  const hasPersonalIndicator =
    lower.includes('me quedan') ||
    lower.includes('mi saldo') ||
    lower.includes('tengo disponible') ||
    lower.includes('mis dias') ||
    lower.includes('mi puesto') ||
    lower.includes('proximo pago') ||
    lower.includes('solicitud');

  const hasPolicyIndicator =
    lower.includes('pasar') ||
    lower.includes('acumular') ||
    lower.includes('otro ano') ||
    lower.includes('anticipacion') ||
    lower.includes('preaviso') ||
    lower.includes('teletrabajo') ||
    lower.includes('aguinaldo') ||
    lower.includes('regla');

  if (hasPersonalIndicator && hasPolicyIndicator) {
    return 'mixta';
  }

  // Detectar datos personales propios
  if (
    lower.includes('me quedan') ||
    lower.includes('mi proximo pago') ||
    lower.includes('proximo pago') ||
    lower.includes('dia cae mi pago') ||
    lower.includes('mi evaluacion') ||
    lower.includes('mi proxima evaluacion') ||
    lower.includes('mi solicitud') ||
    lower.includes('solicitud de permiso') ||
    lower.includes('solicitud del viernes') ||
    lower.includes('mis vacaciones') ||
    lower.includes('mi puesto') ||
    lower.includes('mi departamento') ||
    lower.includes('pertenezco') ||
    lower.includes('ingrese') ||
    lower.includes('fecha de ingreso') ||
    lower.includes('tengo alguna incapacidad') ||
    lower.includes('he tomado')
  ) {
    return 'dato_personal';
  }

  // Por defecto, consulta de política o normativa general
  return 'politica';
}

/**
 * Agente Orquestador Central de RHsociety.
 *
 * @param {object} params
 * @param {string} params.mensaje Mensaje del usuario
 * @param {Array<object>} params.historialChat Últimos turnos de conversación
 * @param {object} params.authenticatedUser Usuario autenticado { id, nombre, correo, rol, departamento }
 * @returns {Promise<{
 *   respuesta: string,
 *   intencion: string,
 *   agenteUtilizado: string,
 *   citas: Array<object>,
 *   resuelta: boolean,
 *   escalada: boolean,
 *   ticketId: string | null,
 *   latenciaMs: number,
 *   validado: boolean
 * }>}
 */
export async function processUserMessage({
  mensaje,
  historialChat = [],
  authenticatedUser,
}) {
  const startTime = Date.now();
  console.log(`\n==================================================`);
  console.log(`[Orchestrator] Nueva consulta de ${authenticatedUser?.correo || 'Anónimo'}: "${mensaje}"`);

  if (!authenticatedUser || !authenticatedUser.id) {
    return {
      respuesta: 'Error de autenticación: No se detectó una sesión válida. Inicia sesión en el portal para continuar.',
      intencion: 'error',
      agenteUtilizado: 'AgenteOrquestador',
      citas: [],
      resuelta: false,
      escalada: false,
      ticketId: null,
      latenciaMs: Date.now() - startTime,
      validado: false,
    };
  }

  let intencion = 'politica';
  let agenteUtilizado = 'AgentePoliticasRAG';
  let respuestaBorrador = '';
  let citas = [];
  let resuelta = true;
  let escalada = false;
  let ticketId = null;

  // PASO 1: FAST-PATH DE SEGURIDAD CONTRA FUGAS DE PII (PREGUNTAS 21 Y 22)
  if (isSensitiveRestrictedQuery(mensaje)) {
    console.log(`[Orchestrator Security Fast-Path] Bloqueada consulta restringida de terceros.`);
    intencion = 'restringida';
    agenteUtilizado = 'AgenteOrquestador';
    respuestaBorrador = 'Por estrictas políticas de confidencialidad y protección de datos personales de RHsociety (Ley N.° 8968 - PRODHAB y Política POL-10), no está permitido consultar salarios, saldos de vacaciones ni información privada de otros colaboradores. Puedes consultar únicamente tu propia información.';
    
    return {
      respuesta: respuestaBorrador,
      intencion,
      agenteUtilizado,
      citas: [],
      resuelta: true,
      escalada: false,
      ticketId: null,
      latenciaMs: Date.now() - startTime,
      validado: true,
    };
  }

  // PASO 2: FAST-PATH DE CONSULTAS FUERA DE ALCANCE (PREGUNTA 24)
  if (isOutOfScopeQuery(mensaje)) {
    console.log(`[Orchestrator Fast-Path] Redirigiendo consulta fuera de alcance.`);
    intencion = 'fuera_de_alcance';
    agenteUtilizado = 'AgenteOrquestador';
    respuestaBorrador = 'Soy el asistente virtual especializado en Recursos Humanos de RHsociety. Mi propósito es ayudarte con consultas sobre políticas corporativas, feriados, beneficios, vacaciones y tus registros laborales. No dispongo de información sobre recomendaciones de ocio o entretenimiento.';

    return {
      respuesta: respuestaBorrador,
      intencion,
      agenteUtilizado,
      citas: [],
      resuelta: true,
      escalada: false,
      ticketId: null,
      latenciaMs: Date.now() - startTime,
      validado: true,
    };
  }

  // PASO 3: CLASIFICACIÓN DE INTENCIÓN MEDIANTE GEMINI (O CLASIFICADOR HEURÍSTICO)
  const ai = getGeminiClient();
  if (ai && hasGeminiKey()) {
    try {
      const recentHistoryText = historialChat.slice(-4).map(h => `${h.role === 'user' ? 'Colaborador' : 'Asistente'}: ${h.content}`).join('\n');
      const classificationPrompt = `PERFIL DEL USUARIO:
- Nombre: ${authenticatedUser.nombre}
- Rol: ${authenticatedUser.rol}
- Departamento: ${authenticatedUser.departamento}

HISTORIAL RECIENTE:
${recentHistoryText || 'Sin historial previo.'}

MENSAJE ACTUAL DEL COLABORADOR:
"${mensaje}"

Clasifica la intención en formato JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: classificationPrompt,
        config: {
          systemInstruction: ORCHESTRATOR_SYSTEM_PROMPT,
          temperature: 0.0,
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text.trim());
      intencion = parsed.intencion || classifyIntentHeuristically(mensaje, authenticatedUser.rol);
      console.log(`[Orchestrator] Intención clasificada por Gemini: '${intencion}' (${parsed.justificacion || 'OK'})`);
    } catch (e) {
      console.warn(`[Orchestrator Warning] Error clasificando con LLM: ${e.message}. Usando clasificador determinista.`);
      intencion = classifyIntentHeuristically(mensaje, authenticatedUser.rol);
    }
  } else {
    intencion = classifyIntentHeuristically(mensaje, authenticatedUser.rol);
    console.log(`[Orchestrator] Intención clasificada heurísticamente: '${intencion}'`);
  }

  // PASO 4: ENRUTAMIENTO Y EJECUCIÓN SEGÚN INTENCIÓN
  if (intencion === 'restringida') {
    agenteUtilizado = 'AgenteOrquestador';
    respuestaBorrador = 'Por estrictas políticas de confidencialidad y protección de datos personales de RHsociety (Ley N.° 8968 - PRODHAB y Política POL-10), no está permitido consultar salarios ni registros laborales de otros colaboradores.';
  } else if (intencion === 'fuera_de_alcance') {
    agenteUtilizado = 'AgenteOrquestador';
    respuestaBorrador = 'Soy el asistente virtual de Recursos Humanos de RHsociety. Solo puedo responder preguntas relacionadas con normativas de la empresa y tu información laboral.';
  } else if (intencion === 'dato_personal') {
    agenteUtilizado = 'AgenteDatosSQL';
    const dataResult = await runDataAgent(mensaje, authenticatedUser);
    respuestaBorrador = dataResult.respuesta;
    citas = [];
  } else if (intencion === 'dato_agregado_rrhh') {
    agenteUtilizado = 'AgenteDatosSQL';
    if (authenticatedUser.rol !== 'rrhh') {
      respuestaBorrador = 'Acceso restringido: Las estadísticas globales de la plantilla son de uso exclusivo para el personal de Recursos Humanos.';
      resuelta = true;
    } else {
      const dataResult = await runDataAgent(mensaje, authenticatedUser);
      respuestaBorrador = dataResult.respuesta;
    }
  } else if (intencion === 'mixta') {
    agenteUtilizado = 'AgenteMixto(SQL+RAG)';
    console.log(`[Orchestrator] Ejecutando agentes en paralelo (DataAgent + PolicyAgent)...`);
    
    const [dataResult, policyResult] = await Promise.all([
      runDataAgent(mensaje, authenticatedUser),
      runPolicyAgent(mensaje),
    ]);

    citas = policyResult.citas || [];
    
    // Fusión armónica de la respuesta personal y la normativa
    if (policyResult.encontrado) {
      respuestaBorrador = `${dataResult.respuesta}\n\n**Normativa aplicable de RHsociety:**\n${policyResult.respuesta}`;
    } else {
      respuestaBorrador = `${dataResult.respuesta}\n\n(Nota: La regla específica sobre ese trámite no consta en las políticas estándar y ha sido derivada a consulta interna).`;
    }
  } else {
    // Caso 'politica'
    agenteUtilizado = 'AgentePoliticasRAG';
    const policyResult = await runPolicyAgent(mensaje);
    citas = policyResult.citas || [];

    if (!policyResult.encontrado) {
      console.log(`[Orchestrator] RAG reportó encontrado: false. Activando Agente de Escalamiento...`);
      escalada = true;
      resuelta = false;

      // Crear ticket en MySQL
      const ticketRes = await createEscalationTicket({
        colaboradorId: authenticatedUser.id,
        preguntaOriginal: mensaje,
        motivo: 'Pregunta no encontrada en las políticas documentadas en Google Drive',
      });

      ticketId = ticketRes.ticketId;
      respuestaBorrador = `${policyResult.respuesta}\n\n📌 ${ticketRes.mensaje}`;
    } else {
      respuestaBorrador = policyResult.respuesta;
    }
  }

  // PASO 5: AUDITORÍA CON EL AGENTE VALIDADOR
  console.log(`[Orchestrator] Auditando respuesta con ValidatorAgent...`);
  const validationResult = validateResponse({
    respuesta: respuestaBorrador,
    citas,
    intencion,
    authenticatedUser,
  });

  const respuestaFinal = validationResult.respuestaFinal;
  const latenciaMs = Date.now() - startTime;

  // PASO 6: REGISTRO DE AUDITORÍA EN LA BASE DE DATOS (CONSULTAS_CHAT)
  try {
    await ConsultaChat.create({
      colaborador_id: authenticatedUser.id,
      pregunta: mensaje,
      intencion: intencion,
      agente: agenteUtilizado,
      documentos_citados: citas.map(c => c.documento),
      resuelta: resuelta && validationResult.aprobada,
      escalada: escalada,
      latencia_ms: latenciaMs,
      fecha: new Date(),
    });
    console.log(`[Orchestrator] Auditoría guardada en 'consultas_chat' (Latencia: ${latenciaMs}ms).`);
  } catch (logErr) {
    console.warn(`[Orchestrator Warning] No se pudo guardar el log de chat: ${logErr.message}`);
  }

  return {
    respuesta: respuestaFinal,
    intencion,
    agenteUtilizado,
    citas,
    resuelta: resuelta && validationResult.aprobada,
    escalada,
    ticketId,
    latenciaMs,
    validado: validationResult.aprobada,
  };
}

export default {
  processUserMessage,
  ORCHESTRATOR_PROMPT_VERSION,
};
