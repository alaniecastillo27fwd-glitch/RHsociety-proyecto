import { getGeminiClient, hasGeminiKey } from '../config/googleDrive.js';
import { similaritySearch } from '../services/vectorStore.js';
import { POLICY_AGENT_SYSTEM_PROMPT, POLICY_AGENT_PROMPT_VERSION } from '../prompts/policyAgentPrompt.js';

export const SIMILARITY_THRESHOLD = 0.52;

/**
 * Agente de Políticas (RAG) de RHsociety.
 * Responde preguntas normativas basándose EXCLUSIVAMENTE en fragmentos documentales
 * recuperados del VectorStore de Google Drive.
 *
 * @param {string} query Pregunta del colaborador
 * @param {object} options Opciones adicionales (ej. topK, filter)
 * @returns {Promise<{
 *   encontrado: boolean,
 *   respuesta: string,
 *   citas: Array<{ documento: string, seccion: string, version: string, enlace: string }>,
 *   chunksUsados: Array<object>,
 *   promptVersion: string
 * }>}
 */
export async function runPolicyAgent(query, options = {}) {
  const topK = options.topK || 5;
  const threshold = options.threshold || SIMILARITY_THRESHOLD;

  console.log(`[PolicyAgent] Procesando consulta: "${query}" (Umbral: ${threshold})`);

  // 1. Recuperar los fragmentos más relevantes desde el VectorStore
  const retrievedChunks = await similaritySearch(query, topK, options.filter);

  // 2. Evaluar el umbral de confianza RAG
  if (!retrievedChunks || retrievedChunks.length === 0 || retrievedChunks[0].score < threshold) {
    const topScore = retrievedChunks && retrievedChunks.length > 0 ? retrievedChunks[0].score : 0;
    console.log(`[PolicyAgent] No se superó el umbral de similitud (Top Score: ${topScore} < ${threshold}). Retornando encontrado: false.`);
    
    return {
      encontrado: false,
      respuesta: 'No encontré una política documentada en la base oficial de RHsociety sobre ese tema. ¿Deseas que escale tu consulta a un especialista de Recursos Humanos?',
      citas: [],
      chunksUsados: [],
      promptVersion: POLICY_AGENT_PROMPT_VERSION,
      confidenceScore: topScore,
    };
  }

  // Filtrar fragmentos que superen el umbral para el contexto del LLM
  const qualifiedChunks = retrievedChunks.filter(c => c.score >= threshold);
  console.log(`[PolicyAgent] Fragmentos calificados: ${qualifiedChunks.length} (Mejor score: ${qualifiedChunks[0].score})`);

  // 3. Construir el contexto documental numerado para el LLM
  let contextBlock = '=== CONTEXTO DOCUMENTAL DE POLÍTICAS RHSOCIETY ===\n\n';
  qualifiedChunks.forEach((chunk, index) => {
    const meta = chunk.metadata;
    contextBlock += `[Fuente ${index + 1}: ${meta.documentTitle} | Sección: ${meta.section} | Versión: ${meta.version} | URL: ${meta.driveUrl}]\n`;
    contextBlock += `${chunk.content}\n\n----------------------------------------\n\n`;
  });

  const userPrompt = `${contextBlock}\nPREGUNTA DEL COLABORADOR: "${query}"\n\nResponde estrictamente en formato JSON según tus instrucciones.`;

  // 4. Invocar el modelo Gemini si la clave está activa
  const ai = getGeminiClient();

  if (ai && hasGeminiKey()) {
    try {
      console.log(`[PolicyAgent] Invocando gemini-2.5-flash (temperatura: 0.1)...`);
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: POLICY_AGENT_SYSTEM_PROMPT,
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text ? response.text.trim() : '';
      const parsed = JSON.parse(responseText);

      // Si el LLM determinó que el fragmento no responde al tema, asegurar encontrado: false
      if (!parsed.encontrado) {
        return {
          encontrado: false,
          respuesta: parsed.respuesta || 'Esa política no consta en los documentos oficiales de RHsociety. ¿Deseas que escale tu consulta a Recursos Humanos?',
          citas: [],
          chunksUsados: qualifiedChunks,
          promptVersion: POLICY_AGENT_PROMPT_VERSION,
          confidenceScore: qualifiedChunks[0].score,
        };
      }

      // Asegurar formato estructurado de citas
      const validCitas = (parsed.citas || []).map(c => ({
        documento: c.documento || qualifiedChunks[0].metadata.documentTitle,
        seccion: c.seccion || qualifiedChunks[0].metadata.section,
        version: c.version || qualifiedChunks[0].metadata.version || 'v1.0',
        enlace: c.enlace || qualifiedChunks[0].metadata.driveUrl,
      }));

      return {
        encontrado: true,
        respuesta: parsed.respuesta,
        citas: validCitas.length > 0 ? validCitas : [
          {
            documento: qualifiedChunks[0].metadata.documentTitle,
            seccion: qualifiedChunks[0].metadata.section,
            version: qualifiedChunks[0].metadata.version,
            enlace: qualifiedChunks[0].metadata.driveUrl,
          }
        ],
        chunksUsados: qualifiedChunks,
        promptVersion: POLICY_AGENT_PROMPT_VERSION,
        confidenceScore: qualifiedChunks[0].score,
      };
    } catch (llmError) {
      console.warn(`[PolicyAgent Warning] Error invocando Gemini: ${llmError.message}. Recurriendo a síntesis determinista del fragmento calificado.`);
    }
  }

  // 5. Fallback determinista de alta fidelidad basado en el fragmento calificado principal
  const queryLower = query.toLowerCase();

  // Detección de consultas que no tienen política existente en RHsociety (ej. mascotas, créditos vehiculares, etc.)
  const outOfScopeKeywords = ['mascota', 'perro', 'gato', 'moto', 'carro', 'vehículo', 'vehiculo', 'auto', 'gasolina', 'combustible', 'guarderia', 'guardería', 'cuido'];
  if (outOfScopeKeywords.some(kw => queryLower.includes(kw))) {
    return {
      encontrado: false,
      respuesta: 'No consta en los documentos oficiales de RHsociety ninguna política referente a ese tema o beneficio. ¿Deseas que escale tu consulta con un especialista de Recursos Humanos?',
      citas: [],
      chunksUsados: qualifiedChunks,
      promptVersion: POLICY_AGENT_PROMPT_VERSION,
      confidenceScore: qualifiedChunks[0].score,
    };
  }

  // Seleccionar el fragmento más relevante buscando coincidencia temática en título, sección o contenido
  const queryKeywords = queryLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter(w => w.length >= 4);
  const bestMatch = qualifiedChunks.find(c => {
    const metaText = `${c.metadata.documentTitle} ${c.metadata.section}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return queryKeywords.some(kw => metaText.includes(kw));
  }) || qualifiedChunks.find(c => {
    const contentText = c.content.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return queryKeywords.filter(kw => contentText.includes(kw)).length >= 2;
  }) || qualifiedChunks[0];

  // Formular respuesta a partir del contenido del fragmento con citas
  return {
    encontrado: true,
    respuesta: `De conformidad con la política oficial de RHsociety (${bestMatch.metadata.documentTitle}, ${bestMatch.metadata.section}):\n\n${bestMatch.content}`,
    citas: [
      {
        documento: bestMatch.metadata.documentTitle,
        seccion: bestMatch.metadata.section,
        version: bestMatch.metadata.version,
        enlace: bestMatch.metadata.driveUrl,
      }
    ],
    chunksUsados: qualifiedChunks,
    promptVersion: POLICY_AGENT_PROMPT_VERSION,
    confidenceScore: bestMatch.score,
  };
}

export default {
  runPolicyAgent,
  SIMILARITY_THRESHOLD,
};
