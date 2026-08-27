import { ColumnMapping, STANDARD_FIELDS, StandardFieldDefinition } from '../types';
import { cleanString, normalizeDate, parseCurrencyOrNumber } from './dataNormalizer';

export interface DetectionResult {
  standardKey: string;
  matchedColumn: string | null;
  confidence: number;
  reason: string;
}

/**
 * Normalizes a header string for robust matching:
 * lowercase, removes punctuation, symbols, brackets, parentheses, underscores, and extra spaces.
 */
export function normalizeHeader(str: string): string {
  return cleanString(str)
    .toLowerCase()
    .replace(/[$€£¥#%()[\]{}.,/\\_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strips all non-alphanumeric characters for compact equality checks.
 */
function compactHeader(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Tests if sample values in a column look like dates.
 */
export function looksLikeDateColumn(values: unknown[]): boolean {
  let dateMatches = 0;
  let nonEmpties = 0;

  for (const v of values.slice(0, 25)) {
    if (v === null || v === undefined) continue;
    const str = cleanString(v);
    if (str === '') continue;
    nonEmpties++;

    const dateRes = normalizeDate(v);
    if (dateRes.isValid && dateRes.isoDate !== '') {
      dateMatches++;
    }
  }

  return nonEmpties > 0 && dateMatches / nonEmpties >= 0.6;
}

/**
 * Tests if sample values in a column look like numeric / currency values.
 */
export function looksLikeCurrencyColumn(values: unknown[]): boolean {
  let numMatches = 0;
  let nonEmpties = 0;

  for (const v of values.slice(0, 25)) {
    if (v === null || v === undefined) continue;
    const str = cleanString(v);
    if (str === '') continue;
    nonEmpties++;

    const currRes = parseCurrencyOrNumber(v);
    if (currRes.isValid && str !== '') {
      numMatches++;
    }
  }

  return nonEmpties > 0 && numMatches / nonEmpties >= 0.7;
}

/**
 * Auto-detects column mappings from available sheet headers and sample rows.
 * Handles inconsistent casing, symbols, abbreviations, and verifies data types.
 */
export function detectColumns(
  availableHeaders: string[],
  sampleRows: Record<string, unknown>[] = []
): { mapping: ColumnMapping; detections: DetectionResult[] } {
  const mapping: ColumnMapping = {};
  const detections: DetectionResult[] = [];
  const assignedHeaders = new Set<string>();

  // Pass 1: Iterate over standard fields in priority order
  for (const field of STANDARD_FIELDS) {
    let bestHeader: string | null = null;
    let highestScore = 0;
    let matchReason = '';

    const compactFieldKey = compactHeader(field.key);
    const compactFieldLabel = compactHeader(field.label);
    const compactAliases = field.aliases.map(compactHeader);

    const normFieldKey = normalizeHeader(field.key);
    const normFieldLabel = normalizeHeader(field.label);
    const normAliases = field.aliases.map(normalizeHeader);

    for (const header of availableHeaders) {
      if (assignedHeaders.has(header)) continue;

      const normH = normalizeHeader(header);
      const compactH = compactHeader(header);

      if (compactH === '') continue;

      // 1. Exact match on Key or Label
      if (compactH === compactFieldKey || compactH === compactFieldLabel || normH === normFieldKey || normH === normFieldLabel) {
        bestHeader = header;
        highestScore = 1.0;
        matchReason = 'Exact header match';
        break;
      }

      // 2. Exact match on known aliases
      if (compactAliases.includes(compactH) || normAliases.includes(normH)) {
        if (0.95 > highestScore) {
          bestHeader = header;
          highestScore = 0.95;
          matchReason = `Matched alias for ${field.label}`;
        }
        continue;
      }

      // 3. Substring & Token matching
      for (const alias of field.aliases) {
        const normAlias = normalizeHeader(alias);
        const compactAlias = compactHeader(alias);

        // Check if header contains the complete alias token
        if (normH.split(' ').includes(normAlias) || normH.includes(normAlias) || compactH.includes(compactAlias)) {
          // Prevent false positive: e.g. "discount_amount" matching "amount" (gross)
          if (field.key === 'grossAmount' && (normH.includes('discount') || normH.includes('disc') || normH.includes('rate') || normH.includes('comm'))) {
            continue;
          }
          if (field.key === 'discountAmount' && (normH.includes('gross') || normH.includes('rate') || normH.includes('comm'))) {
            continue;
          }
          if (field.key === 'customRate' && (normH.includes('gross') || normH.includes('amount') || normH.includes('discount'))) {
            continue;
          }

          const score = 0.82;
          if (score > highestScore) {
            highestScore = score;
            bestHeader = header;
            matchReason = `Keyword match on "${alias}"`;
          }
        }
      }
    }

    // Pass 1.5: Data Type Validation with Sample Row Values
    if (bestHeader && sampleRows.length > 0) {
      const sampleVals = sampleRows.map((r) => r[bestHeader!]);
      if (field.type === 'date') {
        if (looksLikeDateColumn(sampleVals)) {
          highestScore = Math.min(1.0, highestScore + 0.1);
        } else {
          highestScore -= 0.35;
        }
      } else if (field.type === 'currency' || field.type === 'number') {
        if (looksLikeCurrencyColumn(sampleVals)) {
          highestScore = Math.min(1.0, highestScore + 0.08);
        } else {
          highestScore -= 0.35;
        }
      }
    }

    if (bestHeader && highestScore >= 0.6) {
      assignedHeaders.add(bestHeader);
      mapping[field.key] = bestHeader;
      detections.push({
        standardKey: field.key,
        matchedColumn: bestHeader,
        confidence: Math.round(highestScore * 100) / 100,
        reason: matchReason,
      });
    } else {
      mapping[field.key] = '';
      detections.push({
        standardKey: field.key,
        matchedColumn: null,
        confidence: 0,
        reason: 'No confident header match found',
      });
    }
  }

  return { mapping, detections };
}

/**
 * Checks whether all required standard fields have been mapped.
 */
export function validateMappingCompleteness(
  mapping: ColumnMapping,
  fieldDefinitions: StandardFieldDefinition[] = STANDARD_FIELDS
): { isComplete: boolean; missingFields: StandardFieldDefinition[] } {
  const missingFields = fieldDefinitions.filter(
    (field) => field.required && (!mapping[field.key] || mapping[field.key].trim() === '')
  );

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}
