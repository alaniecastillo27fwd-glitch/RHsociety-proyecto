import {
  ReporteDiario,
  Solicitud,
  TicketEscalamiento,
  Colaborador,
  SaldoVacaciones,
} from '../models/index.js';
import { generateDailyReport, getCostaRicaDateString } from '../agents/analystAgent.js';

/**
 * Obtiene la lista en vivo de solicitudes pendientes directamente de MySQL.
 */
export async function getLivePendingRequests(fechaReferencia = null) {
  const fecha = fechaReferencia || getCostaRicaDateString();
  const solicitudesPendientes = await Solicitud.findAll({
    where: { estado: 'pendiente' },
    include: [
      {
        model: Colaborador,
        as: 'colaborador',
        attributes: ['id', 'nombre', 'departamento', 'puesto'],
      },
    ],
    order: [['creada_en', 'ASC'], ['id', 'ASC']],
  });

  let solicitudesCriticasGt3d = 0;
  const listaDetalladaPendientes = solicitudesPendientes.map((sol) => {
    const c = sol.colaborador;
    const fechaCreacionStr = sol.creada_en
      ? new Date(sol.creada_en).toISOString().split('T')[0]
      : (sol.createdAt ? new Date(sol.createdAt).toISOString().split('T')[0] : fecha);

    const diffMs = new Date(fecha + 'T00:00:00Z') - new Date(fechaCreacionStr + 'T00:00:00Z');
    const diasPendiente = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const esCritica = diasPendiente > 3;
    if (esCritica) solicitudesCriticasGt3d++;

    return {
      id: sol.id,
      colaborador_id: sol.colaborador_id,
      nombre: c ? c.nombre : 'Colaborador',
      departamento: c ? c.departamento : 'General',
      tipo: sol.tipo,
      fecha_solicitud: fechaCreacionStr,
      fecha_inicio: sol.fecha_inicio,
      fecha_fin: sol.fecha_fin,
      dias_solicitados: sol.dias_solicitados,
      dias_pendiente: diasPendiente,
      antiguedad_mayor_3_dias: esCritica,
    };
  });

  return {
    total_pendientes: listaDetalladaPendientes.length,
    pendientes_mas_3_dias: solicitudesCriticasGt3d,
    antiguedad_critica_mayor_3_dias: solicitudesCriticasGt3d,
    lista_pendientes: listaDetalladaPendientes,
  };
}

/**
 * Obtiene el reporte diario para una fecha específica (o la más reciente).
 * Si no existe para la fecha consultada, lo genera automáticamente.
 * Sincroniza en tiempo real las solicitudes pendientes con la base de datos.
 */
export async function getDailyReport(req, res) {
  try {
    const fecha = req.query.fecha || getCostaRicaDateString();
    let reporte = await ReporteDiario.findOne({ where: { fecha } });

    if (!reporte) {
      console.log(`[DashboardController] Reporte para ${fecha} no encontrado. Generando en caliente...`);
      reporte = await generateDailyReport(fecha);
    }

    // Sincronizar en vivo con la tabla real de solicitudes pendientes en MySQL
    const livePending = await getLivePendingRequests(fecha);
    if (reporte && reporte.datos_json) {
      const datosActualizados = { ...reporte.datos_json };
      datosActualizados.solicitudes_pendientes = livePending.total_pendientes;
      datosActualizados.solicitudes_pendientes_criticas_gt_3d = livePending.antiguedad_critica_mayor_3_dias;
      datosActualizados.elemento_2_solicitudes = livePending;
      if (datosActualizados.elemento_1_kpis) {
        datosActualizados.elemento_1_kpis.solicitudes_pendientes_aprobacion = livePending.total_pendientes;
      }
      reporte.datos_json = datosActualizados;

      // Persistir la actualización en la base de datos
      await ReporteDiario.update(
        { datos_json: datosActualizados },
        { where: { id: reporte.id } }
      );
    }

    return res.status(200).json({
      success: true,
      reporte: {
        id: reporte.id,
        fecha: reporte.fecha,
        datos_json: reporte.datos_json,
        resumen_texto: reporte.resumen_texto,
        generado_por: reporte.generado_por,
      },
    });
  } catch (error) {
    console.error('[DashboardController Error] Error obteniendo reporte diario:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno obteniendo reporte diario de RRHH.',
      detalle: error.message,
    });
  }
}

/**
 * Obtiene la lista de reportes históricos disponibles para el selector.
 */
export async function getReportsHistory(req, res) {
  try {
    const reportes = await ReporteDiario.findAll({
      attributes: ['id', 'fecha', 'generado_por', 'createdAt'],
      order: [['fecha', 'DESC']],
      limit: 30,
    });

    return res.status(200).json({
      success: true,
      reportes,
    });
  } catch (error) {
    console.error('[DashboardController Error] Error listando historial de reportes:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno obteniendo historial de reportes.',
    });
  }
}

/**
 * Endpoint para obtener exclusivamente las solicitudes pendientes en vivo.
 */
export async function getPendingRequests(req, res) {
  try {
    const livePending = await getLivePendingRequests();
    return res.status(200).json({
      success: true,
      ...livePending,
    });
  } catch (error) {
    console.error('[DashboardController Error] Error obteniendo solicitudes pendientes:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno obteniendo solicitudes pendientes.',
    });
  }
}

/**
 * Fuerza la regeneración del reporte del día en tiempo real.
 */
export async function generateReportNow(req, res) {
  try {
    const fecha = req.body.fecha || getCostaRicaDateString();
    console.log(`[DashboardController] Forzando regeneración de reporte para: ${fecha}...`);
    const nuevoReporte = await generateDailyReport(fecha);

    return res.status(200).json({
      success: true,
      mensaje: 'Reporte generado exitosamente.',
      reporte: nuevoReporte,
    });
  } catch (error) {
    console.error('[DashboardController Error] Error generando reporte en demanda:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al forzar generación de reporte diario.',
      detalle: error.message,
    });
  }
}

/**
 * Actualiza el estado de una solicitud (Aprobar / Rechazar) directamente en MySQL
 * y sincroniza los reportes diarios y saldos de vacaciones.
 */
export async function updateRequestStatus(req, res) {
  try {
    const { id } = req.params;
    const { estado, comentario } = req.body || {};

    if (!['aprobada', 'rechazada', 'pendiente'].includes(estado)) {
      return res.status(400).json({
        success: false,
        error: "Estado no válido. Valores permitidos: 'aprobada', 'rechazada', 'pendiente'.",
      });
    }

    const solicitud = await Solicitud.findByPk(id, {
      include: [
        {
          model: Colaborador,
          as: 'colaborador',
          attributes: ['id', 'nombre', 'correo', 'departamento'],
        },
      ],
    });

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        error: `Solicitud con id ${id} no encontrada en la base de datos.`,
      });
    }

    // Actualizar registro en MySQL
    solicitud.estado = estado;
    if (comentario) {
      solicitud.motivo = `${solicitud.motivo || ''} [Resolución RRHH: ${comentario}]`;
    }
    solicitud.aprobador_id = req.user ? req.user.id : null;
    await solicitud.save();

    // Si se aprueba una solicitud de vacaciones, descontar del saldo disponible en MySQL
    if (estado === 'aprobada' && solicitud.tipo === 'vacaciones') {
      const saldo = await SaldoVacaciones.findOne({ where: { colaborador_id: solicitud.colaborador_id } });
      if (saldo) {
        saldo.dias_tomados = Number(saldo.dias_tomados) + Number(solicitud.dias_solicitados);
        saldo.dias_disponibles = Math.max(0, Number(saldo.dias_disponibles) - Number(solicitud.dias_solicitados));
        await saldo.save();
      }
    }

    // Obtener la lista actualizada de solicitudes pendientes en tiempo real
    const livePending = await getLivePendingRequests();

    // Sincronizar todos los reportes diarios existentes en la base de datos
    const reportesRecientes = await ReporteDiario.findAll({
      order: [['fecha', 'DESC']],
      limit: 10,
    });

    for (const rep of reportesRecientes) {
      if (rep.datos_json) {
        const datos = { ...rep.datos_json };
        datos.solicitudes_pendientes = livePending.total_pendientes;
        datos.solicitudes_pendientes_criticas_gt_3d = livePending.antiguedad_critica_mayor_3_dias;
        datos.elemento_2_solicitudes = livePending;
        if (datos.elemento_1_kpis) {
          datos.elemento_1_kpis.solicitudes_pendientes_aprobacion = livePending.total_pendientes;
        }
        await ReporteDiario.update(
          { datos_json: datos },
          { where: { id: rep.id } }
        );
      }
    }

    return res.status(200).json({
      success: true,
      mensaje: `Solicitud #${id} ${estado === 'aprobada' ? 'aprobada' : 'rechazada'} exitosamente en base de datos.`,
      solicitud,
      solicitudes_pendientes: livePending.lista_pendientes,
      total_pendientes: livePending.total_pendientes,
    });
  } catch (error) {
    console.error('[DashboardController Error] Error actualizando solicitud:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno actualizando solicitud en la base de datos.',
      detalle: error.message,
    });
  }
}

/**
 * Lista todos los tickets de escalamiento con información del colaborador.
 */
export async function getTickets(req, res) {
  try {
    const tickets = await TicketEscalamiento.findAll({
      include: [
        {
          model: Colaborador,
          as: 'colaborador',
          attributes: ['id', 'nombre', 'correo', 'departamento', 'puesto'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      tickets,
    });
  } catch (error) {
    console.error('[DashboardController Error] Error obteniendo tickets:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno obteniendo tickets de escalamiento.',
    });
  }
}

/**
 * Resuelve un ticket de escalamiento con respuesta oficial de RRHH.
 */
export async function resolveTicket(req, res) {
  try {
    const { id } = req.params;
    const { respuesta_rrhh } = req.body || {};

    if (!respuesta_rrhh || respuesta_rrhh.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'La respuesta de RRHH es obligatoria para resolver el ticket.',
      });
    }

    const ticket = await TicketEscalamiento.findByPk(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: `Ticket #${id} no encontrado.`,
      });
    }

    ticket.estado = 'resuelto';
    ticket.respuesta_rrhh = respuesta_rrhh.trim();
    await ticket.save();

    return res.status(200).json({
      success: true,
      mensaje: `Ticket #${id} resuelto satisfactoriamente.`,
      ticket,
    });
  } catch (error) {
    console.error('[DashboardController Error] Error resolviendo ticket:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno resolviendo ticket.',
      detalle: error.message,
    });
  }
}

export default {
  getDailyReport,
  getReportsHistory,
  generateReportNow,
  updateRequestStatus,
  getPendingRequests,
  getLivePendingRequests,
  getTickets,
  resolveTicket,
};
