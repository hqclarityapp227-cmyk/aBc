import * as XLSX from 'xlsx';
import { ParsedWorkbook, RawSheetData } from '../types';
import { cleanString } from './dataNormalizer';

/**
 * Deduplicates sheet headers so that no two columns have identical keys.
 * E.g., ['Total', 'Date', 'Total'] -> ['Total', 'Date', 'Total_2']
 */
export function deduplicateHeaders(rawHeaders: string[]): string[] {
  const seen = new Map<string, number>();
  return rawHeaders.map((header, idx) => {
    let cleaned = cleanString(header);
    if (!cleaned) {
      cleaned = `Column_${idx + 1}`;
    }

    const lower = cleaned.toLowerCase();
    const count = seen.get(lower) || 0;
    seen.set(lower, count + 1);

    if (count > 0) {
      return `${cleaned}_${count + 1}`;
    }
    return cleaned;
  });
}

/**
 * Parses raw ArrayBuffer or Uint8Array workbook data into structured sheet data.
 * Skips decorative header banners, empty rows, and normalizes cell whitespace.
 */
export function parseBuffer(
  buffer: ArrayBuffer | Uint8Array,
  fileName = 'dataset.xlsx',
  fileSize = 0
): ParsedWorkbook {
  const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
  const fileType: 'csv' | 'xlsx' = fileExt === 'csv' ? 'csv' : 'xlsx';

  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    cellNF: true,
    cellText: true,
    raw: false,
  });

  const sheets: RawSheetData[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Convert sheet to array of arrays to find real header row and skip blank rows
    const rawRows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
      raw: false,
    }) as unknown[][];

    if (rawRows.length === 0) {
      sheets.push({
        sheetName,
        headers: [],
        rows: [],
        totalRowCount: 0,
      });
      continue;
    }

    // Find the header row (look for the row with the most non-empty string cells in top 15 rows)
    let headerRowIdx = 0;
    let maxNonEmptyCount = 0;

    for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
      const row = rawRows[i] || [];
      const nonEmpties = row.filter((cell) => {
        if (cell === undefined || cell === null) return false;
        return cleanString(cell) !== '';
      });

      if (nonEmpties.length >= 2 && nonEmpties.length > maxNonEmptyCount) {
        maxNonEmptyCount = nonEmpties.length;
        headerRowIdx = i;
      }
    }

    const rawHeaderRow = (rawRows[headerRowIdx] || []) as string[];
    const headers = deduplicateHeaders(rawHeaderRow);

    const dataRows = rawRows.slice(headerRowIdx + 1);
    const rows: Record<string, unknown>[] = [];

    for (let rIdx = 0; rIdx < dataRows.length; rIdx++) {
      const rowArr = dataRows[rIdx] as unknown[];
      // Check if row is completely empty / whitespace
      const isAllEmpty = rowArr.every((cell) => {
        if (cell === undefined || cell === null) return true;
        return cleanString(cell) === '';
      });
      if (isAllEmpty) continue;

      const rowObj: Record<string, unknown> = {};
      headers.forEach((header, colIdx) => {
        const val = rowArr[colIdx];
        rowObj[header] = val !== undefined && val !== null ? val : '';
      });
      rows.push(rowObj);
    }

    sheets.push({
      sheetName,
      headers,
      rows,
      totalRowCount: rows.length,
    });
  }

  const activeSheetName = sheets.length > 0 ? sheets[0].sheetName : '';

  return {
    fileName,
    fileSize: fileSize || buffer.byteLength,
    fileType,
    sheets,
    activeSheetName,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Parses CSV and XLSX files from browser File objects.
 */
export async function parseFile(file: File): Promise<ParsedWorkbook> {
  const buffer = await file.arrayBuffer();
  return parseBuffer(buffer, file.name, file.size);
}
