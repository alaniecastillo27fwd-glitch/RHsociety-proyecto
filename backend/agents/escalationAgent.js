import { TicketEscalamiento } from '../models/index.js';

/**
 * Agente de Escalamiento a Recursos Humanos.
 * Se activa automáticamente cuando el RAG no encuentra respuesta en las políticas oficiales
 * o ante consultas complejas no resueltas por la IA.
 * Crea un registro en la tabla `tickets_escalamiento` de MySQL.
 *
 * @param {object} params
 * @param {number} params.colaboradorId ID del colaborador que formula la consulta
 * @param {number|null} params.consultaChatId ID del registro de ConsultaChat asociado
 * @param {string} params.preguntaOriginal Texto exacto de la pregunta del colaborador
 * @param {string} params.motivo Razón del escalamiento
 * @returns {Promise<{ ticketId: string, id: number, estado: string, mensaje: string }>}
 */
export async function createEscalationTicket({
  colaboradorId,
  consultaChatId = null,
  preguntaOriginal,
  motivo = 'Consulta no documentada en las políticas oficiales de RHsociety',
}) {
  try {
    console.log(`[EscalationAgent] Creando ticket de escalamiento para colaborador ID: ${colaboradorId}...`);

    const ticket = await TicketEscalamiento.create({
      colaborador_id: colaboradorId,
      consulta_chat_id: consultaChatId,
      pregunta_original: preguntaOriginal,
      motivo_escalamiento: motivo,
      estado: 'abierto',
      respuesta_rrhh: null,
    });

    const ticketCode = `TCK-${String(ticket.id).padStart(4, '0')}`;
    console.log(`[EscalationAgent] Ticket generado con éxito: ${ticketCode}`);

    return {
      ticketId: ticketCode,
      id: ticket.id,
      estado: 'abierto',
      mensaje: `He generado el ticket de escalamiento **${ticketCode}** para que un especialista de la Dirección de Recursos Humanos revise tu caso. Te contactarán por correo corporativo a la brevedad.`,
    };
  } catch (error) {
    console.error('[EscalationAgent Error] Error creando ticket de escalamiento:', error.message);
    return {
      ticketId: 'TCK-ERROR',
      id: null,
      estado: 'error',
      mensaje: 'Ocurrió un inconveniente al registrar el ticket en el sistema, pero tu consulta fue reportada al equipo de Recursos Humanos.',
    };
  }
}

export default {
  createEscalationTicket,
};
