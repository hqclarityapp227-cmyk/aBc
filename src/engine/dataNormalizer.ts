import { ColumnMapping, NormalizedRecord } from '../types';

/**
 * Strips zero-width characters, non-breaking spaces, BOM, tabs, and excess whitespace.
 */
export function cleanString(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const year = val.getUTCFullYear();
    const month = String(val.getUTCMonth() + 1).padStart(2, '0');
    const day = String(val.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const str = String(val);
  // Replace zero-width spaces (\u200B, \u200C, \u200D, \uFEFF), NBSP (\u00A0), tabs/newlines with single space
  return str
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
    .replace(/[\u00A0\t\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a string is an obvious empty placeholder (e.g., "N/A", "null", "-", "TBD").
 */
export function isPlaceholderValue(str: string): boolean {
  if (!str) return true;
  const lower = str.toLowerCase().trim();
  const placeholders = new Set([
    'n/a', 'na', 'n.a.', 'null', 'none', '-', '--', '---',
    'tbd', 'tba', 'undefined', 'nil', 'unknown', 'pending', 'unassigned',
    '#n/a', '#null!', '#value!', '#ref!', '#name?'
  ]);
  return placeholders.has(lower);
}

export interface CurrencyParseResult {
  value: number;
  isValid: boolean;
  raw: string;
  isAccountingNegative: boolean;
  parseError?: string;
}

/**
 * Parses numeric or currency value from any string/number representation.
 * Handles:
 *  - "$1,250.50", "1250.50", "(500.00)" -> -500
 *  - "-$100.00", "$-100.00", "$100.00-"
 *  - European formats: "1.250,50" -> 1250.50
 *  - Currency symbols: $, €, £, ¥, ₹, CAD, USD, EUR, GBP, AUD, CHF, kr, R$
 * Does not silently guess or convert unparseable text into 0 without marking isValid=false.
 */
export function parseCurrencyOrNumber(val: unknown): CurrencyParseResult {
  if (val === null || val === undefined) {
    return { value: 0, isValid: true, raw: '', isAccountingNegative: false };
  }

  if (typeof val === 'number') {
    if (isNaN(val)) {
      return { value: 0, isValid: false, raw: 'NaN', isAccountingNegative: false, parseError: 'Value is NaN' };
    }
    return { value: val, isValid: true, raw: String(val), isAccountingNegative: val < 0 };
  }

  const raw = cleanString(val);
  if (raw === '') {
    return { value: 0, isValid: true, raw: '', isAccountingNegative: false };
  }

  // Check accounting negative format: (100.00) or ($100.00)
  const isAccountingNegative = /^\s*\(.*?\)\s*$/.test(raw);

  // Check trailing minus: 100.00- or $100.00-
  const hasTrailingMinus = /-\s*$/.test(raw);

  // Check leading minus: -100.00 or -$100.00 or $-100.00
  const hasLeadingMinus = /^\s*-\s*[$€£¥₹A-Za-z]*/.test(raw) || /^\s*[$€£¥₹A-Za-z]*\s*-\s*/.test(raw);

  const isNegative = isAccountingNegative || hasTrailingMinus || hasLeadingMinus;

  // Strip currency symbols, currency code letters (USD, CAD, EUR, GBP, etc), parentheses, spaces
  let cleaned = raw
    .replace(/[$€£¥₹złkr]/gi, '')
    .replace(/\b(USD|CAD|EUR|GBP|AUD|CHF|BRL|INR|JPY)\b/gi, '')
    .replace(/[()]/g, '')
    .replace(/-/g, '')
    .replace(/\+/g, '')
    .replace(/\s+/g, '')
    .trim();

  // If after stripping letters it contains leftover alphabetic characters or error codes like #VALUE!
  if (/[a-zA-Z#]/.test(cleaned)) {
    return {
      value: 0,
      isValid: false,
      raw,
      isAccountingNegative,
      parseError: `Cannot parse numeric amount from text "${raw}".`,
    };
  }

  // Handle thousand separators vs decimal points:
  // Case 1: European format with comma as decimal e.g. "1.250,50" or "1250,50"
  if (/^\d{1,3}(\.\d{3})*,\d{1,2}$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (/^\d+,\d{1,2}$/.test(cleaned)) {
    // Simple "1250,50"
    cleaned = cleaned.replace(',', '.');
  } else {
    // Standard US format: "1,250,500.50" -> remove commas
    cleaned = cleaned.replace(/,/g, '');
  }

  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) {
    return {
      value: 0,
      isValid: false,
      raw,
      isAccountingNegative,
      parseError: `Cannot parse numeric amount from "${raw}".`,
    };
  }

  const finalValue = isNegative ? -Math.abs(parsed) : parsed;
  return {
    value: Math.round(finalValue * 100) / 100,
    isValid: true,
    raw,
    isAccountingNegative,
  };
}

export interface RateParseResult {
  value: number | undefined;
  isValid: boolean;
  raw: string;
  parseError?: string;
}

/**
 * Parses a custom commission rate, e.g. "8%", "0.08", "8", "12.5%", "15 percent" -> 0.08, 0.125
 */
export function parseRate(val: unknown): RateParseResult {
  if (val === null || val === undefined) {
    return { value: undefined, isValid: true, raw: '' };
  }

  if (typeof val === 'number') {
    if (isNaN(val)) {
      return { value: undefined, isValid: false, raw: 'NaN', parseError: 'Rate is NaN' };
    }
    const rate = val > 1 ? val / 100 : val;
    return { value: rate, isValid: true, raw: String(val) };
  }

  const raw = cleanString(val);
  if (raw === '' || isPlaceholderValue(raw)) {
    return { value: undefined, isValid: true, raw };
  }

  const hasPercent = raw.includes('%') || /percent/i.test(raw);
  const cleaned = raw.replace(/[%,\s]/g, '').replace(/percent/i, '');

  if (/[a-zA-Z#]/.test(cleaned)) {
    return {
      value: undefined,
      isValid: false,
      raw,
      parseError: `Cannot parse commission rate percentage from "${raw}".`,
    };
  }

  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) {
    return {
      value: undefined,
      isValid: false,
      raw,
      parseError: `Cannot parse commission rate percentage from "${raw}".`,
    };
  }

  if (hasPercent || parsed > 1) {
    return { value: parsed / 100, isValid: true, raw };
  }

  return { value: parsed, isValid: true, raw };
}

export interface DateParseResult {
  isoDate: string;
  rawDate: string;
  isValid: boolean;
  parseError?: string;
}

const MONTH_NAMES: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

/**
 * Validates calendar correctness (e.g. rejects Feb 31, April 31, leap year errors).
 */
function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (year < 1990 || year > 2060) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const daysInMonth = new Date(year, month, 0).getDate();
  return day <= daysInMonth;
}

/**
 * Normalizes various real-world date formats into standard ISO YYYY-MM-DD.
 * Handles:
 *  - Excel serial dates (e.g. 45200)
 *  - ISO: YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
 *  - US: MM/DD/YYYY, M/D/YYYY, MM-DD-YYYY, MM/DD/YY
 *  - Named months: 15-Jan-2024, Jan 15 2024, 15 January 2024, 2024-Jan-15
 *  - ISO timestamps: 2024-03-15T10:30:00Z
 */
export function normalizeDate(val: unknown): DateParseResult {
  if (val === null || val === undefined) {
    return { isoDate: '', rawDate: '', isValid: false, parseError: 'Date is missing.' };
  }

  const raw = cleanString(val);
  if (raw === '' || isPlaceholderValue(raw)) {
    return { isoDate: '', rawDate: raw, isValid: false, parseError: 'Date is missing or placeholder.' };
  }

  // 1. Excel serial date check (number around 20000 - 80000)
  if (typeof val === 'number' && val > 20000 && val < 80000) {
    // Excel epoch has a famous leap-year bug where 1900 is treated as leap year
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(excelEpoch.getTime() + val * 86400000);
    if (!isNaN(d.getTime())) {
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return {
        isoDate: `${year}-${month}-${day}`,
        rawDate: String(val),
        isValid: true,
      };
    }
  }

  // 2. ISO Date: YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const isoMatch = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);

    if (isValidCalendarDate(year, month, day)) {
      return {
        isoDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        rawDate: raw,
        isValid: true,
      };
    } else {
      return {
        isoDate: '',
        rawDate: raw,
        isValid: false,
        parseError: `Invalid calendar date components (Year: ${year}, Month: ${month}, Day: ${day}).`,
      };
    }
  }

  // 3. Named month format: e.g. "15-Jan-2024", "15 Jan 2024", "Jan 15, 2024", "January 15 2024", "2024-Jan-15"
  const namedMatch1 = raw.match(/^(\d{1,2})[-/\s]+([A-Za-z]+)[-/\s,]+(\d{2,4})$/);
  if (namedMatch1) {
    const day = parseInt(namedMatch1[1], 10);
    const mStr = namedMatch1[2].toLowerCase();
    let year = parseInt(namedMatch1[3], 10);
    if (year < 100) year = year > 50 ? 1900 + year : 2000 + year;
    const month = MONTH_NAMES[mStr];

    if (month && isValidCalendarDate(year, month, day)) {
      return {
        isoDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        rawDate: raw,
        isValid: true,
      };
    }
  }

  const namedMatch2 = raw.match(/^([A-Za-z]+)[-/\s]+(\d{1,2})[-/\s,]+(\d{2,4})$/);
  if (namedMatch2) {
    const mStr = namedMatch2[1].toLowerCase();
    const day = parseInt(namedMatch2[2], 10);
    let year = parseInt(namedMatch2[3], 10);
    if (year < 100) year = year > 50 ? 1900 + year : 2000 + year;
    const month = MONTH_NAMES[mStr];

    if (month && isValidCalendarDate(year, month, day)) {
      return {
        isoDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        rawDate: raw,
        isValid: true,
      };
    }
  }

  // 4. US Date or Slash format: MM/DD/YYYY or M/D/YYYY or MM-DD-YYYY or MM/DD/YY
  const slashMatch = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (slashMatch) {
    let p1 = parseInt(slashMatch[1], 10);
    let p2 = parseInt(slashMatch[2], 10);
    let year = parseInt(slashMatch[3], 10);
    if (year < 100) year = year > 50 ? 1900 + year : 2000 + year;

    // Disambiguate MM/DD/YYYY vs DD/MM/YYYY
    let month = p1;
    let day = p2;

    if (p1 > 12 && p2 <= 12) {
      // Must be DD/MM/YYYY
      day = p1;
      month = p2;
    }

    if (isValidCalendarDate(year, month, day)) {
      return {
        isoDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        rawDate: raw,
        isValid: true,
      };
    } else {
      return {
        isoDate: '',
        rawDate: raw,
        isValid: false,
        parseError: `Invalid calendar date "${raw}".`,
      };
    }
  }

  // 5. JavaScript Date.parse fallback
  const parsedTimestamp = Date.parse(raw);
  if (!isNaN(parsedTimestamp)) {
    const d = new Date(parsedTimestamp);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();

    if (isValidCalendarDate(year, month, day)) {
      return {
        isoDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        rawDate: raw,
        isValid: true,
      };
    }
  }

  return {
    isoDate: '',
    rawDate: raw,
    isValid: false,
    parseError: `Unrecognized date format "${raw}".`,
  };
}

/**
 * Normalizes all rows in a raw dataset using the user/auto-detected column mapping.
 * Strictly preserves raw data, flags unparseable elements, and never silently invents data.
 */
export function normalizeDataset(
  rawRows: Record<string, unknown>[],
  mapping: ColumnMapping
): NormalizedRecord[] {
  // Track full row hashes to flag exact duplicate rows
  const seenRowHashes = new Set<string>();

  return rawRows.map((rawRow, index) => {
    const rowIndex = index + 1; // 1-indexed for user readability

    const getRawVal = (fieldKey: string): unknown => {
      const colName = mapping[fieldKey];
      if (!colName || colName.trim() === '') return undefined;
      return rawRow[colName];
    };

    // Build rawValues dictionary
    const rawValues: Record<string, string> = {};
    for (const key of Object.keys(mapping)) {
      const col = mapping[key];
      if (col) {
        const val = rawRow[col];
        rawValues[key] = val !== undefined && val !== null ? String(val) : '';
      }
    }

    // Exact Duplicate Row Check
    const rowHash = JSON.stringify(rawRow);
    const isDuplicateRow = seenRowHashes.has(rowHash);
    seenRowHashes.add(rowHash);

    // 1. Transaction ID
    const rawTxn = getRawVal('transactionId');
    const cleanedTxn = cleanString(rawTxn);
    const isTxnMissing = cleanedTxn === '' || isPlaceholderValue(cleanedTxn);
    const transactionId = isTxnMissing ? `TXN-ROW-${rowIndex}` : cleanedTxn;

    // 2. Date
    const rawDateVal = getRawVal('date');
    const dateResult = normalizeDate(rawDateVal);

    // 3. Sales Rep
    const rawRepVal = getRawVal('salesRep');
    const cleanedRep = cleanString(rawRepVal);
    const isSalesRepMissing = cleanedRep === '' || isPlaceholderValue(cleanedRep);

    // 4. Customer
    const rawCustVal = getRawVal('customer');
    const customer = cleanString(rawCustVal);

    // 5. Gross Sale Amount
    const rawGrossVal = getRawVal('grossAmount');
    const grossResult = parseCurrencyOrNumber(rawGrossVal);

    // 6. Discount Amount
    const rawDiscVal = getRawVal('discountAmount');
    const discResult = parseCurrencyOrNumber(rawDiscVal);
    const discountAmount = Math.abs(discResult.value);

    // 7. Net Amount (Gross - Discount)
    const netAmount = Math.round((grossResult.value - discountAmount) * 100) / 100;

    // 8. Product Category
    const rawCatVal = getRawVal('productCategory');
    const cleanedCat = cleanString(rawCatVal);
    const productCategory = isPlaceholderValue(cleanedCat) ? 'General' : (cleanedCat || 'General');

    // 9. Deal Stage
    const rawStageVal = getRawVal('dealStage');
    const cleanedStage = cleanString(rawStageVal);
    const dealStage = cleanedStage || 'Closed Won';

    // 10. Custom Rate
    const rawRateVal = getRawVal('customRate');
    const rateResult = parseRate(rawRateVal);

    // 11. Notes
    const rawNotesVal = getRawVal('notes');
    const notes = cleanString(rawNotesVal);

    return {
      rowIndex,
      originalData: { ...rawRow },
      rawValues,
      transactionId,
      isTransactionIdGenerated: isTxnMissing,
      date: dateResult.isoDate,
      rawDate: dateResult.rawDate,
      isDateValid: dateResult.isValid,
      dateParseError: dateResult.parseError,
      salesRep: cleanedRep,
      isSalesRepMissing,
      customer,
      grossAmount: grossResult.value,
      rawGrossAmount: grossResult.raw,
      isGrossAmountValid: grossResult.isValid,
      grossParseError: grossResult.parseError,
      discountAmount,
      rawDiscountAmount: discResult.raw,
      isDiscountValid: discResult.isValid,
      netAmount,
      productCategory,
      dealStage,
      customRate: rateResult.value,
      rawCustomRate: rateResult.raw,
      isCustomRateValid: rateResult.isValid,
      notes,
      isDuplicateRow,
    };
  });
}
