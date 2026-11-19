import cron from 'node-cron';
import { runIncrementalSync } from '../agents/ingestAgent.js';
import { generateDailyReport, getCostaRicaDateString } from '../agents/analystAgent.js';

let cronTask = null;

/**
 * Ejecuta la rutina consolidada diaria de las 7:00 a. m.:
 * 1. Sincronización incremental de políticas desde Google Drive (detecta altas, cambios y bajas).
 * 2. Cálculo analítico de métricas en MySQL y redacción del reporte diario de People Analytics.
 */
export async function executeDailyRoutine() {
  const horaInicio = new Date().toISOString();
  const fechaCR = getCostaRicaDateString();
  console.log('\n===============================================================');
  console.log(`⏰ [CronJob 07:00 AM] INICIANDO RUTINA DIARIA DE RRHH (${fechaCR})`);
  console.log(`   Hora inicio: ${horaInicio} (America/Costa_Rica)`);
  console.log('===============================================================\n');

  try {
    // 1. Sincronización incremental con Google Drive
    console.log('[CronJob Paso 1/2] Sincronizando documentos con Google Drive...');
    await runIncrementalSync();

    // 2. Generación y almacenamiento del reporte diario en MySQL
    console.log('\n[CronJob Paso 2/2] Generando reporte diario de People Analytics...');
    const reporte = await generateDailyReport(fechaCR);

    console.log('\n===============================================================');
    console.log(`✅ [CronJob Completado] Rutina de las 7:00 a. m. finalizada con éxito.`);
    console.log(`   • Fecha del reporte: ${reporte.fecha}`);
    console.log(`   • ID en base de datos: ${reporte.id || 'Guardado'}`);
    console.log('===============================================================\n');
    return reporte;
  } catch (error) {
    console.error('❌ [CronJob Error] Falló la ejecución de la rutina diaria:', error);
    throw error;
  }
}

/**
 * Inicializa el programador de tareas automáticas en horario de Costa Rica (America/Costa_Rica).
 * Se dispara todos los días exactamente a las 07:00 a. m. ('0 7 * * *').
 */
export function startDailyCronJobs() {
  // Expresión cron: Minuto 0, Hora 7, Cualquier día del mes, Cualquier mes, Cualquier día de la semana
  const CRON_EXPRESSION = '0 7 * * *';
  const CRON_OPTIONS = {
    scheduled: true,
    timezone: 'America/Costa_Rica',
  };

  console.log(`[CronScheduler] Configurando tarea automática: '${CRON_EXPRESSION}' en zona '${CRON_OPTIONS.timezone}'...`);

  cronTask = cron.schedule(CRON_EXPRESSION, async () => {
    console.log('\n[CronScheduler] 🔔 Alarma disparada: 07:00 a. m. (America/Costa_Rica). Ejecutando rutina diaria...');
    await executeDailyRoutine();
  }, CRON_OPTIONS);

  console.log('✅ [CronScheduler] Programador diario de reportes iniciado exitosamente (07:00 a. m. America/Costa_Rica).');
  return cronTask;
}

/**
 * Detiene la tarea cron programada (útil para pruebas unitarias o apagado ordenado).
 */
export function stopDailyCronJobs() {
  if (cronTask) {
    cronTask.stop();
    console.log('[CronScheduler] Programador diario detenido.');
  }
}

export default {
  startDailyCronJobs,
  stopDailyCronJobs,
  executeDailyRoutine,
};
