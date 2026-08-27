import * as XLSX from 'xlsx';
import {
  CommissionRuleSet,
  ColumnMapping,
  STANDARD_FIELDS,
} from '../../types';
import { deduplicateHeaders, parseBuffer, parseCSVString } from '../fileParser';
import { detectColumns, validateMappingCompleteness } from '../columnDetector';
import {
  cleanString,
  isPlaceholderValue,
  parseCurrencyOrNumber,
  parseRate,
  normalizeDate,
  normalizeDataset,
} from '../dataNormalizer';
import { validateRecords } from '../dataValidator';
import {
  calculateRecordCommission,
  calculateAllRecords,
  calculateMarginalTiers,
  evaluateQualification,
  getPeriodKey,
  getPeriodLabel,
  generateAuditChecksum,
} from '../calculationEngine';
import { generateProcessingSummary } from '../reportingEngine';
import {
  generateExcelWorkbook,
  exportLedgerAsCSV,
} from '../excelGenerator';
import {
  DEFAULT_TIERED_RULESET,
  MARGINAL_TIERED_RULESET,
  FLAT_RATE_RULESET,
  SAAS_RECURRING_RULESET,
} from '../businessRules';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(
      `Assertion failed for ${message}.\n  Expected: ${JSON.stringify(expected)}\n  Actual:   ${JSON.stringify(actual)}`
    );
  }
}

function assertCloseTo(actual: number, expected: number, delta: number, message: string) {
  if (Math.abs(actual - expected) > delta) {
    throw new Error(
      `Assertion failed for ${message}.\n  Expected: ~${expected} (±${delta})\n  Actual:   ${actual}`
    );
  }
}

export function runEndToEndReliabilityTests() {
  console.log('🧪 Starting Comprehensive End-to-End Reliability & Stress Test Suite...\n');
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

  // =========================================================================
  // 1. Messy Column Names, Extra Columns & Header Deduplication
  // =========================================================================
  console.log('1. Messy Headers, Extra Columns & Deduplication Tests:');

  test('Deduplicates identical and blank headers correctly', () => {
    const rawHeaders = ['Total', 'Date', 'Total', '', 'Rep', 'Total', '   '];
    const deduped = deduplicateHeaders(rawHeaders);
    assertEqual(deduped[0], 'Total', 'First Total');
    assertEqual(deduped[1], 'Date', 'Date');
    assertEqual(deduped[2], 'Total_2', 'Second Total');
    assertEqual(deduped[3], 'Column_4', 'Blank Column 4');
    assertEqual(deduped[4], 'Rep', 'Rep');
    assertEqual(deduped[5], 'Total_3', 'Third Total');
    assertEqual(deduped[6], 'Column_7', 'Whitespace Column 7');
  });

  test('Detects standard fields from heavily stylized/messy column names with extra columns', () => {
    const messyHeaders = [
      '#',                     // Extra index column
      '[TXN_ID]',              // Messy transaction ID
      'Transaction Posting Date', // Date alias
      '  Sales_Rep (Owner)  ', // Sales rep with spacing and parens
      'Customer / Client Acct',// Customer alias
      'Gross Sales Revenue ($)', // Gross amount alias with symbols
      'Promo / Concession Discount ($)', // Discount alias
      'Product / LOB Category', // Product category
      'Pipeline Status (Stage)', // Deal stage
      'Special Commission %',  // Custom rate
      'Internal CRM Notes',    // Notes alias
      'Region',                // Extra column 1
      'Manager Name',          // Extra column 2
      'Cost of Goods ($)',     // Extra column 3
      'Net Profit Margin',     // Extra column 4
    ];

    const { mapping, detections } = detectColumns(messyHeaders);

    assertEqual(mapping.transactionId, '[TXN_ID]', 'Matched transaction ID');
    assertEqual(mapping.date, 'Transaction Posting Date', 'Matched date');
    assertEqual(mapping.salesRep, '  Sales_Rep (Owner)  ', 'Matched sales rep');
    assertEqual(mapping.customer, 'Customer / Client Acct', 'Matched customer');
    assertEqual(mapping.grossAmount, 'Gross Sales Revenue ($)', 'Matched gross amount');
    assertEqual(mapping.discountAmount, 'Promo / Concession Discount ($)', 'Matched discount');
    assertEqual(mapping.productCategory, 'Product / LOB Category', 'Matched category');
    assertEqual(mapping.dealStage, 'Pipeline Status (Stage)', 'Matched deal stage');
    assertEqual(mapping.customRate, 'Special Commission %', 'Matched custom rate');
    assertEqual(mapping.notes, 'Internal CRM Notes', 'Matched notes');

    const validation = validateMappingCompleteness(mapping);
    assert(validation.isComplete, 'All required fields are mapped');
    assertEqual(validation.missingFields.length, 0, 'No missing required fields');
  });

  // =========================================================================
  // 2. Bad Dates, Calendar Edge Cases & Timezone Resilience
  // =========================================================================
  console.log('\n2. Bad Dates, Missing Dates & Calendar Edge Cases:');

  test('Normalizes various date formats and flags invalid/placeholder dates', () => {
    // Valid dates
    assertEqual(normalizeDate('2024-03-15').isoDate, '2024-03-15', 'ISO format');
    assertEqual(normalizeDate('03/15/2024').isoDate, '2024-03-15', 'US format');
    assertEqual(normalizeDate('15/03/2024').isoDate, '2024-03-15', 'European slash format');
    assertEqual(normalizeDate('15-Mar-2024').isoDate, '2024-03-15', 'Named month format');
    assertEqual(normalizeDate('March 15, 2024').isoDate, '2024-03-15', 'Full month name format');
    assertEqual(normalizeDate(45366).isoDate, '2024-03-15', 'Excel serial date 45366');
    assertEqual(normalizeDate(new Date(Date.UTC(2024, 2, 15))).isoDate, '2024-03-15', 'JS Date object');

    // Invalid / Placeholder dates
    assert(!normalizeDate('').isValid, 'Empty string is invalid date');
    assert(!normalizeDate('N/A').isValid, 'N/A is invalid date');
    assert(!normalizeDate('TBD').isValid, 'TBD is invalid date');
    assert(!normalizeDate('pending').isValid, 'pending is invalid date');
    assert(!normalizeDate('2024-02-30').isValid, 'Feb 30 is rejected');
    assert(!normalizeDate('2024-04-31').isValid, 'April 31 is rejected');
    assert(!normalizeDate('2024-13-01').isValid, 'Month 13 is rejected');
    assert(!normalizeDate('Tomorrow').isValid, 'Word Tomorrow is rejected');
  });

  // =========================================================================
  // 3. Bad Numbers, Currency Symbols, Spaced Formats & Negatives
  // =========================================================================
  console.log('\n3. Bad Numbers, Currencies & European/Spaced Number Formats:');

  test('Parses complex numbers with spaces, currencies, accounting negatives and flags unparseables', () => {
    assertEqual(parseCurrencyOrNumber('$ 1,250.50').value, 1250.5, '$ 1,250.50');
    assertEqual(parseCurrencyOrNumber('€ 3.500,00').value, 3500, '€ 3.500,00');
    assertEqual(parseCurrencyOrNumber('CAD 1 500,50').value, 1500.5, 'CAD 1 500,50');
    assertEqual(parseCurrencyOrNumber('( $2,400.00 )').value, -2400, 'Accounting negative ($2,400.00)');
    assertEqual(parseCurrencyOrNumber('-$500.00').value, -500, '-$500.00');
    assertEqual(parseCurrencyOrNumber('500.00-').value, -500, '500.00-');
    assertEqual(parseCurrencyOrNumber('$0.00').value, 0, '$0.00');
    assertEqual(parseCurrencyOrNumber('0').value, 0, '0');

    // Bad numbers that must not be silently coerced to 0 without invalid flag
    const res1 = parseCurrencyOrNumber('TBD');
    assert(!res1.isValid, 'TBD is invalid number');
    assert(res1.parseError !== undefined, 'TBD has parse error');

    const res2 = parseCurrencyOrNumber('#VALUE!');
    assert(!res2.isValid, '#VALUE! is invalid number');

    const res3 = parseCurrencyOrNumber('$$$');
    assert(!res3.isValid, '$$$ is invalid number');
  });

  // =========================================================================
  // 4. Missing Rates, Row-Level Overrides & Custom Rate Parsing
  // =========================================================================
  console.log('\n4. Custom Rates & Plan Default Fallbacks:');

  test('Parses various rate formats and gracefully falls back on missing/invalid rates', () => {
    assertEqual(parseRate('8%').value, 0.08, '8% string');
    assertEqual(parseRate('12.5%').value, 0.125, '12.5% string');
    assertEqual(parseRate('0.06').value, 0.06, '0.06 decimal string');
    assertEqual(parseRate('10 percent').value, 0.10, '10 percent text');
    assertEqual(parseRate(0.09).value, 0.09, '0.09 number');
    assertEqual(parseRate(8).value, 0.08, '8 number -> 0.08');

    // Missing rate returns undefined with isValid: true (will fall back to plan rate)
    assertEqual(parseRate('').value, undefined, 'Empty rate');
    assertEqual(parseRate(null).value, undefined, 'Null rate');
    assertEqual(parseRate('N/A').value, undefined, 'N/A rate');

    // Unparseable rate returns isValid: false
    const invalidRate = parseRate('special_discount');
    assert(!invalidRate.isValid, 'special_discount is invalid rate');
  });

  // =========================================================================
  // 5. Complete Multi-Month, Multi-Rep, Multi-Edge-Case Dataset Processing
  // =========================================================================
  console.log('\n5. Full Multi-Month, Multi-Rep Dataset Processing with All Edge Cases:');

  test('Processes complex 14-row dataset containing all real-world edge cases without data loss', () => {
    const rawDataRows: Record<string, unknown>[] = [
      // Row 1: Clean standard sale - Sarah Jenkins (July 2024)
      {
        'Order_ID': 'TXN-1001',
        'Sale_Date': '2024-07-05',
        'Sales_Rep': 'Sarah Jenkins',
        'Customer_Name': 'Acme Corp',
        'Gross_Sales': '$6,000.00',
        'Discount': '$0.00',
        'Product_Category': 'Software',
        'Deal_Stage': 'Closed Won',
        'Commission_Rate': '',
        'Notes': 'Clean enterprise deal',
        'Region': 'North America',
      },
      // Row 2: Clean standard sale - Alex Rivera (August 2024)
      {
        'Order_ID': 'TXN-1002',
        'Sale_Date': '2024-08-12',
        'Sales_Rep': 'Alex Rivera',
        'Customer_Name': 'Starlight Tech',
        'Gross_Sales': '$12,000.00',
        'Discount': '$500.00',
        'Product_Category': 'Enterprise',
        'Deal_Stage': 'Paid',
        'Commission_Rate': '',
        'Notes': 'High ticket deal',
        'Region': 'EMEA',
      },
      // Row 3: Deal with Row-Level Custom Rate Override (12%) - Taylor Brooks (July 2024)
      {
        'Order_ID': 'TXN-1003',
        'Sale_Date': '2024-07-20',
        'Sales_Rep': 'Taylor Brooks',
        'Customer_Name': 'CyberShield Inc',
        'Gross_Sales': '$4,000.00',
        'Discount': '$0.00',
        'Product_Category': 'Services',
        'Deal_Stage': 'Closed Won',
        'Commission_Rate': '12%',
        'Notes': 'Custom agreed rate',
        'Region': 'North America',
      },
      // Row 4: Negative Refund / Return - Sarah Jenkins (August 2024)
      {
        'Order_ID': 'TXN-1004',
        'Sale_Date': '2024-08-18',
        'Sales_Rep': 'Sarah Jenkins',
        'Customer_Name': 'Acme Corp',
        'Gross_Sales': '-$1,500.00',
        'Discount': '$0.00',
        'Product_Category': 'Software',
        'Deal_Stage': 'Refunded',
        'Commission_Rate': '',
        'Notes': 'Customer product return',
        'Region': 'North America',
      },
      // Row 5: Excluded Product Category (Pass-Through) - Alex Rivera (July 2024)
      {
        'Order_ID': 'TXN-1005',
        'Sale_Date': '2024-07-25',
        'Sales_Rep': 'Alex Rivera',
        'Customer_Name': 'Nexus Logistics',
        'Gross_Sales': '$8,000.00',
        'Discount': '$0.00',
        'Product_Category': 'Pass-Through',
        'Deal_Stage': 'Closed Won',
        'Commission_Rate': '',
        'Notes': 'Reimbursable pass-through hardware',
        'Region': 'EMEA',
      },
      // Row 6: Non-Won Deal Stage (Lost) - Taylor Brooks (August 2024)
      {
        'Order_ID': 'TXN-1006',
        'Sale_Date': '2024-08-02',
        'Sales_Rep': 'Taylor Brooks',
        'Customer_Name': 'Vortex Dynamics',
        'Gross_Sales': '$15,000.00',
        'Discount': '$0.00',
        'Product_Category': 'Software',
        'Deal_Stage': 'Closed Lost',
        'Commission_Rate': '',
        'Notes': 'Lost to competitor',
        'Region': 'APAC',
      },
      // Row 7: Below Minimum Deal Threshold ($25 < $50 threshold) - Sarah Jenkins
      {
        'Order_ID': 'TXN-1007',
        'Sale_Date': '2024-07-28',
        'Sales_Rep': 'Sarah Jenkins',
        'Customer_Name': 'MicroSoftly Small',
        'Gross_Sales': '$25.00',
        'Discount': '$0.00',
        'Product_Category': 'Services',
        'Deal_Stage': 'Closed Won',
        'Commission_Rate': '',
        'Notes': 'Micro test charge',
        'Region': 'North America',
      },
      // Row 8: Duplicate Transaction ID (Same ID TXN-1001 as Row 1) - Alex Rivera
      {
        'Order_ID': 'TXN-1001',
        'Sale_Date': '2024-08-15',
        'Sales_Rep': 'Alex Rivera',
        'Customer_Name': 'Duplicate Systems',
        'Gross_Sales': '$3,000.00',
        'Discount': '$0.00',
        'Product_Category': 'Services',
        'Deal_Stage': 'Closed Won',
        'Commission_Rate': '',
        'Notes': 'Re-used transaction ID in CRM',
        'Region': 'EMEA',
      },
      // Row 9: Missing Transaction ID (Blank) - Taylor Brooks
      {
        'Order_ID': '',
        'Sale_Date': '2024-07-10',
        'Sales_Rep': 'Taylor Brooks',
        'Customer_Name': 'Omni Retail',
        'Gross_Sales': '$2,000.00',
        'Discount': '$100.00',
        'Product_Category': 'Hardware',
        'Deal_Stage': 'Paid',
        'Commission_Rate': '',
        'Notes': 'No invoice ID generated yet',
        'Region': 'North America',
      },
      // Row 10: Missing Sales Rep (Unassigned / Error)
      {
        'Order_ID': 'TXN-1010',
        'Sale_Date': '2024-08-22',
        'Sales_Rep': 'Unassigned',
        'Customer_Name': 'Orphan Account',
        'Gross_Sales': '$5,000.00',
        'Discount': '$0.00',
        'Product_Category': 'Software',
        'Deal_Stage': 'Closed Won',
        'Commission_Rate': '',
        'Notes': 'No rep attached to deal',
        'Region': 'Unknown',
      },
      // Row 11: Unparseable / Invalid Date (Error)
      {
        'Order_ID': 'TXN-1011',
        'Sale_Date': '2024-02-31', // Impossible Feb 31
        'Sales_Rep': 'Sarah Jenkins',
        'Customer_Name': 'Calendar Bug Corp',
        'Gross_Sales': '$4,500.00',
        'Discount': '$0.00',
        'Product_Category': 'Software',
        'Deal_Stage': 'Closed Won',
        'Commission_Rate': '',
        'Notes': 'Corrupted date',
        'Region': 'North America',
      },
      // Row 12: Unparseable Gross Amount (#VALUE! Error)
      {
        'Order_ID': 'TXN-1012',
        'Sale_Date': '2024-08-25',
        'Sales_Rep': 'Alex Rivera',
        'Customer_Name': 'Broken Calc LLC',
        'Gross_Sales': '#VALUE!',
        'Discount': '$0.00',
        'Product_Category': 'Software',
        'Deal_Stage': 'Closed Won',
        'Commission_Rate': '',
        'Notes': 'Formula error in sheet',
        'Region': 'EMEA',
      },
      // Row 13: Discount Exceeds Gross (Warning) - Taylor Brooks
      {
        'Order_ID': 'TXN-1013',
        'Sale_Date': '2024-07-30',
        'Sales_Rep': 'Taylor Brooks',
        'Customer_Name': 'Over-Discounted Corp',
        'Gross_Sales': '$1,000.00',
        'Discount': '$1,200.00',
        'Product_Category': 'Services',
        'Deal_Stage': 'Closed Won',
        'Commission_Rate': '',
        'Notes': 'Concession larger than price',
        'Region': 'North America',
      },
      // Row 14: Exact Duplicate of Row 1 (Warning)
      {
        'Order_ID': 'TXN-1001',
        'Sale_Date': '2024-07-05',
        'Sales_Rep': 'Sarah Jenkins',
        'Customer_Name': 'Acme Corp',
        'Gross_Sales': '$6,000.00',
        'Discount': '$0.00',
        'Product_Category': 'Software',
        'Deal_Stage': 'Closed Won',
        'Commission_Rate': '',
        'Notes': 'Clean enterprise deal',
        'Region': 'North America',
      },
    ];

    const mapping: ColumnMapping = {
      transactionId: 'Order_ID',
      date: 'Sale_Date',
      salesRep: 'Sales_Rep',
      customer: 'Customer_Name',
      grossAmount: 'Gross_Sales',
      discountAmount: 'Discount',
      productCategory: 'Product_Category',
      dealStage: 'Deal_Stage',
      customRate: 'Commission_Rate',
      notes: 'Notes',
    };

    // 1. Normalization
    const normalizedRecords = normalizeDataset(rawDataRows, mapping);
    assertEqual(normalizedRecords.length, 14, 'Preserved all 14 rows without dropping any');

    // Check Row 9 generated transaction reference
    assertEqual(normalizedRecords[8].transactionId, 'TXN-ROW-9', 'Generated reference for missing TXN ID');
    assert(normalizedRecords[8].isTransactionIdGenerated, 'Flagged as generated TXN ID');

    // Check Row 14 flagged as duplicate row
    assert(normalizedRecords[13].isDuplicateRow, 'Row 14 marked as exact duplicate row');

    // 2. Validation
    const { issues, issuesByRow } = validateRecords(normalizedRecords);
    assert(issues.length >= 8, 'Detected all expected validation anomalies');

    // Verify Row 10 (missing rep) has error issue
    const row10Issues = issuesByRow.get(10) || [];
    assert(row10Issues.some((i) => i.code === 'MISSING_SALES_REP' && i.severity === 'error'), 'Row 10 has MISSING_SALES_REP error');

    // Verify Row 11 (bad date) has error issue
    const row11Issues = issuesByRow.get(11) || [];
    assert(row11Issues.some((i) => i.code === 'UNPARSEABLE_DATE' && i.severity === 'error'), 'Row 11 has UNPARSEABLE_DATE error');

    // Verify Row 12 (bad amount) has error issue
    const row12Issues = issuesByRow.get(12) || [];
    assert(row12Issues.some((i) => i.code === 'UNPARSEABLE_GROSS_AMOUNT' && i.severity === 'error'), 'Row 12 has UNPARSEABLE_GROSS_AMOUNT error');

    // Verify Row 8 (duplicate TXN ID) has warning
    const row8Issues = issuesByRow.get(8) || [];
    assert(row8Issues.some((i) => i.code === 'DUPLICATE_TRANSACTION_ID' && i.severity === 'warning'), 'Row 8 has DUPLICATE_TRANSACTION_ID warning');

    // 3. Calculation with Standard Tiered Ruleset
    const processedRecords = calculateAllRecords(normalizedRecords, DEFAULT_TIERED_RULESET, issuesByRow);
    assertEqual(processedRecords.length, 14, 'All 14 processed records preserved');

    // 4. Verification of Specific Record Calculations:
    // Row 1: $6,000 Software deal (Tier 3: 10% * 1.2x Software multiplier = $720 + $100 high ticket = $820)
    const rec1 = processedRecords[0];
    assert(rec1.qualification.isQualified, 'Row 1 is qualified');
    assertEqual(rec1.calculation.baseCommission, 720, 'Row 1 Base Comm $720');
    assertEqual(rec1.calculation.highTicketBonus, 100, 'Row 1 High Ticket $100');
    assertEqual(rec1.calculation.totalCommission, 820, 'Row 1 Total Comm $820');

    // Row 3: $4,000 with custom rate 12% (Services +$25 flat bonus -> $4000 * 12% = $480 + $25 = $505)
    const rec3 = processedRecords[2];
    assert(rec3.qualification.isQualified, 'Row 3 is qualified');
    assertEqual(rec3.calculation.appliedBaseRate, 0.12, 'Row 3 Custom Rate 12%');
    assertEqual(rec3.calculation.totalCommission, 505, 'Row 3 Total Comm $505');

    // Row 4: -$1,500 Refund (Software -> Tier 2: 8% * 1.2x = -$144 clawback)
    const rec4 = processedRecords[3];
    assert(rec4.qualification.isQualified, 'Row 4 is qualified as refund');
    assertEqual(rec4.calculation.totalCommission, -144, 'Row 4 Refund Clawback -$144');

    // Row 5: Pass-Through Category -> Excluded
    const rec5 = processedRecords[4];
    assert(!rec5.qualification.isQualified, 'Row 5 is disqualified');
    assertEqual(rec5.qualification.status, 'excluded', 'Row 5 status is excluded');
    assertEqual(rec5.calculation.totalCommission, 0, 'Row 5 Commission is $0');
    assert(rec5.qualification.reasons[0].includes('excluded categories list'), 'Row 5 explains exclusion');

    // Row 6: Closed Lost -> Excluded
    const rec6 = processedRecords[5];
    assert(!rec6.qualification.isQualified, 'Row 6 is disqualified');
    assertEqual(rec6.qualification.status, 'excluded', 'Row 6 status is excluded');
    assertEqual(rec6.calculation.totalCommission, 0, 'Row 6 Commission is $0');
    assert(rec6.qualification.reasons[0].includes('Deal Stage "Closed Lost" is excluded'), 'Row 6 explains stage exclusion');

    // Row 7: Under $50 threshold ($25) -> Excluded
    const rec7 = processedRecords[6];
    assert(!rec7.qualification.isQualified, 'Row 7 is disqualified');
    assertEqual(rec7.qualification.status, 'excluded', 'Row 7 status is excluded');
    assertEqual(rec7.calculation.totalCommission, 0, 'Row 7 Commission is $0');
    assert(rec7.qualification.reasons[0].includes('below the minimum threshold'), 'Row 7 explains threshold exclusion');

    // Row 10, 11, 12: Errors -> Status error, commission $0, explicit error explanation
    const rec10 = processedRecords[9];
    assertEqual(rec10.qualification.status, 'error', 'Row 10 status is error');
    assertEqual(rec10.calculation.totalCommission, 0, 'Row 10 Commission is $0');

    const rec11 = processedRecords[10];
    assertEqual(rec11.qualification.status, 'error', 'Row 11 status is error');
    assertEqual(rec11.calculation.totalCommission, 0, 'Row 11 Commission is $0');

    const rec12 = processedRecords[11];
    assertEqual(rec12.qualification.status, 'error', 'Row 12 status is error');
    assertEqual(rec12.calculation.totalCommission, 0, 'Row 12 Commission is $0');

    // 5. Reporting Engine Rollups
    const summary = generateProcessingSummary(processedRecords, DEFAULT_TIERED_RULESET, issues);

    assertEqual(summary.totalRows, 14, 'Total rows = 14');
    assertEqual(summary.errorRows, 3, 'Error rows = 3 (Rows 10, 11, 12)');
    assertEqual(summary.excludedRows, 3, 'Excluded rows = 3 (Rows 5, 6, 7)');
    assert(summary.qualifiedRows >= 7, 'Qualified deals >= 7');

    // Multiple Salespeople Rollups
    assert(summary.repSummaries.length >= 3, 'Rollup includes multiple salespeople');
    const sarahSummary = summary.repSummaries.find((r) => r.salesRep === 'Sarah Jenkins');
    assert(sarahSummary !== undefined, 'Sarah Jenkins rollup exists');
    assert(sarahSummary!.totalCommission > 0, 'Sarah Jenkins earned commission');
    assert(sarahSummary!.refundDeals >= 1, 'Sarah Jenkins has refund tracked');

    // Multiple Periods Rollups
    assert(summary.periodSummaries.length >= 2, 'Rollup includes multiple monthly periods');
    const julPeriod = summary.periodSummaries.find((p) => p.periodKey === '2024-07');
    const augPeriod = summary.periodSummaries.find((p) => p.periodKey === '2024-08');
    assert(julPeriod !== undefined, 'July 2024 period rollup exists');
    assert(augPeriod !== undefined, 'August 2024 period rollup exists');

    // Deterministic Checksum
    assert(summary.checksum.startsWith('CHK-'), 'Checksum generated correctly');
    const secondSummary = generateProcessingSummary(processedRecords, DEFAULT_TIERED_RULESET, issues);
    assertEqual(summary.checksum, secondSummary.checksum, 'Deterministic checksum identical on recalculation');

    // 6. Excel Generation & All 6 Sheets Verification
    const workbook = generateExcelWorkbook(summary);
    const expectedSheets = [
      'Summary',
      'Cleaned Data',
      'Commission Results',
      'Issues',
      'Salesperson Summary',
      'Period Summary',
    ];

    expectedSheets.forEach((sheetName) => {
      assert(workbook.SheetNames.includes(sheetName), `Excel workbook contains sheet "${sheetName}"`);
      const ws = workbook.Sheets[sheetName];
      assert(ws !== undefined, `Worksheet "${sheetName}" is defined`);
      const jsonRows = XLSX.utils.sheet_to_json(ws);
      assert(jsonRows.length > 0, `Worksheet "${sheetName}" contains structured rows`);
    });

    // 7. CSV Export Verification
    const csvOutput = exportLedgerAsCSV(summary);
    assert(csvOutput.includes('Row_Number,Transaction_ID,Date'), 'CSV contains standard headers');
    assert(csvOutput.includes('TXN-1001'), 'CSV contains transaction records');
    assert(csvOutput.includes('Sarah Jenkins'), 'CSV contains sales rep data');
  });

  // =========================================================================
  // 6. Refund Policies Comparison (Full Clawback vs Flat Penalty vs No Deduction)
  // =========================================================================
  console.log('\n6. Comprehensive Refund Policy Verification:');

  test('Calculates and compares all three refund policies correctly', () => {
    const refundRecord = {
      rowIndex: 1,
      originalData: {},
      rawValues: {},
      transactionId: 'REF-1',
      isTransactionIdGenerated: false,
      date: '2024-07-15',
      rawDate: '2024-07-15',
      isDateValid: true,
      salesRep: 'Alex Rivera',
      isSalesRepMissing: false,
      customer: 'Refund Corp',
      grossAmount: -2000,
      rawGrossAmount: '-$2,000.00',
      isGrossAmountValid: true,
      discountAmount: 0,
      rawDiscountAmount: '$0.00',
      isDiscountValid: true,
      netAmount: -2000,
      productCategory: 'General',
      dealStage: 'Refunded',
      notes: '',
      isDuplicateRow: false,
    };

    // Policy 1: full_clawback on 8% flat plan -> -$2000 * 8% = -$160
    const processedClawback = calculateRecordCommission(refundRecord, FLAT_RATE_RULESET, []);
    assertEqual(processedClawback.calculation.totalCommission, -160, 'Full clawback commission = -$160');

    // Policy 2: no_deduction
    const noDedRuleSet: CommissionRuleSet = {
      ...FLAT_RATE_RULESET,
      refundPolicy: 'no_deduction',
    };
    const processedNoDed = calculateRecordCommission(refundRecord, noDedRuleSet, []);
    assertEqual(processedNoDed.calculation.totalCommission, 0, 'No deduction commission = $0');

    // Policy 3: flat_penalty of $75
    const flatPenRuleSet: CommissionRuleSet = {
      ...FLAT_RATE_RULESET,
      refundPolicy: 'flat_penalty',
      refundFlatPenalty: 75,
    };
    const processedFlatPen = calculateRecordCommission(refundRecord, flatPenRuleSet, []);
    assertEqual(processedFlatPen.calculation.totalCommission, -75, 'Flat penalty commission = -$75');
  });

  // =========================================================================
  // 7. Marginal Graduated Brackets Calculations Across Deal Sizes
  // =========================================================================
  console.log('\n7. Graduated Marginal Tiers Mathematical Verification:');

  test('Calculates multi-bracket deals accurately', () => {
    // Deal of $10,000 under MARGINAL_TIERED_RULESET:
    // Tier 1 ($0 - $2,500 @ 4%): $2,500 * 4% = $100
    // Tier 2 ($2,500 - $7,500 @ 7%): $5,000 * 7% = $350
    // Tier 3 ($7,500 - $20,000 @ 10%): $2,500 * 10% = $250
    // Total Base Commission = $100 + $350 + $250 = $700
    const tiers = MARGINAL_TIERED_RULESET.tiers;
    const res = calculateMarginalTiers(10000, tiers, 0.05);

    assertEqual(res.totalBaseCommission, 700, 'Marginal $10k base comm = $700');
    assertEqual(res.brackets.length, 3, '3 brackets applied');
    assertEqual(res.brackets[0].eligiblePortion, 2500, 'Bracket 1 portion $2,500');
    assertEqual(res.brackets[1].eligiblePortion, 5000, 'Bracket 2 portion $5,000');
    assertEqual(res.brackets[2].eligiblePortion, 2500, 'Bracket 3 portion $2,500');
  });

  // =========================================================================
  // 8. Multi-Sheet XLSX File Parsing & Decorative Banner Row Skipping
  // =========================================================================
  console.log('\n8. Multi-Sheet File Parsing & Decorative Banner Skipping:');

  test('Parses multi-sheet binary workbook with title banners and empty rows', () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: East Region with title banner on rows 1-2, real headers on row 3
    const sheet1Data = [
      ['SALES COMMISSION DATA EXPORT - Q3 2024'], // Decorative Banner Row 1
      ['Confidential - Internal HR & Finance Use Only'], // Subheader Row 2
      ['Txn ID', 'Posting Date', 'Rep Name', 'Client', 'Gross Revenue', 'Stage'], // Real Headers Row 3
      ['TX-E01', '2024-07-10', 'Sarah Jenkins', 'Alpha Corp', 5000, 'Closed Won'],
      [], // Empty row
      ['TX-E02', '2024-07-15', 'Alex Rivera', 'Beta LLC', 8000, 'Paid'],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
    XLSX.utils.book_append_sheet(wb, ws1, 'East Region');

    // Sheet 2: West Region with standard headers on row 1
    const sheet2Data = [
      ['Order #', 'Date', 'Salesperson', 'Account', 'Amount', 'Status'],
      ['TX-W01', '2024-08-01', 'Taylor Brooks', 'Gamma Co', 12000, 'Closed Won'],
      ['TX-W02', '2024-08-05', 'Taylor Brooks', 'Delta Inc', 4500, 'Closed Won'],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
    XLSX.utils.book_append_sheet(wb, ws2, 'West Region');

    // Generate binary buffer
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    // Parse buffer using our decoupled file parser
    const parsed = parseBuffer(buf, 'Q3_Regional_Sales.xlsx');

    assertEqual(parsed.sheets.length, 2, '2 sheets parsed');
    assertEqual(parsed.sheets[0].sheetName, 'East Region', 'Sheet 1 is East Region');
    assertEqual(parsed.sheets[1].sheetName, 'West Region', 'Sheet 2 is West Region');

    // Verify Sheet 1 skipped the decorative banner and identified the real 6 headers
    assertEqual(parsed.sheets[0].headers.length, 6, 'Sheet 1 has 6 headers');
    assertEqual(parsed.sheets[0].headers[0], 'Txn ID', 'Sheet 1 Header 0 is Txn ID');
    assertEqual(parsed.sheets[0].rows.length, 2, 'Sheet 1 has 2 data rows (skipped empty row)');
    assertEqual(parsed.sheets[0].rows[0]['Rep Name'], 'Sarah Jenkins', 'Sheet 1 Row 1 Rep');

    // Verify Sheet 2
    assertEqual(parsed.sheets[1].rows.length, 2, 'Sheet 2 has 2 data rows');
    assertEqual(parsed.sheets[1].rows[0]['Salesperson'], 'Taylor Brooks', 'Sheet 2 Row 1 Rep');
  });

  // =========================================================================
  // 9. RFC 4180 PapaParse CSV Parser Requirements (Quotes, Headers, Missing, Trim)
  // =========================================================================
  console.log('\n9. RFC 4180 PapaParse CSV Parser Requirements:');

  test('Preserves quotation marks and does not split on commas inside quotes', () => {
    const csvContent = [
      'Txn_ID,Customer_Name,Product_Description,Deal_Amount',
      'TX-001,"Acme, Inc.","Software, Enterprise Suite 100pk",$15000.00',
      'TX-002,"Global Tech, LLC","Standard ""Pro"" Edition",$8500.00',
      'TX-003,"Smith, Jones & Co.","Consulting, Setup & Training, Tier 1",$3200.00',
    ].join('\n');

    const parsed = parseCSVString(csvContent, 'quoted_deals.csv');
    assertEqual(parsed.sheets[0].headers.length, 4, '4 headers detected');
    assertEqual(parsed.sheets[0].rows.length, 3, '3 data rows');

    // Row 1: "Acme, Inc." must not split into "Acme" and "Inc."
    assertEqual(parsed.sheets[0].rows[0]['Customer_Name'], 'Acme, Inc.', 'Commas preserved in customer name');
    assertEqual(parsed.sheets[0].rows[0]['Product_Description'], 'Software, Enterprise Suite 100pk', 'Commas preserved in description');

    // Row 2: Escaped double quotes
    assertEqual(parsed.sheets[0].rows[1]['Customer_Name'], 'Global Tech, LLC', 'Commas in LLC');
    assertEqual(parsed.sheets[0].rows[1]['Product_Description'], 'Standard "Pro" Edition', 'Escaped quotes preserved');

    // Row 3: Multiple commas inside quotes
    assertEqual(parsed.sheets[0].rows[2]['Customer_Name'], 'Smith, Jones & Co.', 'Ampersand & comma');
    assertEqual(parsed.sheets[0].rows[2]['Product_Description'], 'Consulting, Setup & Training, Tier 1', '3 commas in quotes');
  });

  test('Reliably treats the first non-empty line as the header row', () => {
    const csvWithBlankTopLines = [
      '', // Blank line 1
      '   ', // Whitespace-only line 2
      '	', // Tab line 3
      'Rep Name,Date,Amount,Stage', // Real headers on line 4
      'Sarah Jenkins,2024-07-15,$5000,Closed Won',
      'Alex Rivera,2024-07-20,$8000,Closed Won',
    ].join('\r\n');

    const parsed = parseCSVString(csvWithBlankTopLines, 'test_blank_headers.csv');
    assertEqual(parsed.sheets[0].headers.length, 4, '4 headers parsed');
    assertEqual(parsed.sheets[0].headers[0], 'Rep Name', 'Header 0 is Rep Name');
    assertEqual(parsed.sheets[0].headers[1], 'Date', 'Header 1 is Date');
    assertEqual(parsed.sheets[0].rows.length, 2, '2 data rows parsed');
    assertEqual(parsed.sheets[0].rows[0]['Rep Name'], 'Sarah Jenkins', 'Row 1 rep is Sarah');
  });

  test('Handles missing values without dropping the row', () => {
    const csvWithMissingCells = [
      'Order_ID,Sales_Rep,Sale_Date,Gross_Sales,Deal_Stage',
      'TX-101,Sarah Jenkins,2024-07-10,$6000.00,Closed Won',
      'TX-102,,2024-07-11,$4500.00,Closed Won', // Missing sales rep
      'TX-103,Taylor Brooks,,$3200.00,Closed Won', // Missing date
      'TX-104,Alex Rivera,2024-07-15,,Closed Won', // Missing amount
      'TX-105,Morgan Lee,2024-07-18,$5000.00,', // Missing stage
      'TX-106,Chris Evans', // Missing all trailing columns
      '', // Completely blank line (should be skipped)
      '   ', // Whitespace line (should be skipped)
      'TX-107,Jordan Casey,2024-07-22,$7000.00,Closed Won',
    ].join('\n');

    const parsed = parseCSVString(csvWithMissingCells, 'partial_missing.csv');
    assertEqual(parsed.sheets[0].headers.length, 5, '5 headers');
    // All 7 non-empty transaction rows must be preserved without dropping
    assertEqual(parsed.sheets[0].rows.length, 7, 'All 7 rows preserved despite missing fields');

    // Verify row 2 (missing rep) was NOT dropped
    assertEqual(parsed.sheets[0].rows[1]['Order_ID'], 'TX-102', 'Row 2 preserved');
    assertEqual(parsed.sheets[0].rows[1]['Sales_Rep'], '', 'Missing rep is empty string');

    // Verify row 3 (missing date) was NOT dropped
    assertEqual(parsed.sheets[0].rows[2]['Order_ID'], 'TX-103', 'Row 3 preserved');
    assertEqual(parsed.sheets[0].rows[2]['Sale_Date'], '', 'Missing date is empty string');

    // Verify row 4 (missing amount) was NOT dropped
    assertEqual(parsed.sheets[0].rows[3]['Order_ID'], 'TX-104', 'Row 4 preserved');
    assertEqual(parsed.sheets[0].rows[3]['Gross_Sales'], '', 'Missing amount is empty string');

    // Verify row 6 (missing trailing cols) was NOT dropped
    assertEqual(parsed.sheets[0].rows[5]['Order_ID'], 'TX-106', 'Row 6 preserved');
    assertEqual(parsed.sheets[0].rows[5]['Sales_Rep'], 'Chris Evans', 'Row 6 rep preserved');
    assertEqual(parsed.sheets[0].rows[5]['Sale_Date'], '', 'Missing trailing col is empty string');
    assertEqual(parsed.sheets[0].rows[5]['Gross_Sales'], '', 'Missing trailing col is empty string');
  });

  test('Trims extraneous whitespace around headers and values', () => {
    const messyWhitespaceCsv = [
      '   Sales Rep   ,   Posting Date   ,   Deal Amount   ,   Stage   ',
      '   Sarah Jenkins   ,   2024-07-15   ,   "$ 12,500.00"   ,   Closed Won   ',
      '   Alex Rivera   ,   2024-08-01   ,   $ 4500.00   ,   Paid   ',
    ].join('\n');

    const parsed = parseCSVString(messyWhitespaceCsv, 'whitespace.csv');
    // Headers must have extraneous whitespace trimmed
    assertEqual(parsed.sheets[0].headers[0], 'Sales Rep', 'Header trimmed');
    assertEqual(parsed.sheets[0].headers[1], 'Posting Date', 'Header trimmed');
    assertEqual(parsed.sheets[0].headers[2], 'Deal Amount', 'Header trimmed');
    assertEqual(parsed.sheets[0].headers[3], 'Stage', 'Header trimmed');

    // Cell values must have extraneous whitespace trimmed
    assertEqual(parsed.sheets[0].rows[0]['Sales Rep'], 'Sarah Jenkins', 'Rep trimmed');
    assertEqual(parsed.sheets[0].rows[0]['Posting Date'], '2024-07-15', 'Date trimmed');
    assertEqual(parsed.sheets[0].rows[0]['Deal Amount'], '$ 12,500.00', 'Amount trimmed');
    assertEqual(parsed.sheets[0].rows[0]['Stage'], 'Closed Won', 'Stage trimmed');

    assertEqual(parsed.sheets[0].rows[1]['Sales Rep'], 'Alex Rivera', 'Rep trimmed');
    assertEqual(parsed.sheets[0].rows[1]['Posting Date'], '2024-08-01', 'Date trimmed');
    assertEqual(parsed.sheets[0].rows[1]['Deal Amount'], '$ 4500.00', 'Amount trimmed');
    assertEqual(parsed.sheets[0].rows[1]['Stage'], 'Paid', 'Stage trimmed');
  });

  console.log('\n========================================');
  console.log(`End-to-End Test Results: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');

  if (failed > 0) {
    throw new Error(`${failed} end-to-end tests failed.`);
  }
}
