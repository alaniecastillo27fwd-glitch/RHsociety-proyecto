import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Asegurar carga de backend/.env sin importar el directorio de ejecución (CWD)
const backendEnvPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else {
  dotenv.config();
}

// Ruta al archivo de credenciales de la cuenta de servicio de Google Cloud
const defaultKeyPath = path.resolve(__dirname, 'google-credentials.json');
const envKeyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : defaultKeyPath;

const credentialsPath = fs.existsSync(envKeyPath) ? envKeyPath : defaultKeyPath;

let driveClient = null;
let geminiClient = null;

/**
 * Valida si las credenciales de Google Cloud existen y son legibles.
 */
export function hasGoogleCredentials() {
  return fs.existsSync(credentialsPath);
}

/**
 * Valida si la API Key de DeepSeek está configurada.
 */
export function getDeepSeekKey() {
  const dKey = process.env.DEEPSEEK_API_KEY;
  if (dKey && dKey !== 'tu_api_key_aqui' && dKey.trim().startsWith('sk-')) {
    return dKey.trim();
  }
  const gKey = process.env.GEMINI_API_KEY;
  if (gKey && gKey.trim().startsWith('sk-')) {
    return gKey.trim();
  }
  return null;
}

export function hasDeepSeekKey() {
  return Boolean(getDeepSeekKey());
}

/**
 * Valida si la API Key de Gemini o DeepSeek está configurada y no es el placeholder inicial.
 */
export function hasGeminiKey() {
  if (hasDeepSeekKey()) return true;
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key !== 'tu_api_key_aqui' && key.trim().length > 10);
}

export const hasLLMKey = hasGeminiKey;

/**
 * Adaptador de DeepSeek compatible con la interfaz generateContent.
 */
class DeepSeekClientAdapter {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.models = {
      generateContent: async ({ model, contents, config }) => {
        const systemPrompt = config?.systemInstruction || 'Eres un asistente experto de RRHH para RHsociety.';
        const userPrompt = typeof contents === 'string' ? contents : JSON.stringify(contents);
        const isJson = config?.responseMimeType === 'application/json';

        const requestBody = {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: config?.temperature ?? 0.1,
        };

        if (isJson) {
          requestBody.response_format = { type: 'json_object' };
        }

        const res = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`[DeepSeek API Error ${res.status}]: ${errText}`);
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';
        return { text: content };
      },
    };
  }
}

/**
 * Obtiene la instancia autenticada de Google Drive v3 con permisos de solo lectura.
 */
export function getDriveClient() {
  if (driveClient) return driveClient;

  if (!hasGoogleCredentials()) {
    console.warn(`[GoogleDrive Warning] No se encontró el archivo de credenciales en ${credentialsPath}`);
    return null;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    driveClient = google.drive({ version: 'v3', auth });
    return driveClient;
  } catch (error) {
    console.error('[GoogleDrive Error] Error inicializando cliente de Drive:', error.message);
    return null;
  }
}

/**
 * Obtiene la instancia del cliente LLM (DeepSeek si está configurado, o Gemini como fallback).
 */
export function getGeminiClient() {
  if (geminiClient) return geminiClient;

  // 1. Priorizar DeepSeek si la clave está configurada
  const deepSeekKey = getDeepSeekKey();
  if (deepSeekKey) {
    try {
      console.log('🤖 [LLM Init] Inicializando cliente de DeepSeek (deepseek-chat)...');
      geminiClient = new DeepSeekClientAdapter(deepSeekKey);
      return geminiClient;
    } catch (error) {
      console.error('[DeepSeek Error] Error inicializando cliente DeepSeek:', error.message);
    }
  }

  // 2. Fallback a Google Gemini si la clave no es DeepSeek
  if (!hasGeminiKey()) {
    return null;
  }

  try {
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (geminiKey && !geminiKey.startsWith('sk-')) {
      console.log('🤖 [LLM Init] Inicializando cliente de Google Gemini...');
      geminiClient = new GoogleGenAI({
        apiKey: geminiKey,
      });
      return geminiClient;
    }
    return null;
  } catch (error) {
    console.error('[Gemini Error] Error inicializando cliente Gemini:', error.message);
    return null;
  }
}

export const getLLMClient = getGeminiClient;

export const drive = getDriveClient();
export const ai = getGeminiClient();

export default {
  getDriveClient,
  getGeminiClient,
  getLLMClient,
  hasGoogleCredentials,
  hasGeminiKey,
  hasLLMKey,
  hasDeepSeekKey,
  getDeepSeekKey,
  credentialsPath,
};
