import {
  cleanString,
  isPlaceholderValue,
  parseCurrencyOrNumber,
  parseRate,
  normalizeDate,
  normalizeDataset,
} from '../dataNormalizer';
import { validateRecords } from '../dataValidator';
import { detectColumns } from '../columnDetector';
import { ColumnMapping } from '../../types';

// Simple assertion helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed for ${message}. Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`);
  }
}

export function runAllTests() {
  console.log('🧪 Starting Data Cleaning & Validation Engine Test Suite...\n');
  let passed = 0;
  let failed = 0;

  const test = (name: string, fn: () => void) => {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}`);
      console.error(`    Error: ${err.message}`);
      failed++;
    }
  };

  // --- Suite 1: Whitespace & String Cleaning ---
  console.log('1. String & Whitespace Sanitization Tests:');
  test('Cleans zero-width characters and BOM markers', () => {
    const input = '\uFEFF\u200B John \u200C Doe \u200D';
    assertEqual(cleanString(input), 'John Doe', 'Zero-width removal');
  });

  test('Replaces non-breaking spaces and collapses multi-spaces', () => {
    const input = ' Sarah\u00A0\u00A0  Jenkins \t \n ';
    assertEqual(cleanString(input), 'Sarah Jenkins', 'NBSP and multi-space collapsing');
  });

  test('Identifies placeholder values correctly', () => {
    assert(isPlaceholderValue('N/A'), 'N/A is placeholder');
    assert(isPlaceholderValue('na'), 'na is placeholder');
    assert(isPlaceholderValue('null'), 'null is placeholder');
    assert(isPlaceholderValue('-'), '- is placeholder');
    assert(isPlaceholderValue('TBD'), 'TBD is placeholder');
    assert(isPlaceholderValue('Unassigned'), 'Unassigned is placeholder');
    assert(!isPlaceholderValue('John Doe'), 'John Doe is valid name');
  });

  // --- Suite 2: Number & Currency Parsing ---
  console.log('\n2. Currency & Number Parsing Tests:');
  test('Parses standard US currency formats', () => {
    assertEqual(parseCurrencyOrNumber('$1,250.50').value, 1250.5, '$1,250.50 parse');
    assertEqual(parseCurrencyOrNumber('4500.00').value, 4500, '4500.00 parse');
    assertEqual(parseCurrencyOrNumber('$0.00').value, 0, '$0.00 parse');
    assert(parseCurrencyOrNumber('$0.00').isValid, '$0.00 is valid');
  });

  test('Parses accounting negative parentheses format ($1,250.00) -> -1250', () => {
    const res = parseCurrencyOrNumber('($1,250.00)');
    assertEqual(res.value, -1250, 'Accounting negative with dollar sign');
    assert(res.isAccountingNegative, 'isAccountingNegative is true');
    assert(res.isValid, 'is valid');

    const res2 = parseCurrencyOrNumber('(500)');
    assertEqual(res2.value, -500, 'Accounting negative plain');
  });

  test('Parses various negative formats (-$100, $-100, 100-)', () => {
    assertEqual(parseCurrencyOrNumber('-$100.50').value, -100.5, '-$100.50');
    assertEqual(parseCurrencyOrNumber('$-100.50').value, -100.5, '$-100.50');
    assertEqual(parseCurrencyOrNumber('100.50-').value, -100.5, '100.50-');
  });

  test('Parses international currency symbols (€, £, ¥, CAD, EUR)', () => {
    assertEqual(parseCurrencyOrNumber('€3,400.00').value, 3400, 'Euro symbol');
    assertEqual(parseCurrencyOrNumber('£2,150.00').value, 2150, 'Pound symbol');
    assertEqual(parseCurrencyOrNumber('CAD 1,500.00').value, 1500, 'CAD prefix');
  });

  test('Parses European comma decimal format (1.250,50 / 1250,50)', () => {
    assertEqual(parseCurrencyOrNumber('1.250,50').value, 1250.5, '1.250,50 EU format');
    assertEqual(parseCurrencyOrNumber('1250,50').value, 1250.5, '1250,50 EU format');
  });

  test('Rejects and flags unparseable text without guessing (TBD, #VALUE!)', () => {
    const res1 = parseCurrencyOrNumber('TBD');
    assert(!res1.isValid, 'TBD should be marked invalid');
    assert(res1.parseError !== undefined, 'Has parse error message');

    const res2 = parseCurrencyOrNumber('#VALUE!');
    assert(!res2.isValid, '#VALUE! should be marked invalid');
  });

  // --- Suite 3: Percentage & Custom Rate Parsing ---
  console.log('\n3. Commission Percentage & Rate Parsing Tests:');
  test('Parses 8%, 8.5%, 0.08, and 12.5%', () => {
    assertEqual(parseRate('8%').value, 0.08, '8% rate');
    assertEqual(parseRate('8.5%').value, 0.085, '8.5% rate');
    assertEqual(parseRate('0.08').value, 0.08, '0.08 decimal rate');
    assertEqual(parseRate('12.5%').value, 0.125, '12.5% rate');
    assertEqual(parseRate('15 percent').value, 0.15, '15 percent text');
    assertEqual(parseRate(8).value, 0.08, 'numeric 8 integer rate');
  });

  test('Flags unparseable rate text', () => {
    const res = parseRate('special_rate');
    assert(!res.isValid, 'special_rate should be invalid');
  });

  // --- Suite 4: Date Parsing & Calendar Verification ---
  console.log('\n4. Date Parsing & Calendar Validation Tests:');
  test('Parses ISO date formats (YYYY-MM-DD, YYYY/MM/DD)', () => {
    assertEqual(normalizeDate('2024-07-15').isoDate, '2024-07-15', 'ISO hyphen');
    assertEqual(normalizeDate('2024/07/15').isoDate, '2024-07-15', 'ISO slash');
    assertEqual(normalizeDate('2024.07.15').isoDate, '2024-07-15', 'ISO dot');
  });

  test('Parses US date formats (MM/DD/YYYY, M/D/YYYY, MM/DD/YY)', () => {
    assertEqual(normalizeDate('07/15/2024').isoDate, '2024-07-15', '07/15/2024');
    assertEqual(normalizeDate('7/5/2024').isoDate, '2024-07-05', '7/5/2024');
    assertEqual(normalizeDate('07/15/24').isoDate, '2024-07-15', '2-digit year');
  });

  test('Parses named textual month dates (15-Jan-2024, Jan 15 2024)', () => {
    assertEqual(normalizeDate('15-Jan-2024').isoDate, '2024-01-15', '15-Jan-2024');
    assertEqual(normalizeDate('Jan 15, 2024').isoDate, '2024-01-15', 'Jan 15, 2024');
    assertEqual(normalizeDate('15 January 2024').isoDate, '2024-01-15', '15 January 2024');
  });

  test('Parses Excel numeric serial dates (e.g. 45488 -> 2024-07-15)', () => {
    const res = normalizeDate(45488);
    assertEqual(res.isoDate, '2024-07-15', 'Excel serial date conversion');
    assert(res.isValid, 'Excel serial date is valid');
  });

  test('Rejects impossible calendar dates (e.g., 2024-02-31, 2024-13-45)', () => {
    const res1 = normalizeDate('2024-02-31');
    assert(!res1.isValid, 'Feb 31 rejected');

    const res2 = normalizeDate('02/31/2024');
    assert(!res2.isValid, '02/31/2024 rejected');

    const res3 = normalizeDate('Tomorrow');
    assert(!res3.isValid, 'Text "Tomorrow" rejected');
  });

  // --- Suite 5: Inconsistent Column Names & Detection ---
  console.log('\n5. Inconsistent Column Headers Detection Tests:');
  test('Auto-detects varied column names and casing', () => {
    const headers = [
      'Order #',
      'Txn Date',
      'Account Executive',
      'Client Company',
      'Gross Sales ($)',
      'Promo Disc',
      'Opportunity Stage',
      'Commission %',
      'Comments',
    ];

    const { mapping } = detectColumns(headers);
    assertEqual(mapping.transactionId, 'Order #', 'Order # -> transactionId');
    assertEqual(mapping.date, 'Txn Date', 'Txn Date -> date');
    assertEqual(mapping.salesRep, 'Account Executive', 'Account Executive -> salesRep');
    assertEqual(mapping.customer, 'Client Company', 'Client Company -> customer');
    assertEqual(mapping.grossAmount, 'Gross Sales ($)', 'Gross Sales ($) -> grossAmount');
    assertEqual(mapping.discountAmount, 'Promo Disc', 'Promo Disc -> discountAmount');
    assertEqual(mapping.dealStage, 'Opportunity Stage', 'Opportunity Stage -> dealStage');
    assertEqual(mapping.customRate, 'Commission %', 'Commission % -> customRate');
  });

  // --- Suite 6: Full Validation Engine on Messy & Edge Case Data ---
  console.log('\n6. Dataset Normalization & Anomaly Validation Tests:');
  test('Normalizes clean dataset and detects 0 validation errors', () => {
    const rawData = [
      {
        'Order ID': 'ORD-101',
        'Date': '2024-07-01',
        'Sales Rep': 'Sarah Jenkins',
        'Customer': 'Acme Corp',
        'Gross Amount': '$5,000.00',
        'Discount': '$0.00',
      },
    ];

    const mapping: ColumnMapping = {
      transactionId: 'Order ID',
      date: 'Date',
      salesRep: 'Sales Rep',
      customer: 'Customer',
      grossAmount: 'Gross Amount',
      discountAmount: 'Discount',
    };

    const normalized = normalizeDataset(rawData, mapping);
    assertEqual(normalized.length, 1, '1 record normalized');
    assertEqual(normalized[0].grossAmount, 5000, 'Gross amount 5000');
    assertEqual(normalized[0].date, '2024-07-01', 'ISO date 2024-07-01');

    const { issues } = validateRecords(normalized);
    const errors = issues.filter((i) => i.severity === 'error');
    assertEqual(errors.length, 0, '0 validation errors on clean data');
  });

  test('Detects missing rep, invalid date, refund, duplicate txn ID, unparseable values with source rows', () => {
    const messyData = [
      // Row 1: Normal
      {
        'Order_No': 'TXN-901',
        'Sale_Date': '2024-08-01',
        'Rep_Name': 'Alex Rivera',
        'Gross': '$4,000.00',
        'Discount': '$0.00',
      },
      // Row 2: Missing Sales Rep (Error)
      {
        'Order_No': 'TXN-902',
        'Sale_Date': '2024-08-02',
        'Rep_Name': '  ', // Blank rep
        'Gross': '$3,000.00',
        'Discount': '$0.00',
      },
      // Row 3: Invalid Date (Error)
      {
        'Order_No': 'TXN-903',
        'Sale_Date': '2024-02-31', // Invalid Feb 31
        'Rep_Name': 'Jordan Taylor',
        'Gross': '$2,500.00',
        'Discount': '$0.00',
      },
      // Row 4: Duplicate Transaction ID TXN-901 (Warning)
      {
        'Order_No': 'TXN-901', // Duplicate with row 1
        'Sale_Date': '2024-08-04',
        'Rep_Name': 'Alex Rivera',
        'Gross': '$1,500.00',
        'Discount': '$0.00',
      },
      // Row 5: Negative Gross Amount (Refund Warning)
      {
        'Order_No': 'TXN-905',
        'Sale_Date': '2024-08-05',
        'Rep_Name': 'Alex Rivera',
        'Gross': '-$800.00', // Refund
        'Discount': '$0.00',
      },
      // Row 6: Unparseable Gross Amount "TBD" (Error)
      {
        'Order_No': 'TXN-906',
        'Sale_Date': '2024-08-06',
        'Rep_Name': 'Alex Rivera',
        'Gross': 'TBD', // Unparseable text
        'Discount': '$0.00',
      },
      // Row 7: Discount ($1,500) Exceeds Gross ($1,000) (Warning)
      {
        'Order_No': 'TXN-907',
        'Sale_Date': '2024-08-07',
        'Rep_Name': 'Jordan Taylor',
        'Gross': '$1,000.00',
        'Discount': '$1,500.00',
      },
      // Row 8: Exact duplicate of Row 1
      {
        'Order_No': 'TXN-901',
        'Sale_Date': '2024-08-01',
        'Rep_Name': 'Alex Rivera',
        'Gross': '$4,000.00',
        'Discount': '$0.00',
      },
    ];

    const mapping: ColumnMapping = {
      transactionId: 'Order_No',
      date: 'Sale_Date',
      salesRep: 'Rep_Name',
      grossAmount: 'Gross',
      discountAmount: 'Discount',
    };

    const normalized = normalizeDataset(messyData, mapping);
    const { issues, issuesByRow } = validateRecords(normalized);

    // Verify Row 2 has MISSING_SALES_REP error
    const row2Issues = issuesByRow.get(2) || [];
    assert(row2Issues.some((i) => i.code === 'MISSING_SALES_REP' && i.severity === 'error'), 'Row 2 flagged missing rep');

    // Verify Row 3 has UNPARSEABLE_DATE error
    const row3Issues = issuesByRow.get(3) || [];
    assert(row3Issues.some((i) => i.code === 'UNPARSEABLE_DATE' && i.severity === 'error'), 'Row 3 flagged invalid calendar date');

    // Verify Row 4 has DUPLICATE_TRANSACTION_ID warning
    const row4Issues = issuesByRow.get(4) || [];
    assert(row4Issues.some((i) => i.code === 'DUPLICATE_TRANSACTION_ID' && i.severity === 'warning'), 'Row 4 flagged duplicate txn ID');

    // Verify Row 5 has NEGATIVE_AMOUNT_REFUND warning
    const row5Issues = issuesByRow.get(5) || [];
    assert(row5Issues.some((i) => i.code === 'NEGATIVE_AMOUNT_REFUND' && i.severity === 'warning'), 'Row 5 flagged negative refund');

    // Verify Row 6 has UNPARSEABLE_GROSS_AMOUNT error
    const row6Issues = issuesByRow.get(6) || [];
    assert(row6Issues.some((i) => i.code === 'UNPARSEABLE_GROSS_AMOUNT' && i.severity === 'error'), 'Row 6 flagged unparseable gross');

    // Verify Row 7 has DISCOUNT_EXCEEDS_GROSS warning
    const row7Issues = issuesByRow.get(7) || [];
    assert(row7Issues.some((i) => i.code === 'DISCOUNT_EXCEEDS_GROSS' && i.severity === 'warning'), 'Row 7 flagged discount exceeds gross');

    // Verify Row 8 has EXACT_DUPLICATE_ROW warning
    const row8Issues = issuesByRow.get(8) || [];
    assert(row8Issues.some((i) => i.code === 'EXACT_DUPLICATE_ROW' && i.severity === 'warning'), 'Row 8 flagged exact duplicate row');

    console.log(`\n    -> Successfully flagged ${issues.length} real-world issues across ${messyData.length} test rows without losing or inventing data.`);
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    throw new Error(`${failed} tests failed!`);
  }
}
