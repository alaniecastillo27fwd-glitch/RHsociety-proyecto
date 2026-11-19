import { runFullSync, runIncrementalSync } from '../agents/ingestAgent.js';
import { getSyncState, loadIndex } from '../services/vectorStore.js';

/**
 * Dispara manualmente la sincronización con Google Drive.
 * POST /api/ingest/sync
 * Protegido para rol 'rrhh'.
 */
export async function triggerSync(req, res) {
  try {
    const isFull = req.query.mode === 'full';
    console.log(`[IngestController] Sincronización manual solicitada por ${req.user.correo} (Modo: ${isFull ? 'Completa' : 'Incremental'}).`);

    if (isFull) {
      await runFullSync();
    } else {
      await runIncrementalSync();
    }

    const state = getSyncState();
    const index = loadIndex();

    return res.status(200).json({
      message: `Sincronización ${isFull ? 'completa' : 'incremental'} de políticas ejecutada exitosamente.`,
      syncState: state,
      totalChunksEnIndice: index.documents ? index.documents.length : 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[IngestController Error] Error ejecutando sincronización:', error);
    return res.status(500).json({
      error: 'Error al ejecutar la sincronización con Google Drive.',
      detalles: error.message,
    });
  }
}

/**
 * Consulta el estado actual de la sincronización de vectores.
 * GET /api/ingest/status
 */
export async function getSyncStatus(req, res) {
  try {
    const state = getSyncState();
    const index = loadIndex();

    return res.status(200).json({
      syncState: state,
      totalChunks: index.documents ? index.documents.length : 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export default {
  triggerSync,
  getSyncStatus,
};
