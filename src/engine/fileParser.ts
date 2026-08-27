import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ParsedWorkbook, RawSheetData } from '../types';
import { cleanString } from './dataNormalizer';

/**
 * Deduplicates sheet headers so that no two columns have identical keys.
 * E.g., ['Total', 'Date', 'Total'] -> ['Total', 'Date', 'Total_2']
 * Also trims extraneous whitespace and fills empty column headers.
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
 * Parses raw CSV text using PapaParse with RFC 4180 compliance.
 * Meets requirements:
 * 1) Preserves quotation marks and does not split on commas inside quotes
 * 2) Reliably treats the first non-empty line as the header row
 * 3) Handles missing values without dropping the row
 * 4) Trims extraneous whitespace around headers and values
 */
export function parseCSVString(
  csvText: string,
  fileName = 'dataset.csv',
  fileSize = 0
): ParsedWorkbook {
  // Strip UTF-8 BOM if present
  let cleanCsv = csvText.replace(/^\uFEFF/, '');

  // Normalize extraneous whitespace immediately outside field quotes so PapaParse correctly treats them as quoted RFC 4180 fields
  cleanCsv = cleanCsv
    .replace(/(^|[,;\t|])[\t ]+"/gm, '$1"')
    .replace(/"[\t ]+([,;\t|]|\r?\n|$)/gm, '"$1');

  // Parse using PapaParse in 2D array mode for RFC 4180 compliant quote/comma parsing
  const parsed = Papa.parse<string[]>(cleanCsv, {
    quoteChar: '"',
    escapeChar: '"',
    header: false, // get array of arrays so we can inspect and find the first non-empty line
    skipEmptyLines: false, // evaluate each row manually to preserve rows with missing values
    dynamicTyping: false,
  });

  const rawRows = parsed.data || [];

  // Requirement 2: Reliably treat the first non-empty line as the header row
  let headerRowIdx = -1;
  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!Array.isArray(row)) continue;
    const hasContent = row.some((cell) => cleanString(cell) !== '');
    if (hasContent) {
      headerRowIdx = i;
      break;
    }
  }

  const sheetName = fileName.replace(/\.[^/.]+$/, '') || 'Sheet1';

  if (headerRowIdx === -1) {
    return {
      fileName,
      fileSize: fileSize || new Blob([csvText]).size,
      fileType: 'csv',
      sheets: [
        {
          sheetName,
          headers: [],
          rows: [],
          totalRowCount: 0,
        },
      ],
      activeSheetName: sheetName,
      uploadedAt: new Date().toISOString(),
    };
  }

  // Requirement 4: Trim extraneous whitespace around headers
  const rawHeaderRow = rawRows[headerRowIdx] || [];
  const rawHeaders = rawHeaderRow.map((h) => cleanString(h));

  // Determine last non-empty header column to avoid trailing empty delimiter artifacts
  let lastNonEmptyHeaderIdx = rawHeaders.length - 1;
  while (lastNonEmptyHeaderIdx >= 0 && rawHeaders[lastNonEmptyHeaderIdx] === '') {
    lastNonEmptyHeaderIdx--;
  }

  const effectiveHeaders = rawHeaders.slice(0, Math.max(1, lastNonEmptyHeaderIdx + 1));
  const headers = deduplicateHeaders(effectiveHeaders);

  const dataRows = rawRows.slice(headerRowIdx + 1);
  const rows: Record<string, unknown>[] = [];

  for (let rIdx = 0; rIdx < dataRows.length; rIdx++) {
    const rowArr = dataRows[rIdx];
    if (!Array.isArray(rowArr)) continue;

    // Check if entire row is completely empty / blank whitespace
    const isAllEmpty = rowArr.every((cell) => cleanString(cell) === '');
    if (isAllEmpty) {
      // Skip only completely blank rows (e.g. trailing newlines)
      continue;
    }

    // Requirement 3: Handle missing values without dropping the row
    // Requirement 4: Trim extraneous whitespace around values
    const rowObj: Record<string, unknown> = {};
    headers.forEach((header, colIdx) => {
      const rawCell = rowArr[colIdx];
      if (rawCell === undefined || rawCell === null) {
        rowObj[header] = '';
      } else {
        rowObj[header] = cleanString(rawCell);
      }
    });

    rows.push(rowObj);
  }

  return {
    fileName,
    fileSize: fileSize || new Blob([csvText]).size,
    fileType: 'csv',
    sheets: [
      {
        sheetName,
        headers,
        rows,
        totalRowCount: rows.length,
      },
    ],
    activeSheetName: sheetName,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Alias for parseCSVString
 */
export const parseCSV = parseCSVString;

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
  const isCsv = fileExt === 'csv' || fileExt === 'tsv' || fileExt === 'txt';

  // If CSV/TSV/TXT, use the RFC 4180 compliant PapaParse parser
  if (isCsv) {
    const textDecoder = new TextDecoder('utf-8');
    const csvText = textDecoder.decode(buffer);
    return parseCSVString(csvText, fileName, fileSize || buffer.byteLength);
  }

  // Otherwise, use XLSX for Excel spreadsheets
  const fileType: 'csv' | 'xlsx' = 'xlsx';
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
        rowObj[header] = val !== undefined && val !== null ? cleanString(val) : '';
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
  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
  if (fileExt === 'csv' || fileExt === 'tsv' || fileExt === 'txt') {
    const text = await file.text();
    return parseCSVString(text, file.name, file.size);
  }

  const buffer = await file.arrayBuffer();
  return parseBuffer(buffer, file.name, file.size);
}

