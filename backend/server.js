import 'dotenv/config';
import app from './app.js';
import { initDatabase, syncModels } from './models/index.js';
import { loadIndex } from './services/vectorStore.js';
import { runLocalIngest } from './agents/ingestAgent.js';
import { startDailyCronJobs } from './jobs/dailyReportJob.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function startServer() {
  try {
    console.log('\n==================================================');
    console.log('   INICIANDO SERVIDOR BACKEND RHSOCIETY (PORT 3001)');
    console.log('==================================================\n');

    // 1. Inicializar y verificar conexión a MySQL (miniproyecto2)
    console.log('[Server Boot] Verificando base de datos MySQL...');
    await initDatabase();
    await syncModels({ alter: true });

    // 2. Verificar estado de la base vectorial
    const index = loadIndex();
    if (!index.documents || index.documents.length === 0) {
      console.log('[Server Boot] Almacén vectorial vacío. Ejecutando indexación inicial...');
      await runLocalIngest();
    } else {
      console.log(`[Server Boot] Almacén vectorial activo con ${index.documents.length} fragmentos indexados.`);
    }

    // 3. Iniciar programador automático de reportes diarios (07:00 a. m. Costa Rica)
    startDailyCronJobs();

    // 4. Levantar servidor HTTP Express
    app.listen(PORT, () => {
      console.log('\n==================================================');
      console.log(`🚀 Servidor RHsociety corriendo exitosamente en:`);
      console.log(`   • URL Local:   http://localhost:${PORT}`);
      console.log(`   • Health Check: http://localhost:${PORT}/api/health`);
      console.log(`   • Auth API:    http://localhost:${PORT}/api/auth/login`);
      console.log(`   • Chat API:    http://localhost:${PORT}/api/chat/ask`);
      console.log('==================================================\n');
    });
  } catch (error) {
    console.error('❌ [Server Fatal Error] No se pudo iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
