import { processUserMessage } from '../agents/orchestratorAgent.js';
import { ConsultaChat } from '../models/index.js';

/**
 * Endpoint conversacional principal con el sistema Multiagente y RAG.
 * POST /api/chat/ask
 */
export async function askQuestion(req, res) {
  try {
    const { mensaje, historial = [] } = req.body;

    if (!mensaje || typeof mensaje !== 'string' || mensaje.trim().length === 0) {
      return res.status(400).json({
        error: 'Debe proporcionar un mensaje de texto no vacío en el campo "mensaje".',
      });
    }

    const cleanMessage = mensaje.trim();

    // Procesar mensaje a través del Orquestador Central
    const result = await processUserMessage({
      mensaje: cleanMessage,
      historialChat: Array.isArray(historial) ? historial : [],
      authenticatedUser: req.user,
    });

    return res.status(200).json({
      respuesta: result.respuesta,
      intencion: result.intencion,
      agente: result.agenteUtilizado,
      citas: result.citas || [],
      resuelta: result.resuelta,
      escalada: result.escalada,
      ticketId: result.ticketId,
      latenciaMs: result.latenciaMs,
      validado: result.validado,
    });
  } catch (error) {
    console.error('[ChatController Error] Error procesando consulta:', error);
    return res.status(500).json({
      error: 'Ocurrió un error al procesar tu consulta con el asistente virtual.',
      detalles: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

/**
 * Obtiene el historial de consultas del colaborador autenticado.
 * GET /api/chat/history
 */
export async function getMyChatHistory(req, res) {
  try {
    const limit = parseInt(req.query.limit || '30', 10);
    const history = await ConsultaChat.findAll({
      where: { colaborador_id: req.user.id },
      order: [['fecha', 'DESC']],
      limit: Math.min(limit, 50),
      attributes: ['id', 'pregunta', 'intencion', 'agente', 'documentos_citados', 'resuelta', 'escalada', 'latencia_ms', 'fecha'],
    });

    return res.status(200).json({
      total: history.length,
      history,
    });
  } catch (error) {
    console.error('[ChatController Error] Error obteniendo historial:', error);
    return res.status(500).json({
      error: 'Error al recuperar el historial de consultas de chat.',
    });
  }
}

export default {
  askQuestion,
  getMyChatHistory,
};
