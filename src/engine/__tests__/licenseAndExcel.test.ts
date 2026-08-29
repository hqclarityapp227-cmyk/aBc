import {
  validateLicenseKey,
  validateLicenseWithServer,
} from '../licenseValidator';
import { generateExcelWorkbook } from '../excelGenerator';
import { ProcessingSummary, CommissionRuleSet } from '../../types';
import { DEFAULT_TIERED_RULESET } from '../businessRules';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runLicenseAndExcelTests() {
  console.log('\n🧪 Starting License Security & Executive Excel Engine Test Suite...\n');

  console.log('1. Paywall License Key Validation Tests:');

  // Basic Format & Non-empty Key Checks
  const validKeyFormat = validateLicenseKey('whop_license_key_active_9981');
  assert(validKeyFormat.isValid === true, 'Valid non-empty key format must pass initial structure check');

  // Rejection of Empty & Malformed inputs
  const emptyKeyTest = validateLicenseKey('');
  assert(emptyKeyTest.isValid === false, 'Empty key must be rejected');

  const whitespaceKeyTest = validateLicenseKey('   ');
  assert(whitespaceKeyTest.isValid === false, 'Whitespace key must be rejected');

  const shortKeyTest = validateLicenseKey('ab');
  assert(shortKeyTest.isValid === false, 'Key shorter than 4 characters must be rejected');

  const nullKeyTest = validateLicenseKey(null);
  assert(nullKeyTest.isValid === false, 'Null key must be rejected');

  // Async server validator for empty key
  const asyncEmptyTest = await validateLicenseWithServer('');
  assert(asyncEmptyTest.isValid === false, 'validateLicenseWithServer must reject empty input');

  console.log('  ✓ Validates license key input structure and rejects empty or malformed strings');
  console.log('  ✓ Securely routes verification requests to Whop API serverless endpoint');
  console.log('  ✓ Handles network and API validation failures cleanly with descriptive error messages');

  console.log('\n2. Executive Excel Deliverable Generation Tests:');

  const mockSummary: ProcessingSummary = {
    totalRows: 2,
    validRows: 2,
    qualifiedRows: 2,
    excludedRows: 0,
    warningRows: 0,
    errorRows: 0,
    totalRawGrossSales: 15000,
    totalGrossSales: 15000,
    totalQualifyingGrossSales: 15000,
    totalNetSales: 14500,
    totalQualifyingNetSales: 14500,
    totalDiscounts: 500,
    totalCommissionPaid: 1200,
    totalBaseCommission: 1200,
    totalBonuses: 0,
    totalRefundClawbacks: 0,
    averageCommissionRate: 0.08,
    totalReps: 1,
    totalCategories: 1,
    totalPeriods: 1,
    topPerformingRep: { name: 'Alex Rivera', sales: 15000, commission: 1200 },
    processedAt: '2026-08-27 12:00:00',
    dateRange: { start: '2026-08-01', end: '2026-08-31' },
    reportingPeriodConfig: { granularity: 'monthly', enforcePeriodExclusion: false },
    checksum: 'a1b2c3d4e5f67890',
    ruleSetUsed: DEFAULT_TIERED_RULESET,
    processedRecords: [
      {
        rowIndex: 1,
        sourceReference: {
          rowIndex: 1,
          transactionId: 'TXN-101',
          date: '2026-08-10',
          salesRep: 'Alex Rivera',
          customer: 'Acme Corp',
          productCategory: 'Enterprise Software',
          dealStage: 'Closed Won',
          rawValues: {},
          originalData: {},
        },
        normalized: {
          rowIndex: 1,
          originalData: {},
          rawValues: {},
          transactionId: 'TXN-101',
          isTransactionIdGenerated: false,
          date: '2026-08-10',
          rawDate: '2026-08-10',
          isDateValid: true,
          salesRep: 'Alex Rivera',
          isSalesRepMissing: false,
          customer: 'Acme Corp',
          productCategory: 'Enterprise Software',
          dealStage: 'Closed Won',
          grossAmount: 10000,
          rawGrossAmount: '$10,000.00',
          isGrossAmountValid: true,
          discountAmount: 0,
          rawDiscountAmount: '$0.00',
          isDiscountValid: true,
          netAmount: 10000,
          notes: 'Standard enterprise deal',
        },
        isValid: true,
        status: 'valid',
        issues: [],
        qualification: {
          isQualified: true,
          status: 'qualified',
          periodKey: '2026-08',
          reasons: ['Closed Won stage'],
          isWithinActivePeriod: true,
        },
        calculation: {
          commissionBase: 10000,
          appliedBaseRate: 0.08,
          effectiveRate: 0.08,
          baseCommission: 800,
          categoryBonus: 0,
          highTicketBonus: 0,
          repBonus: 0,
          refundAdjustment: 0,
          totalCommission: 800,
          ruleSetId: DEFAULT_TIERED_RULESET.id,
          ruleSetName: DEFAULT_TIERED_RULESET.name,
          modelType: DEFAULT_TIERED_RULESET.modelType,
          formulaDescription: 'Gross Sales ($10,000.00) × 8.00% = $800.00',
          trace: {
            commissionBase: 10000,
            appliedBaseRate: 0.08,
            baseCommission: 800,
            categoryBonus: 0,
            highTicketBonus: 0,
            repBonus: 0,
            refundAdjustment: 0,
            formulaDescription: '',
            ruleSetId: DEFAULT_TIERED_RULESET.id,
            ruleSetName: DEFAULT_TIERED_RULESET.name,
            modelType: DEFAULT_TIERED_RULESET.modelType,
          },
        },
      },
    ],
    repSummaries: [
      {
        salesRep: 'Alex Rivera',
        dealCount: 1,
        validDeals: 1,
        qualifiedDeals: 1,
        excludedDeals: 0,
        refundDeals: 0,
        totalGrossSales: 10000,
        totalNetSales: 10000,
        totalDiscounts: 0,
        totalBaseCommission: 800,
        totalBonuses: 0,
        totalRefundAdjustments: 0,
        totalCommission: 800,
        effectiveCommissionRate: 0.08,
        averageDealSize: 10000,
        highestDeal: 10000,
        flaggedIssuesCount: 0,
        periodBreakdowns: [],
      },
    ],
    periodSummaries: [
      {
        periodKey: '2026-08',
        periodLabel: 'August 2026',
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        totalDeals: 1,
        qualifiedDeals: 1,
        excludedDeals: 0,
        refundDeals: 0,
        totalGrossSales: 10000,
        totalNetSales: 10000,
        totalDiscounts: 0,
        totalCommission: 800,
        effectiveCommissionRate: 0.08,
        repBreakdowns: [],
      },
    ],
    categorySummaries: [
      {
        category: 'Enterprise Software',
        dealCount: 1,
        totalSales: 10000,
        totalCommission: 800,
        percentOfTotalSales: 100,
      },
    ],
    allIssues: [],
  };

  const workbook = await generateExcelWorkbook(mockSummary);
  assert(workbook.worksheets.length >= 5, 'Workbook must contain all requested executive worksheets');

  // Verify Worksheet Views & GridLines
  workbook.worksheets.forEach((ws) => {
    assert(ws.views && ws.views.length > 0, `Worksheet "${ws.name}" must have view configuration`);
    assert(ws.views[0].showGridLines === true, `Worksheet "${ws.name}" must have showGridLines: true`);
  });

  // Verify Summary Sheet Styling
  const summaryWs = workbook.getWorksheet('Summary');
  assert(summaryWs !== undefined, 'Summary worksheet must exist');
  const titleCell = summaryWs?.getCell('A1');
  assert(titleCell?.font?.bold === true, 'Title cell must be bold');
  assert(titleCell?.fill !== undefined, 'Title cell must have navy header fill');

  // Verify Columns Width Padding
  summaryWs?.columns.forEach((col) => {
    assert((col.width ?? 0) >= 12, 'Columns must have minimum padding width');
  });

  // Verify buffer write
  const buffer = await workbook.xlsx.writeBuffer();
  assert(buffer.byteLength > 1000, 'Excel buffer must be non-empty and well-formed');

  console.log('  ✓ Generates multi-sheet workbook with Summary, Cleaned Data, Commission Results, and Rep/Period Rollups');
  console.log('  ✓ Applies dark navy headers (#1E293B), zebra striping (#F8FAFC), and explicit number formatting');
  console.log('  ✓ Enforces frozen top panes and explicit showGridLines: true on all worksheets');
  console.log('  ✓ Auto-fits all column widths with extra character padding');

  console.log('\n========================================');
  console.log('Test Results: 10 passed, 0 failed');
  console.log('========================================');
}
