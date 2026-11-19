import { useState, useEffect, useCallback } from 'react';
import {
  getDashboardReportRequest,
  getReportsHistoryRequest,
  generateReportNowRequest,
  updateRequestStatusRequest,
  getTicketsRequest,
  resolveTicketRequest,
  syncDriveRequest,
} from '../services/api.js';
import Navbar from '../components/Navbar.jsx';
import ExecutiveSummaryBox from '../components/ExecutiveSummaryBox.jsx';
import KpiCard from '../components/KpiCard.jsx';
import TrendChart30Days from '../components/TrendChart30Days.jsx';
import DepartmentAndTopicsCharts from '../components/DepartmentAndTopicsCharts.jsx';
import PendingRequestsTable from '../components/PendingRequestsTable.jsx';
import TicketsAndRisksPanel from '../components/TicketsAndRisksPanel.jsx';
import {
  Users,
  Clock,
  Activity,
  TrendingDown,
  Bot,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function HrDashboardPage() {
  // Estados de datos
  const [reporteActual, setReporteActual] = useState(null);
  const [historialFechas, setHistorialFechas] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [ticketsList, setTicketsList] = useState([]);

  // Estados de carga y feedback
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [syncingDrive, setSyncingDrive] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [resolvingTicketId, setResolvingTicketId] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotification = (tipo, mensaje) => {
    setNotification({ tipo, mensaje });
    setTimeout(() => setNotification(null), 5000);
  };

  // Cargar historial de fechas de reportes
  const loadReportsHistory = useCallback(async () => {
    try {
      const data = await getReportsHistoryRequest();
      if (data && Array.isArray(data.reportes)) {
        setHistorialFechas(data.reportes);
        if (data.reportes.length > 0 && !fechaSeleccionada) {
          setFechaSeleccionada(data.reportes[0].fecha);
        }
      }
    } catch (err) {
      console.warn('[HrDashboard] Error cargando historial de reportes:', err.message);
    }
  }, [fechaSeleccionada]);

  // Cargar el reporte diario para la fecha seleccionada
  const loadReport = useCallback(async (fecha = null) => {
    try {
      setLoading(true);
      const data = await getDashboardReportRequest(fecha);
      if (data && data.reporte) {
        setReporteActual(data.reporte);
        if (!fechaSeleccionada) {
          setFechaSeleccionada(data.reporte.fecha);
        }
      }
    } catch (err) {
      console.error('[HrDashboard Error] Error cargando reporte diario:', err);
      showNotification('error', 'No se pudo cargar el reporte diario de RRHH.');
    } finally {
      setLoading(false);
    }
  }, [fechaSeleccionada]);

  // Cargar tickets de escalamiento
  const loadTickets = useCallback(async () => {
    try {
      const data = await getTicketsRequest();
      if (data && Array.isArray(data.tickets)) {
        setTicketsList(data.tickets);
      }
    } catch (err) {
      console.warn('[HrDashboard] Error cargando tickets de escalamiento:', err.message);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    loadReportsHistory();
    loadReport();
    loadTickets();
  }, [loadReportsHistory, loadReport, loadTickets]);

  // Al cambiar la fecha seleccionada en el combo
  const handleSelectFecha = (nuevaFecha) => {
    setFechaSeleccionada(nuevaFecha);
    loadReport(nuevaFecha);
  };

  // Forzar regeneración del reporte diario hoy
  const handleRegenerateReport = async () => {
    try {
      setRegenerating(true);
      const data = await generateReportNowRequest();
      if (data && data.reporte) {
        setReporteActual(data.reporte);
        setFechaSeleccionada(data.reporte.fecha);
        showNotification('success', '¡Reporte diario recalculado y actualizado exitosamente!');
        await loadReportsHistory();
        await loadTickets();
      }
    } catch (err) {
      console.error('[HrDashboard Error] Error regenerando reporte:', err);
      showNotification('error', 'Error al regenerar el reporte diario.');
    } finally {
      setRegenerating(false);
    }
  };

  // Sincronizar Google Drive en demanda
  const handleSyncDrive = async () => {
    try {
      setSyncingDrive(true);
      await syncDriveRequest();
      showNotification('success', 'Sincronización con Google Drive completada exitosamente.');
      await loadReport(fechaSeleccionada);
    } catch (err) {
      console.error('[HrDashboard Error] Error sincronizando Drive:', err);
      showNotification('error', 'Error durante la sincronización con Google Drive.');
    } finally {
      setSyncingDrive(false);
    }
  };

  // Aprobar solicitud
  const handleApproveRequest = async (solicitudId) => {
    try {
      setActionLoadingId(solicitudId);

      // Actualización optimista inmediata en la interfaz
      setReporteActual((prev) => {
        if (!prev || !prev.datos_json) return prev;
        const oldLista = prev.datos_json?.elemento_2_solicitudes?.lista_pendientes || [];
        const nuevaLista = oldLista.filter((s) => s.id !== solicitudId);
        const total = nuevaLista.length;
        const criticas = nuevaLista.filter((s) => s.antiguedad_mayor_3_dias || s.dias_pendiente > 3).length;
        return {
          ...prev,
          datos_json: {
            ...prev.datos_json,
            solicitudes_pendientes: total,
            solicitudes_pendientes_criticas_gt_3d: criticas,
            elemento_1_kpis: {
              ...prev.datos_json.elemento_1_kpis,
              solicitudes_pendientes_aprobacion: total,
            },
            elemento_2_solicitudes: {
              ...prev.datos_json.elemento_2_solicitudes,
              total_pendientes: total,
              pendientes_mas_3_dias: criticas,
              antiguedad_critica_mayor_3_dias: criticas,
              lista_pendientes: nuevaLista,
            },
          },
        };
      });

      const res = await updateRequestStatusRequest(solicitudId, 'aprobada', 'Aprobada formalmente por RRHH.');
      showNotification('success', `Solicitud #${solicitudId} aprobada formalmente y reflejada en la base de datos.`);
      await loadReport(fechaSeleccionada);
    } catch (err) {
      console.error('[HrDashboard Error] Error aprobando solicitud:', err);
      showNotification('error', `Error al aprobar la solicitud #${solicitudId}: ${err.message}`);
      await loadReport(fechaSeleccionada);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Rechazar solicitud
  const handleRejectRequest = async (solicitudId, comentario) => {
    try {
      setActionLoadingId(solicitudId);

      // Actualización optimista inmediata en la interfaz
      setReporteActual((prev) => {
        if (!prev || !prev.datos_json) return prev;
        const oldLista = prev.datos_json?.elemento_2_solicitudes?.lista_pendientes || [];
        const nuevaLista = oldLista.filter((s) => s.id !== solicitudId);
        const total = nuevaLista.length;
        const criticas = nuevaLista.filter((s) => s.antiguedad_mayor_3_dias || s.dias_pendiente > 3).length;
        return {
          ...prev,
          datos_json: {
            ...prev.datos_json,
            solicitudes_pendientes: total,
            solicitudes_pendientes_criticas_gt_3d: criticas,
            elemento_1_kpis: {
              ...prev.datos_json.elemento_1_kpis,
              solicitudes_pendientes_aprobacion: total,
            },
            elemento_2_solicitudes: {
              ...prev.datos_json.elemento_2_solicitudes,
              total_pendientes: total,
              pendientes_mas_3_dias: criticas,
              antiguedad_critica_mayor_3_dias: criticas,
              lista_pendientes: nuevaLista,
            },
          },
        };
      });

      await updateRequestStatusRequest(solicitudId, 'rechazada', comentario || 'Rechazada institucionalmente por RRHH.');
      showNotification('success', `Solicitud #${solicitudId} rechazada y asentada en el expediente.`);
      await loadReport(fechaSeleccionada);
    } catch (err) {
      console.error('[HrDashboard Error] Error rechazando solicitud:', err);
      showNotification('error', `Error al rechazar la solicitud #${solicitudId}: ${err.message}`);
      await loadReport(fechaSeleccionada);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Resolver ticket de escalamiento
  const handleResolveTicket = async (ticketId, respuesta_rrhh) => {
    try {
      setResolvingTicketId(ticketId);
      await resolveTicketRequest(ticketId, respuesta_rrhh);
      showNotification('success', `Ticket #${ticketId} resuelto y notificado al colaborador.`);
      await loadTickets();
      await loadReport(fechaSeleccionada);
    } catch (err) {
      console.error('[HrDashboard Error] Error resolviendo ticket:', err);
      showNotification('error', `Error al resolver el ticket #${ticketId}.`);
    } finally {
      setResolvingTicketId(null);
    }
  };

  // Extracción segura de datos para evitar errores de undefined
  const datos = reporteActual?.datos_json || {};
  const ausenciasObj = datos.elemento_1_ausencias || {};
  const solicitudesObj = datos.elemento_2_solicitudes || {};
  const incapacidadesObj = datos.elemento_3_incapacidades || {};
  const pasivoObj = datos.elemento_5_pasivo_vacaciones || {};

  const solicitudesPendientesList = solicitudesObj.lista_pendientes || [];
  const colaboradoresRiesgoList = pasivoObj.colaboradores_en_riesgo || [];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
      <Navbar />

      {/* ENCABEZADO DE SECCIÓN EDITORIAL (DISEÑO IMAGEN 2) */}
      <div style={{
        backgroundColor: 'var(--header-bg, var(--bg-card))',
        borderBottom: '2px solid var(--meadow-green)',
        boxShadow: '0 2px 6px rgba(12, 96, 56, 0.08)',
        padding: '0.85rem 1.25rem',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <div className="subtitle-script" style={{ fontSize: '1.05rem', color: 'var(--mustard-green)' }}>
              Panel Analítico Ejecutivo
            </div>
            <div className="font-editorial" style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--heading-color, var(--meadow-green))' }}>
              Gestión Estratégica del Talento Humano
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="editorial-badge">
              Directora de RRHH: Laura Solís
            </span>
            <span className="editorial-badge" style={{ borderColor: 'var(--mustard-green)', color: 'var(--mustard-green)' }}>
              RHsociety • 250 Colaboradores
            </span>
          </div>
        </div>
      </div>

      <main style={{
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}>
        {/* BANNER DE NOTIFICACIONES */}
        {notification && (
          <div
            className="animate-fade-in frame-editorial"
            style={{
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              backgroundColor: notification.tipo === 'success' ? 'var(--peach-light)' : 'var(--crimson-light)',
              color: notification.tipo === 'success' ? 'var(--meadow-green)' : 'var(--crimson)',
              border: `1.5px solid ${notification.tipo === 'success' ? 'var(--meadow-green)' : 'var(--crimson)'}`,
            }}
          >
            {notification.tipo === 'success' ? (
              <CheckCircle2 size={18} color="var(--meadow-green)" />
            ) : (
              <AlertCircle size={18} color="var(--crimson)" />
            )}
            <span>{notification.mensaje}</span>
          </div>
        )}

        {loading && !reporteActual ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
            <div style={{ width: 36, height: 36, border: '3px solid var(--border-color)', borderTopColor: 'var(--meadow-green)', borderRadius: '50%', margin: '0 auto 1rem auto' }} className="animate-spin" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--meadow-green)', fontFamily: 'Cormorant Garamond, Georgia, serif' }}>Cargando analítica y métricas de RRHH...</h3>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Recuperando registros consolidados del sistema</p>
          </div>
        ) : (
          <>
            {/* 1. RESUMEN EJECUTIVO DIARIO DE PEOPLE ANALYTICS */}
            <ExecutiveSummaryBox
              resumenTexto={reporteActual?.resumen_texto || ''}
              fechaReporte={reporteActual?.fecha || fechaSeleccionada || '2026-11-19'}
              generadoPor={reporteActual?.generado_por || 'AgenteAnalista_v1'}
              historialFechas={historialFechas}
              onSelectFecha={handleSelectFecha}
              onRegenerateReport={handleRegenerateReport}
              onSyncDrive={handleSyncDrive}
              loading={regenerating}
              syncingDrive={syncingDrive}
            />

            {/* 2. FILA DE 5 INDICADORES CLAVE (KPIS) EN PALETA ESTRICTA */}
            <section style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
            }}>
              {/* KPI 1: AUSENTES HOY */}
              <KpiCard
                title="Ausentes Hoy"
                value={datos.ausentes_hoy !== undefined ? datos.ausentes_hoy : '--'}
                subtitle={`${incapacidadesObj.activas_hoy || datos.incapacidades_activas || 0} por incapacidad médica`}
                icon={Users}
                variant="primary"
                badgeText={datos.colaboradores_activos ? `${datos.colaboradores_activos} activos` : null}
              />

              {/* KPI 2: SOLICITUDES PENDIENTES */}
              <KpiCard
                title="Solicitudes Pendientes"
                value={datos.solicitudes_pendientes !== undefined ? datos.solicitudes_pendientes : '--'}
                subtitle={
                  datos.solicitudes_pendientes_criticas_gt_3d > 0
                    ? `${datos.solicitudes_pendientes_criticas_gt_3d} llevan más de 3 días`
                    : 'Todas al día'
                }
                icon={Clock}
                variant={datos.solicitudes_pendientes_criticas_gt_3d > 0 ? 'danger' : 'info'}
                alert={datos.solicitudes_pendientes_criticas_gt_3d > 0}
                badgeText={datos.solicitudes_pendientes_criticas_gt_3d > 0 ? 'Críticas' : 'Normal'}
              />

              {/* KPI 3: INCAPACIDADES ACTIVAS */}
              <KpiCard
                title="Incapacidades Médicas"
                value={datos.incapacidades_activas !== undefined ? datos.incapacidades_activas : '--'}
                subtitle={`${incapacidadesObj.dias_acumulados_mes || 0} días acumulados en el mes`}
                icon={Activity}
                variant="info"
                badgeText="CCSS / INS"
              />

              {/* KPI 4: ROTACIÓN MENSUAL */}
              <KpiCard
                title="Tasa de Rotación Mes"
                value={datos.tasa_rotacion_mensual_pct !== undefined ? `${datos.tasa_rotacion_mensual_pct}%` : '0%'}
                subtitle={`${datos.colaboradores_inactivos || 0} salidas acumuladas en el periodo`}
                icon={TrendingDown}
                variant="success"
                badgeText="Controlado"
              />

              {/* KPI 5: USO DEL CHATBOT */}
              <KpiCard
                title="Resolución Chatbot"
                value={datos.tasa_resolucion_chat_pct !== undefined ? `${datos.tasa_resolucion_chat_pct}%` : '92.5%'}
                subtitle={`Latencia prom: ${datos.latencia_promedio_ms || 48} ms`}
                icon={Bot}
                variant="primary"
                badgeText={`${datos.consultas_chat_dia || 0} consultas`}
              />
            </section>

            {/* 3. SECCIÓN DE 2 GRÁFICOS INTERACTIVOS (RECHARTS) */}
            <section style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
              gap: '1.25rem',
              minWidth: 0,
              width: '100%',
              boxSizing: 'border-box',
            }}>
              {/* Gráfico 1: Tendencia Histórica de 30 Días */}
              <TrendChart30Days data={datos.tendencia_30_dias || []} />

              {/* Gráfico 2: Top 5 Temas Consultados y Ausencias por Departamento */}
              <DepartmentAndTopicsCharts
                topTemas={datos.top_temas_consultados || []}
                porDepartamento={ausenciasObj.por_departamento || {}}
              />
            </section>

            {/* 4. TABLA INTERACTIVA DE SOLICITUDES PENDIENTES */}
            <section>
              <PendingRequestsTable
                solicitudes={solicitudesPendientesList}
                onApprove={handleApproveRequest}
                onReject={handleRejectRequest}
                loadingId={actionLoadingId}
              />
            </section>

            {/* 5. PANEL DE CONTROL DE PASIVO LABORAL Y TICKETS ESCALADOS */}
            <section>
              <TicketsAndRisksPanel
                colaboradoresRiesgo={colaboradoresRiesgoList}
                ticketsEscalados={ticketsList}
                onResolveTicket={handleResolveTicket}
                resolvingId={resolvingTicketId}
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
