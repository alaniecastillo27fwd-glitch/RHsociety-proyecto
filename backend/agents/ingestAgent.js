import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getDriveClient, hasGoogleCredentials } from '../config/googleDrive.js';
import { extractFromDriveFile, extractFromLocalFile } from '../services/documentExtractor.js';
import {
  chunkTextBySections,
  upsertDocumentChunks,
  deleteDocumentChunks,
  getSyncState,
  saveSyncState,
  loadIndex,
} from '../services/vectorStore.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const localDriveDir = path.join(projectRoot, 'docs_politicas_drive');

/**
 * Agente de Ingesta y Sincronización de Google Drive.
 * Permite sincronización completa, sincronización incremental con changes.list,
 * y modo local para desarrollo sin dependencia inmediata de conexión a Drive.
 */

/**
 * Valida si las variables de entorno para Google Drive están listas.
 */
export function validateDriveConfig() {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const isPlaceholder = !folderId || folderId === 'tu_folder_id_aqui' || folderId.trim() === '';
  const hasCreds = hasGoogleCredentials();

  return {
    valid: !isPlaceholder && hasCreds,
    folderId: folderId,
    isPlaceholder: isPlaceholder,
    hasCreds: hasCreds,
  };
}

/**
 * Ejecuta la sincronización completa (Full Sync) desde la carpeta de Google Drive.
 */
export async function runFullSync() {
  console.log('\n==================================================');
  console.log('  AGENTE DE INGESTA: SINCRONIZACIÓN COMPLETA DRIVE');
  console.log('==================================================\n');

  const config = validateDriveConfig();

  if (config.isPlaceholder || !config.valid) {
    console.warn('⚠️ [IngestAgent] GOOGLE_DRIVE_FOLDER_ID no configurado en backend/.env o credenciales no encontradas.');
    console.log(`ℹ️ Valor actual: '${config.folderId || 'VACÍO'}'.`);
    console.log('💡 Pasos para sincronizar con Google Drive:');
    console.log('   1. Sube los archivos de docs_politicas_drive/ a tu carpeta de Google Drive.');
    console.log('   2. Comparte la carpeta con: recursos-humanos-society@rhsociety.iam.gserviceaccount.com (como Lector).');
    console.log('   3. Coloca el ID de la carpeta en backend/.env (GOOGLE_DRIVE_FOLDER_ID=...).');
    console.log('   4. Coloca tu API key en backend/.env (GEMINI_API_KEY=...).');
    console.log('\n🔄 Ejecutando ingesta local de respaldo desde docs_politicas_drive/ para no detener el pipeline...\n');
    return await runLocalIngest();
  }

  const drive = getDriveClient();
  if (!drive) {
    console.error('❌ [IngestAgent Error] No se pudo inicializar el cliente de Google Drive.');
    return;
  }

  try {
    console.log(`[IngestAgent] Consultando archivos en carpeta de Drive '${config.folderId}'...`);
    const response = await drive.files.list({
      q: `'${config.folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink, modifiedTime, size)',
      pageSize: 50,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const files = response.data.files || [];
    console.log(`[IngestAgent] Se encontraron ${files.length} archivos en Google Drive.`);

    if (files.length === 0) {
      console.warn('⚠️ La carpeta de Google Drive está vacía. Verifica que los archivos hayan sido subidos.');
      return;
    }

    let processedCount = 0;
    for (const file of files) {
      console.log(`\n📄 Procesando archivo (${processedCount + 1}/${files.length}): '${file.name}' (${file.mimeType})`);
      
      const extracted = await extractFromDriveFile(drive, file);
      if (!extracted.text || extracted.text.length < 20) {
        console.warn(`[IngestAgent] Archivo '${file.name}' sin contenido extraíble. Omitiendo.`);
        continue;
      }

      const chunks = chunkTextBySections(extracted.text);
      await upsertDocumentChunks(
        file.id,
        {
          title: extracted.title,
          version: extracted.version,
          driveUrl: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
          mimeType: file.mimeType,
          updatedAt: file.modifiedTime,
        },
        chunks
      );
      processedCount++;
    }

    // Obtener y almacenar el startPageToken para futuras sincronizaciones incrementales
    const tokenRes = await drive.changes.getStartPageToken({ supportsAllDrives: true });
    saveSyncState({
      lastPageToken: tokenRes.data.startPageToken,
      lastSync: new Date().toISOString(),
      type: 'full_drive',
      folderId: config.folderId,
      filesProcessed: processedCount,
    });

    console.log(`\n✅ [IngestAgent] Sincronización completa finalizada. ${processedCount} archivos procesados.`);
    console.log(`🔖 Token de sincronización incremental guardado: ${tokenRes.data.startPageToken}`);
  } catch (error) {
    console.error('❌ [IngestAgent Error] Fallo durante la sincronización con Google Drive:', error.message);
  }
}

/**
 * Ejecuta la sincronización incremental usando changes.list para procesar solo novedades y borrados.
 */
export async function runIncrementalSync() {
  console.log('\n=======================================================');
  console.log('  AGENTE DE INGESTA: SINCRONIZACIÓN INCREMENTAL DRIVE');
  console.log('=======================================================\n');

  const config = validateDriveConfig();
  if (!config.valid) {
    console.warn('⚠️ Google Drive no configurado. Ejecutando sincronización local.');
    return await runLocalIngest();
  }

  const drive = getDriveClient();
  const syncState = getSyncState();

  if (!syncState.lastPageToken) {
    console.log('[IngestAgent] No existe startPageToken previo. Ejecutando Full Sync inicial...');
    return await runFullSync();
  }

  try {
    console.log(`[IngestAgent] Verificando cambios con pageToken: ${syncState.lastPageToken}...`);
    let pageToken = syncState.lastPageToken;
    let changesFound = 0;

    const response = await drive.changes.list({
      pageToken: pageToken,
      fields: 'newStartPageToken, nextPageToken, changes(fileId, removed, file(id, name, mimeType, trashed, parents, webViewLink, modifiedTime))',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const changes = response.data.changes || [];
    console.log(`[IngestAgent] Cambios detectados en Drive: ${changes.length}`);

    for (const change of changes) {
      const fileId = change.fileId;
      const file = change.file;

      if (change.removed || (file && file.trashed)) {
        console.log(`🗑️ [IngestAgent] Archivo eliminado en Drive: ${fileId}. Eliminando fragmentos...`);
        deleteDocumentChunks(fileId);
        changesFound++;
      } else if (file && file.parents && file.parents.includes(config.folderId)) {
        console.log(`📝 [IngestAgent] Archivo modificado o nuevo: '${file.name}' (${fileId})`);
        const extracted = await extractFromDriveFile(drive, file);
        if (extracted.text) {
          const chunks = chunkTextBySections(extracted.text);
          await upsertDocumentChunks(
            file.id,
            {
              title: extracted.title,
              version: extracted.version,
              driveUrl: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
              mimeType: file.mimeType,
              updatedAt: file.modifiedTime,
            },
            chunks
          );
          changesFound++;
        }
      }
    }

    const nextToken = response.data.newStartPageToken || response.data.nextPageToken || pageToken;
    saveSyncState({
      lastPageToken: nextToken,
      lastSync: new Date().toISOString(),
      type: 'incremental_drive',
      folderId: config.folderId,
      changesProcessed: changesFound,
    });

    console.log(`\n✅ [IngestAgent] Sincronización incremental finalizada (${changesFound} cambios aplicados).`);
  } catch (error) {
    console.error('❌ [IngestAgent Error] Error en sincronización incremental:', error.message);
  }
}

/**
 * Ingesta directa desde la carpeta local docs_politicas_drive/
 * Permite que el sistema RAG quede poblado de inmediato con los 13 documentos de prueba.
 */
export async function runLocalIngest() {
  console.log('\n====================================================');
  console.log('  AGENTE DE INGESTA: INDEXACIÓN LOCAL DIRECTA');
  console.log('====================================================\n');

  if (!fs.existsSync(localDriveDir)) {
    console.error(`❌ [IngestAgent Error] Directorio local '${localDriveDir}' no existe.`);
    return;
  }

  const files = fs.readdirSync(localDriveDir);
  console.log(`[IngestAgent] Leyendo ${files.length} archivos locales de: ${localDriveDir}`);

  let totalChunks = 0;
  let fileCount = 0;

  for (const file of files) {
    const fullPath = path.join(localDriveDir, file);
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) continue;

    console.log(`\n📄 Procesando localmente (${fileCount + 1}/${files.length}): '${file}'`);
    const extracted = await extractFromLocalFile(fullPath);

    if (!extracted.text || extracted.text.length < 20) {
      console.warn(`[IngestAgent] Sin contenido de texto en '${file}'. Omitiendo.`);
      continue;
    }

    const chunks = chunkTextBySections(extracted.text);
    const mockFileId = `local_${file.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    await upsertDocumentChunks(
      mockFileId,
      {
        title: extracted.title,
        version: extracted.version,
        driveUrl: `https://drive.google.com/open?id=${mockFileId}`,
        mimeType: file.endsWith('.pdf') ? 'application/pdf' : (file.endsWith('.xlsx') ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/markdown'),
        updatedAt: stat.mtime.toISOString(),
      },
      chunks
    );

    totalChunks += chunks.length;
    fileCount++;
  }

  saveSyncState({
    lastPageToken: 'local_mode_token',
    lastSync: new Date().toISOString(),
    type: 'local_folder',
    filesProcessed: fileCount,
    totalChunks: totalChunks,
  });

  const index = loadIndex();
  console.log('\n====================================================');
  console.log(`🎉 [IngestAgent] ¡Indexación local completada con éxito!`);
  console.log(`   • Archivos procesados: ${fileCount}`);
  console.log(`   • Chunks almacenados en VectorStore: ${index.documents.length}`);
  console.log('====================================================\n');
}

export default {
  runFullSync,
  runIncrementalSync,
  runLocalIngest,
  validateDriveConfig,
};
