import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { PDFParse } from 'pdf-parse';

/**
 * Servicio extractor multi-formato para Google Drive y archivos locales.
 * Soporta Google Docs, Google Sheets, Excel (.xlsx), PDF y Markdown/Texto.
 */

/**
 * Extrae texto de un buffer de PDF utilizando pdf-parse.
 * @param {Buffer|ArrayBuffer|Uint8Array} buffer
 * @returns {Promise<string>}
 */
export async function extractTextFromPdf(buffer) {
  try {
    const uint8 = (buffer instanceof Uint8Array && buffer.constructor.name === 'Uint8Array')
      ? buffer
      : new Uint8Array(buffer.buffer || buffer, buffer.byteOffset || 0, buffer.byteLength || buffer.length);
    const parser = new PDFParse(uint8);
    const result = await parser.getText();
    return (result && result.text) ? result.text.trim() : '';
  } catch (error) {
    console.error('[DocumentExtractor Error] Error parseando PDF:', error.message);
    return '';
  }
}

/**
 * Extrae texto estructurado de una hoja de cálculo Excel (buffer) recorriendo todas sus pestañas.
 * @param {Buffer|ArrayBuffer} buffer
 * @returns {Array<{ sheetName: string, text: string }>}
 */
export function extractTextFromExcel(buffer) {
  try {
    const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const wb = XLSX.read(uint8, { type: 'array' });
    const sheetsResult = [];

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (!rows || rows.length === 0) continue;

      const headers = rows[0].map(h => String(h).trim()).filter(Boolean);
      const dataRows = rows.slice(1);

      let sheetText = `### HOJA: ${sheetName}\n`;
      sheetText += `Columnas: ${headers.join(' | ')}\n\n`;

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (row.every(cell => !cell || String(cell).trim() === '')) continue;
        const rowDetails = headers.map((h, colIdx) => `${h}: ${row[colIdx] || 'N/A'}`).join(' | ');
        sheetText += `• Fila ${i + 1}: ${rowDetails}\n`;
      }

      sheetsResult.push({
        sheetName,
        text: sheetText.trim(),
      });
    }

    return sheetsResult;
  } catch (error) {
    console.error('[DocumentExtractor Error] Error parseando Excel:', error.message);
    return [];
  }
}

/**
 * Detecta y extrae la versión documental del texto (ej. "v1.0", "Versión: v1.0", etc.)
 * @param {string} text
 * @returns {string}
 */
export function extractDocumentVersion(text) {
  const versionMatch = text.match(/(?:versión|version)[\s:*_-]+(v?\d+\.\d+)/i);
  return versionMatch ? versionMatch[1].toLowerCase() : 'v1.0';
}

/**
 * Extrae el contenido de un archivo directamente desde Google Drive según su MIME Type.
 * @param {object} driveInstance Instancia de google.drive({ version: 'v3' })
 * @param {object} driveFile Objeto con id, name, mimeType, webViewLink
 * @returns {Promise<{ title: string, text: string, version: string, sections: Array<{ title: string, text: string }> }>}
 */
export async function extractFromDriveFile(driveInstance, driveFile) {
  const { id: fileId, name: fileName, mimeType } = driveFile;
  let fullText = '';
  let sections = [];

  try {
    if (mimeType === 'application/vnd.google-apps.document') {
      // 1. Google Docs -> Exportar a text/plain
      const response = await driveInstance.files.export({
        fileId: fileId,
        mimeType: 'text/plain',
      });
      fullText = typeof response.data === 'string' ? response.data : String(response.data);

    } else if (
      mimeType === 'application/vnd.google-apps.spreadsheet' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      fileName.endsWith('.xlsx')
    ) {
      // 2. Google Sheets o Excel -> Exportar / Descargar binario y parsear con XLSX
      let bufferData;
      if (mimeType === 'application/vnd.google-apps.spreadsheet') {
        const res = await driveInstance.files.export(
          {
            fileId: fileId,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
          { responseType: 'arraybuffer' }
        );
        bufferData = res.data;
      } else {
        const res = await driveInstance.files.get(
          { fileId: fileId, alt: 'media' },
          { responseType: 'arraybuffer' }
        );
        bufferData = res.data;
      }

      const excelSheets = extractTextFromExcel(Buffer.from(bufferData));
      fullText = excelSheets.map(s => s.text).join('\n\n---\n\n');
      sections = excelSheets.map(s => ({ title: `Hoja ${s.sheetName}`, text: s.text }));

    } else if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // 3. Documento PDF -> Descargar binario y parsear con pdf-parse
      const res = await driveInstance.files.get(
        { fileId: fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
      );
      fullText = await extractTextFromPdf(Buffer.from(res.data));

    } else {
      // 4. Markdown, texto plano u otros archivos de texto
      const res = await driveInstance.files.get(
        { fileId: fileId, alt: 'media' },
        { responseType: 'text' }
      );
      fullText = typeof res.data === 'string' ? res.data : String(res.data);
    }
  } catch (error) {
    console.error(`[DocumentExtractor Error] Error extrayendo archivo '${fileName}' (${fileId}):`, error.message);
    fullText = '';
  }

  const cleanTitle = fileName.replace(/\.(md|pdf|xlsx|txt)$/i, '');
  const version = extractDocumentVersion(fullText);

  return {
    title: cleanTitle,
    text: fullText,
    version: version,
    sections: sections,
  };
}

/**
 * Extrae contenido de un archivo local (para pruebas y fallback de docs_politicas_drive/)
 * @param {string} localFilePath
 * @returns {Promise<{ title: string, text: string, version: string, sections: Array<{ title: string, text: string }> }>}
 */
export async function extractFromLocalFile(localFilePath) {
  const fileName = path.basename(localFilePath);
  const ext = path.extname(localFilePath).toLowerCase();
  let fullText = '';
  let sections = [];

  if (ext === '.pdf') {
    const buf = fs.readFileSync(localFilePath);
    fullText = await extractTextFromPdf(buf);
  } else if (ext === '.xlsx') {
    const buf = fs.readFileSync(localFilePath);
    const excelSheets = extractTextFromExcel(buf);
    fullText = excelSheets.map(s => s.text).join('\n\n---\n\n');
    sections = excelSheets.map(s => ({ title: `Hoja ${s.sheetName}`, text: s.text }));
  } else {
    fullText = fs.readFileSync(localFilePath, 'utf8');
  }

  const cleanTitle = fileName.replace(/\.(md|pdf|xlsx|txt)$/i, '');
  const version = extractDocumentVersion(fullText);

  return {
    title: cleanTitle,
    text: fullText,
    version: version,
    sections: sections,
  };
}

export default {
  extractFromDriveFile,
  extractFromLocalFile,
  extractTextFromPdf,
  extractTextFromExcel,
  extractDocumentVersion,
};
