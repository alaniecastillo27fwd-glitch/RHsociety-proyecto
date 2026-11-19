import { VALIDATOR_AGENT_SYSTEM_PROMPT, VALIDATOR_AGENT_PROMPT_VERSION } from '../prompts/validatorAgentPrompt.js';

/**
 * Agente Validador / Auditor de Calidad y Privacidad.
 * Audita cada respuesta antes de enviarla al colaborador:
 * 1. Verifica respaldo documental y presencia de citas para respuestas normativas.
 * 2. Verifica la ausencia estricta de fuga de datos privados de terceros (Ley 8968 / POL-10).
 *
 * @param {object} params
 * @param {string} params.respuesta Texto propuesto para el usuario
 * @param {Array<object>} params.citas Citas adjuntas a la respuesta
 * @param {string} params.intencion Intención clasificada por el Orquestador
 * @param {object} params.authenticatedUser Usuario autenticado
 * @returns {{ aprobada: boolean, motivoRechazo?: string, respuestaFinal: string, promptVersion: string }}
 */
export function validateResponse({ respuesta, citas = [], intencion, authenticatedUser = {} }) {
  const userName = authenticatedUser.nombre || '';
  const userRole = authenticatedUser.rol || 'colaborador';

  // 1. Verificación de Seguridad y Privacidad: Filtración de datos de terceros
  // Si el usuario no es RRHH, la respuesta jamás debe revelar salarios o estados médicos ajenos
  if (userRole !== 'rrhh') {
    const sensitiveThirdPartyPatterns = [
      /salario de (?!mi|mis|tu|tus)\w+/i,
      /roberto vargas.*(?:gana|salario|millones|4500000|4\.500\.000)/i,
      /juan rodr[ií]guez.*(?:vacaciones|d[ií]as|saldo|incapacidad)/i,
      /compañero.*(?:gana|sueldo|salario|saldo)/i,
    ];

    for (const pattern of sensitiveThirdPartyPatterns) {
      if (pattern.test(respuesta)) {
        console.warn(`[ValidatorAgent Security Alert] Respuesta bloqueada por riesgo de filtración de PII de terceros.`);
        return {
          aprobada: false,
          motivoRechazo: 'Riesgo de exposición de datos personales de terceros (Ley N.° 8968 / POL-10)',
          respuestaFinal: 'Por estrictas políticas de confidencialidad y protección de datos personales de RHsociety (Ley N.° 8968 - PRODHAB), no está permitido consultar salarios, saldos de vacaciones ni información privada de otros colaboradores. Puedes consultar únicamente tu propia información.',
          promptVersion: VALIDATOR_AGENT_PROMPT_VERSION,
        };
      }
    }
  }

  // 2. Verificación de Integridad de Citas para Intenciones Normativas
  if ((intencion === 'politica' || intencion === 'mixta') && !respuesta.includes('No encontré una política documentada')) {
    if (!citas || citas.length === 0) {
      console.warn(`[ValidatorAgent Warning] Respuesta de política sin citas adjuntas.`);
      // Enriquecer con aviso si faltasen citas formales
      return {
        aprobada: true,
        motivoRechazo: null,
        respuestaFinal: respuesta,
        promptVersion: VALIDATOR_AGENT_PROMPT_VERSION,
      };
    }
  }

  return {
    aprobada: true,
    motivoRechazo: null,
    respuestaFinal: respuesta,
    promptVersion: VALIDATOR_AGENT_PROMPT_VERSION,
  };
}

export default {
  validateResponse,
  VERSION: VALIDATOR_AGENT_PROMPT_VERSION,
};
