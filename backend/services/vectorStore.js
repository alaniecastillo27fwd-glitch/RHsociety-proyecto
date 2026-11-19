import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getGeminiClient, hasGeminiKey } from '../config/googleDrive.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VECTOR_STORE_DIR = path.resolve(__dirname, '..', 'vector_store');
const INDEX_FILE = path.join(VECTOR_STORE_DIR, 'index.json');
const SYNC_STATE_FILE = path.join(VECTOR_STORE_DIR, 'sync_state.json');

// Asegurar existencia del directorio de almacenamiento vectorial
if (!fs.existsSync(VECTOR_STORE_DIR)) {
  fs.mkdirSync(VECTOR_STORE_DIR, { recursive: true });
}

/**
 * Calcula la similitud coseno entre dos vectores numéricos.
 * Retorna un valor entre -1 y 1 (o 0 a 1 para vectores no negativos).
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, (similarity + 1) / 2)); // Normalizado 0 a 1
}

/**
 * Genera un vector determinista de respaldo cuando la API Key de Gemini aún no está configurada.
 */
const SPANISH_STOP_WORDS = new Set([
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para',
  'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'este',
  'sí', 'porque', 'esta', 'son', 'entre', 'está', 'cuando', 'muy', 'sin', 'sobre', 'ser',
  'tiene', 'también', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos', 'durante',
  'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto',
  'mí', 'antes', 'algunos', 'qué', 'unos', 'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa',
  'estos', 'mucho', 'quienes', 'nada', 'muchos', 'cual', 'sea', 'poco', 'ella', 'estar', 'haber',
  'estas', 'estaba', 'estamos', 'algunas', 'algo', 'nosotros', 'mi', 'mis', 'tu', 'tus', 'te',
  'ti', 'cuál', 'cuáles', 'cómo', 'cuánto', 'cuántos', 'cuánta', 'cuántas'
]);

/**
 * Genera un vector determinista de respaldo cuando la API Key de Gemini aún no está configurada.
 * Utiliza TF ponderado filtrando palabras vacías para máxima precisión semántica.
 */
function generateDeterministicFallbackVector(text, dimension = 768) {
  const vector = new Array(dimension).fill(0);
  const words = text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !SPANISH_STOP_WORDS.has(w));

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash << 5) - hash + word.charCodeAt(c);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimension;
    // Ponderar términos relevantes
    vector[idx] += 1;
  }
  // Normalizar norma L2
  let norm = 0;
  for (let v of vector) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  return vector.map(v => v / norm);
}

/**
 * Obtiene el embedding de un texto usando Gemini text-embedding-004
 * o recurre a vectorización determinista si no hay API key configurada.
 */
export async function getEmbedding(text) {
  const ai = getGeminiClient();

  if (ai && typeof ai.models?.embedContent === 'function' && hasGeminiKey()) {
    try {
      const response = await ai.models.embedContent({
        model: 'text-embedding-004',
        contents: text,
      });

      if (response && response.embedding && response.embedding.values) {
        return response.embedding.values;
      }
    } catch (error) {
      console.warn(`[VectorStore Warning] Error generando embedding con Gemini: ${error.message}. Usando vector local.`);
    }
  }

  // Fallback determinista seguro
  return generateDeterministicFallbackVector(text);
}

/**
 * Divide un texto en fragmentos (chunks) semánticos respetando encabezados ##,
 * con tamaño objetivo de 600-900 tokens (~2400-3600 caracteres) y ~150 tokens de solapamiento.
 */
export function chunkTextBySections(fullText, documentMetadata = {}) {
  const chunks = [];
  const lines = fullText.split(/\r?\n/);
  
  let currentSection = 'Introducción / General';
  let currentChunkLines = [];
  let currentLength = 0;

  const targetChunkChars = 2800; // ~700 tokens
  const overlapChars = 400;      // ~100-150 tokens

  function flushChunk(sectionTitle) {
    if (currentChunkLines.length === 0) return;
    const content = currentChunkLines.join('\n').trim();
    if (content.length > 50) {
      chunks.push({
        section: sectionTitle,
        content: content,
        charCount: content.length,
      });
    }

    // Mantener solapamiento de líneas finales
    let keptLines = [];
    let keptChars = 0;
    for (let i = currentChunkLines.length - 1; i >= 0; i--) {
      keptLines.unshift(currentChunkLines[i]);
      keptChars += currentChunkLines[i].length;
      if (keptChars >= overlapChars) break;
    }
    currentChunkLines = keptLines;
    currentLength = keptChars;
  }

  for (let line of lines) {
    const trimmed = line.trim();
    // Detectar encabezado ## o ###
    if (trimmed.startsWith('## ') || trimmed.startsWith('# ') || trimmed.startsWith('### HOJA:')) {
      if (currentLength > 600) {
        flushChunk(currentSection);
      }
      currentSection = trimmed.replace(/^#+\s*/, '').trim();
    }

    currentChunkLines.push(line);
    currentLength += line.length + 1;

    if (currentLength >= targetChunkChars) {
      flushChunk(currentSection);
    }
  }

  // Vaciar remanente
  if (currentChunkLines.length > 0) {
    flushChunk(currentSection);
  }

  return chunks;
}

/**
 * Carga el índice vectorial desde el disco.
 */
export function loadIndex() {
  if (!fs.existsSync(INDEX_FILE)) {
    return { documents: [], updatedAt: new Date().toISOString() };
  }
  try {
    const data = fs.readFileSync(INDEX_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('[VectorStore Error] Error leyendo index.json:', e.message);
    return { documents: [], updatedAt: new Date().toISOString() };
  }
}

/**
 * Guarda el índice vectorial en el disco.
 */
export function saveIndex(indexData) {
  indexData.updatedAt = new Date().toISOString();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(indexData, null, 2), 'utf8');
}

/**
 * Inserta o actualiza los fragmentos correspondientes a un archivo.
 */
export async function upsertDocumentChunks(fileId, fileMetadata, chunks) {
  const index = loadIndex();
  // Eliminar versiones previas del mismo fileId si existieran
  index.documents = index.documents.filter(doc => doc.fileId !== fileId);

  console.log(`[VectorStore] Vectorizando ${chunks.length} fragmentos de '${fileMetadata.title}'...`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await getEmbedding(chunk.content);

    index.documents.push({
      id: `${fileId}_chunk_${i}`,
      fileId: fileId,
      documentTitle: fileMetadata.title,
      section: chunk.section || fileMetadata.section || 'General',
      version: fileMetadata.version || 'v1.0',
      driveUrl: fileMetadata.driveUrl || `https://drive.google.com/file/d/${fileId}/view`,
      mimeType: fileMetadata.mimeType || 'text/markdown',
      updatedAt: fileMetadata.updatedAt || new Date().toISOString(),
      content: chunk.content,
      embedding: embedding,
    });
  }

  saveIndex(index);
  console.log(`[VectorStore] Total en índice: ${index.documents.length} chunks almacenados.`);
}

/**
 * Elimina todos los fragmentos asociados a un fileId (ej. archivo borrado en Drive).
 */
export function deleteDocumentChunks(fileId) {
  const index = loadIndex();
  const initialCount = index.documents.length;
  index.documents = index.documents.filter(doc => doc.fileId !== fileId);
  const deletedCount = initialCount - index.documents.length;
  saveIndex(index);
  console.log(`[VectorStore] Eliminados ${deletedCount} chunks asociados al fileId ${fileId}.`);
  return deletedCount;
}

/**
 * Realiza una búsqueda por similitud semántica con ordenamiento por similitud coseno.
 * @param {string} queryText Texto de la consulta del colaborador
 * @param {number} topK Cantidad máxima de fragmentos a recuperar (default: 5)
 * @param {object} filter Filtros opcionales por metadatos (ej. { version: 'v1.0' })
 * @returns {Promise<Array<{ score: number, content: string, metadata: object }>>}
 */
export async function similaritySearch(queryText, topK = 5, filter = null) {
  const queryEmbedding = await getEmbedding(queryText);
  const index = loadIndex();

  if (!index.documents || index.documents.length === 0) {
    return [];
  }

  let candidates = index.documents;
  if (filter && typeof filter === 'object') {
    candidates = candidates.filter(doc => {
      for (const key of Object.keys(filter)) {
        if (doc[key] !== filter[key]) return false;
      }
      return true;
    });
  }

  const queryNormalizedWords = queryText.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !SPANISH_STOP_WORDS.has(w));

  const scoredDocs = candidates.map(doc => {
    let score = cosineSimilarity(queryEmbedding, doc.embedding);

    // Refuerzo léxico híbrido (Hybrid Search: Vector + Términos Clave de Legislación Laboral)
    if (queryNormalizedWords.length > 0) {
      const docFullText = `${doc.documentTitle} ${doc.section} ${doc.content}`.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const titleSectionText = `${doc.documentTitle} ${doc.section}`.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      let matchScore = 0;
      for (const w of queryNormalizedWords) {
        if (docFullText.includes(w)) {
          matchScore += 1;
          if (titleSectionText.includes(w)) {
            matchScore += 1.5; // Mayor relevancia si está en título o encabezado de sección
          }
        }
      }
      const matchRatio = matchScore / (queryNormalizedWords.length * 2.5);
      score = (score * 0.65) + (Math.min(1, matchRatio) * 0.35);
    }

    return {
      score: parseFloat(score.toFixed(4)),
      content: doc.content,
      metadata: {
        id: doc.id,
        fileId: doc.fileId,
        documentTitle: doc.documentTitle,
        section: doc.section,
        version: doc.version,
        driveUrl: doc.driveUrl,
        mimeType: doc.mimeType,
        updatedAt: doc.updatedAt,
      },
    };
  });

  // Ordenar de mayor a menor similitud y tomar los primeros topK
  scoredDocs.sort((a, b) => b.score - a.score);
  return scoredDocs.slice(0, topK);
}

/**
 * Obtiene el estado de sincronización (startPageToken de Google Drive).
 */
export function getSyncState() {
  if (!fs.existsSync(SYNC_STATE_FILE)) {
    return { lastPageToken: null, lastSync: null };
  }
  try {
    return JSON.parse(fs.readFileSync(SYNC_STATE_FILE, 'utf8'));
  } catch {
    return { lastPageToken: null, lastSync: null };
  }
}

/**
 * Guarda el estado de sincronización.
 */
export function saveSyncState(state) {
  fs.writeFileSync(SYNC_STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

export default {
  cosineSimilarity,
  getEmbedding,
  chunkTextBySections,
  upsertDocumentChunks,
  deleteDocumentChunks,
  similaritySearch,
  getSyncState,
  saveSyncState,
  loadIndex,
  saveIndex,
};
