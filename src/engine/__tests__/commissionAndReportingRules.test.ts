import {
  NormalizedRecord,
  CommissionRuleSet,
  ValidationIssue,
} from '../../types';
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

export function runCommissionAndReportingTests() {
  console.log('🧪 Starting Commission & Reporting Rules Engine Test Suite...\n');
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

  const createSampleRecord = (overrides: Partial<NormalizedRecord> = {}): NormalizedRecord => {
    const gross = overrides.grossAmount !== undefined ? overrides.grossAmount : 5000;
    const net = overrides.netAmount !== undefined ? overrides.netAmount : gross;
    return {
      rowIndex: 1,
      originalData: { 'Order #': 'ORD-101', 'Sales Rep': 'Sarah Jenkins', Gross: `$${gross}.00` },
      rawValues: { transactionId: 'ORD-101', salesRep: 'Sarah Jenkins', grossAmount: `$${gross}.00` },
      transactionId: 'ORD-101',
      date: '2024-07-15',
      rawDate: '2024-07-15',
      isDateValid: true,
      salesRep: 'Sarah Jenkins',
      isSalesRepMissing: false,
      customer: 'Acme Corp',
      grossAmount: gross,
      rawGrossAmount: `$${gross}.00`,
      isGrossAmountValid: true,
      discountAmount: 0,
      rawDiscountAmount: '$0.00',
      isDiscountValid: true,
      netAmount: net,
      productCategory: 'Software',
      dealStage: 'Closed Won',
      notes: 'Standard sale',
      ...overrides,
    };
  };

  // --- Suite 1: Reporting Period Helpers & Key Derivation ---
  console.log('1. Reporting Period Granularity & Helpers:');
  test('Derives monthly, quarterly, annual, and all_dates period keys', () => {
    assertEqual(getPeriodKey('2024-07-15', 'monthly'), '2024-07', 'Monthly key 2024-07');
    assertEqual(getPeriodKey('2024-08-01', 'monthly'), '2024-08', 'Monthly key 2024-08');
    assertEqual(getPeriodKey('2024-07-15', 'quarterly'), '2024-Q3', 'Q3 key 2024-Q3');
    assertEqual(getPeriodKey('2024-02-10', 'quarterly'), '2024-Q1', 'Q1 key 2024-Q1');
    assertEqual(getPeriodKey('2024-11-20', 'quarterly'), '2024-Q4', 'Q4 key 2024-Q4');
    assertEqual(getPeriodKey('2024-07-15', 'annual'), '2024', 'Annual key 2024');
    assertEqual(getPeriodKey('2024-07-15', 'all_dates'), 'all_time', 'All dates key all_time');
  });

  test('Formats period keys into human-readable labels', () => {
    assertEqual(getPeriodLabel('2024-07', 'monthly'), 'July 2024', 'July 2024 label');
    assertEqual(getPeriodLabel('2024-Q3', 'quarterly'), 'Quarter 3, 2024', 'Q3 2024 label');
    assertEqual(getPeriodLabel('2024', 'annual'), 'Year 2024', 'Year 2024 label');
    assertEqual(getPeriodLabel('all_time', 'all_dates'), 'All Dates in Dataset', 'All dates label');
  });

  // --- Suite 2: Qualification & Exclusion Rules ---
  console.log('\n2. Transaction Qualification & Exclusions:');
  test('Qualifies standard Closed Won deal within thresholds', () => {
    const record = createSampleRecord({ dealStage: 'Closed Won', grossAmount: 5000 });
    const qual = evaluateQualification(record, DEFAULT_TIERED_RULESET, []);
    assert(qual.isQualified, 'Deal should be qualified');
    assertEqual(qual.status, 'qualified', 'Status should be qualified');
  });

  test('Excludes deal stage not in allowed list (e.g. Lost, Draft)', () => {
    const record = createSampleRecord({ dealStage: 'Lost' });
    const qual = evaluateQualification(record, DEFAULT_TIERED_RULESET, []);
    assert(!qual.isQualified, 'Lost deal should be disqualified');
    assertEqual(qual.status, 'excluded', 'Status should be excluded');
    assert(qual.reasons[0].includes('Deal Stage "Lost" is excluded'), 'Has exclusion reason');
  });

  test('Excludes transactions in excluded product categories', () => {
    const record = createSampleRecord({ productCategory: 'Pass-Through' });
    const qual = evaluateQualification(record, DEFAULT_TIERED_RULESET, []);
    assert(!qual.isQualified, 'Pass-Through category should be disqualified');
    assertEqual(qual.status, 'excluded', 'Status should be excluded');
    assert(qual.reasons[0].includes('excluded categories list'), 'Reason identifies category exclusion');
  });

  test('Excludes deals below minimum deal threshold ($50)', () => {
    const record = createSampleRecord({ grossAmount: 25, netAmount: 25 });
    const qual = evaluateQualification(record, DEFAULT_TIERED_RULESET, []);
    assert(!qual.isQualified, 'Below $50 threshold should be disqualified');
    assertEqual(qual.status, 'excluded', 'Status should be excluded');
    assert(qual.reasons[0].includes('below the minimum threshold'), 'Reason identifies minimum threshold');
  });

  test('Disqualifies transactions with hard validation errors (e.g. missing rep)', () => {
    const record = createSampleRecord({ isSalesRepMissing: true });
    const errIssue: ValidationIssue = {
      id: 'err_1',
      rowIndex: 1,
      field: 'salesRep',
      severity: 'error',
      code: 'MISSING_SALES_REP',
      message: 'Sales representative name is missing',
    };
    const qual = evaluateQualification(record, DEFAULT_TIERED_RULESET, [errIssue]);
    assert(!qual.isQualified, 'Error record must not qualify');
    assertEqual(qual.status, 'error', 'Status should be error');
  });

  test('Enforces reporting period boundaries when configured', () => {
    const ruleSetWithPeriod: CommissionRuleSet = {
      ...DEFAULT_TIERED_RULESET,
      reportingPeriod: {
        granularity: 'monthly',
        customStartDate: '2024-07-01',
        customEndDate: '2024-07-31',
        enforcePeriodExclusion: true,
      },
    };

    const inPeriodRec = createSampleRecord({ date: '2024-07-15' });
    const outPeriodRec = createSampleRecord({ date: '2024-08-15' });

    const qualIn = evaluateQualification(inPeriodRec, ruleSetWithPeriod, []);
    assert(qualIn.isQualified, 'In-period record qualifies');

    const qualOut = evaluateQualification(outPeriodRec, ruleSetWithPeriod, []);
    assert(!qualOut.isQualified, 'Out-of-period record is disqualified');
    assertEqual(qualOut.status, 'excluded', 'Status is excluded');
  });

  // --- Suite 3: Commission Calculation Models ---
  console.log('\n3. Commission Rate Models & Calculation Engine:');
  test('Calculates Flat Rate plan correctly (e.g. 8% on $10,000 = $800 + $200 high ticket = $1000)', () => {
    const record = createSampleRecord({ grossAmount: 10000, netAmount: 10000 });
    const processed = calculateRecordCommission(record, FLAT_RATE_RULESET, []);

    assertEqual(processed.calculation.baseCommission, 800, 'Base comm $800');
    assertEqual(processed.calculation.highTicketBonus, 200, 'High ticket bonus $200');
    assertEqual(processed.calculation.totalCommission, 1000, 'Total comm $1,000');
    assertEqual(processed.calculation.ruleSetId, 'flat_standard', 'Rule set ID retained');
  });

  test('Calculates Tiered Cumulative plan with category multiplier and bonus', () => {
    // $6,000 deal lands in Tier 3 ($5k-$15k @ 10%)
    // Software category gets 1.2x multiplier -> $6000 * 10% * 1.2 = $720
    // High-ticket bonus >= $5000 adds +$100 -> Total = $820
    const record = createSampleRecord({
      grossAmount: 6000,
      netAmount: 6000,
      productCategory: 'Software',
    });
    const processed = calculateRecordCommission(record, DEFAULT_TIERED_RULESET, []);

    assertEqual(processed.calculation.baseCommission, 720, 'Base commission with 1.2x multiplier');
    assertEqual(processed.calculation.highTicketBonus, 100, 'High-ticket bonus $100');
    assertEqual(processed.calculation.totalCommission, 820, 'Total commission $820');
    assertEqual(processed.calculation.trace.tierApplied, '$5,000 to $15,000: 10%', 'Tier label');
  });

  test('Calculates Graduated Marginal Tiers progressively across brackets', () => {
    // Marginal Plan:
    // First $2,500 @ 4% = $100
    // $2,500 - $7,500 ($5,000) @ 7% = $350
    // $7,500 - $20,000 ($4,500 of $12,000) @ 10% = $450
    // Total Base = $100 + $350 + $450 = $900
    // Category 'Software' has 1.1x multiplier -> $900 * 1.1 = $990
    // Deal is $12,000 >= high-ticket threshold ($12,000) -> +$200 bonus -> Total = $1,190
    const record = createSampleRecord({
      grossAmount: 12000,
      netAmount: 12000,
      productCategory: 'Software',
    });
    const processed = calculateRecordCommission(record, MARGINAL_TIERED_RULESET, []);

    assertEqual(processed.calculation.baseCommission, 990, 'Base commission $990');
    assertEqual(processed.calculation.highTicketBonus, 200, 'High-ticket bonus $200');
    assertEqual(processed.calculation.totalCommission, 1190, 'Total commission $1,190');
    assert(
      (processed.calculation.trace.marginalBrackets?.length || 0) === 3,
      '3 marginal brackets applied'
    );
  });

  test('Applies Row-Level Custom Rate override with priority', () => {
    const record = createSampleRecord({
      grossAmount: 5000,
      netAmount: 5000,
      customRate: 0.15, // 15% override
      isCustomRateValid: true,
      productCategory: 'Hardware', // hardware has 0.8 multiplier
    });
    // $5,000 * 15% = $750 * 0.8 = $600 + $100 high ticket = $700
    const processed = calculateRecordCommission(record, DEFAULT_TIERED_RULESET, []);
    assertEqual(processed.calculation.baseCommission, 600, 'Row override applied with multiplier');
    assertEqual(processed.calculation.appliedBaseRate, 0.15, 'Applied base rate is 15%');
  });

  test('Applies Rep-Specific Rate Override when configured', () => {
    const repRuleSet: CommissionRuleSet = {
      ...DEFAULT_TIERED_RULESET,
      repOverrides: [
        { salesRep: 'Sarah Jenkins', baseRateOverride: 0.12 }, // 12% override
      ],
    };

    const record = createSampleRecord({
      salesRep: 'Sarah Jenkins',
      grossAmount: 4000,
      netAmount: 4000,
      productCategory: 'Services', // 1.0x multiplier, +$25 flat bonus
    });
    // $4,000 * 12% = $480 + $25 bonus = $505
    const processed = calculateRecordCommission(record, repRuleSet, []);
    assertEqual(processed.calculation.baseCommission, 480, 'Rep override rate applied');
    assertEqual(processed.calculation.categoryBonus, 25, 'Category bonus applied');
    assertEqual(processed.calculation.totalCommission, 505, 'Total commission $505');
  });

  // --- Suite 4: Refunds & Cancellations ---
  console.log('\n4. Refunds, Cancellations & Clawback Policies:');
  test('Applies full_clawback deduction on negative refund transaction', () => {
    const refundRecord = createSampleRecord({
      grossAmount: -2000,
      netAmount: -2000,
      productCategory: 'Software', // 1.2 multiplier, Tier 2 bracket 8%
      dealStage: 'Refunded',
    });
    const refundRuleSet: CommissionRuleSet = {
      ...DEFAULT_TIERED_RULESET,
      dealStageFilter: [], // allow all
      refundPolicy: 'full_clawback',
    };
    // -$2,000 @ 8% * 1.2 = -$192
    const processed = calculateRecordCommission(refundRecord, refundRuleSet, []);
    assertEqual(processed.calculation.totalCommission, -192, 'Deducts -$192 commission');
    assertEqual(processed.calculation.refundAdjustment, -192, 'Refund adjustment recorded as -$192');
  });

  test('Ignores negative amounts under no_deduction refund policy', () => {
    const refundRecord = createSampleRecord({
      grossAmount: -2000,
      netAmount: -2000,
      dealStage: 'Refunded',
    });
    const noDeductRuleSet: CommissionRuleSet = {
      ...DEFAULT_TIERED_RULESET,
      dealStageFilter: [],
      refundPolicy: 'no_deduction',
    };
    const processed = calculateRecordCommission(refundRecord, noDeductRuleSet, []);
    assertEqual(processed.calculation.totalCommission, 0, 'Refund commission is $0');
    assertEqual(processed.calculation.refundAdjustment, 0, 'Refund adjustment is $0');
  });

  test('Applies flat_penalty fee under flat_penalty refund policy', () => {
    const refundRecord = createSampleRecord({
      grossAmount: -1500,
      netAmount: -1500,
      dealStage: 'Refunded',
    });
    const penaltyRuleSet: CommissionRuleSet = {
      ...DEFAULT_TIERED_RULESET,
      dealStageFilter: [],
      refundPolicy: 'flat_penalty',
      refundFlatPenalty: 50,
    };
    const processed = calculateRecordCommission(refundRecord, penaltyRuleSet, []);
    assertEqual(processed.calculation.totalCommission, -50, 'Flat -$50 penalty applied');
    assertEqual(processed.calculation.refundAdjustment, -50, 'Refund adjustment -$50');
  });

  // --- Suite 5: Source Reference & Audit Traceability ---
  console.log('\n5. Source Data Retention & Audit Traceability:');
  test('Retains complete source reference, qualification result, and formula description on every processed record', () => {
    const rawRecord = createSampleRecord({
      rowIndex: 42,
      transactionId: 'TXN-999',
      salesRep: 'Elena Rostova',
      customer: 'Global Logistics Corp',
      grossAmount: 8500,
      dealStage: 'Closed Won',
    });

    const processed = calculateRecordCommission(rawRecord, DEFAULT_TIERED_RULESET, []);

    // Source reference
    assertEqual(processed.sourceReference.rowIndex, 42, 'Row index retained');
    assertEqual(processed.sourceReference.transactionId, 'TXN-999', 'Transaction ID retained');
    assertEqual(processed.sourceReference.salesRep, 'Elena Rostova', 'Sales rep retained');
    assertEqual(processed.sourceReference.customer, 'Global Logistics Corp', 'Customer retained');

    // Qualification
    assertEqual(processed.qualification.isQualified, true, 'Qualification result retained');
    assert(processed.qualification.reasons.length > 0, 'Qualification reasons retained');

    // Calculation & Trace
    assertEqual(processed.calculation.ruleSetId, 'standard_tiered', 'Rule set ID retained');
    assert(processed.calculation.formulaDescription.length > 0, 'Formula description generated');
    assertEqual(processed.calculation.trace.commissionBase, 8500, 'Commission base retained');
  });

  // --- Suite 6: Reporting Totals by Salesperson & Reporting Period ---
  console.log('\n6. Reporting Engine Rollups by Salesperson & Period:');
  test('Generates accurate totals by salesperson and reporting period', () => {
    const dataset: NormalizedRecord[] = [
      // Rep 1 (Sarah): July Deal ($5,000 -> $820 comm)
      createSampleRecord({
        rowIndex: 1,
        transactionId: 'ORD-001',
        salesRep: 'Sarah Jenkins',
        date: '2024-07-10',
        grossAmount: 5000,
        netAmount: 5000,
        productCategory: 'Software',
      }),
      // Rep 1 (Sarah): August Deal ($10,000 -> Tier 3 10% * 1.2 = $1200 + $100 high ticket = $1300 comm)
      createSampleRecord({
        rowIndex: 2,
        transactionId: 'ORD-002',
        salesRep: 'Sarah Jenkins',
        date: '2024-08-15',
        grossAmount: 10000,
        netAmount: 10000,
        productCategory: 'Software',
      }),
      // Rep 2 (David): July Deal ($3,000 -> Tier 2 8% * 1.0 (Services) = $240 + $25 bonus = $265)
      createSampleRecord({
        rowIndex: 3,
        transactionId: 'ORD-003',
        salesRep: 'David Chen',
        date: '2024-07-20',
        grossAmount: 3000,
        netAmount: 3000,
        productCategory: 'Services',
      }),
      // Rep 2 (David): August Refund (-$1,000 -> Tier 1 5% * 1.0 = -$50 deduction)
      createSampleRecord({
        rowIndex: 4,
        transactionId: 'ORD-004',
        salesRep: 'David Chen',
        date: '2024-08-05',
        grossAmount: -1000,
        netAmount: -1000,
        productCategory: 'Services',
        dealStage: 'Refunded',
      }),
      // Rep 3 (Elena): July Excluded Lost Deal ($8,000 -> $0 comm)
      createSampleRecord({
        rowIndex: 5,
        transactionId: 'ORD-005',
        salesRep: 'Elena Rostova',
        date: '2024-07-25',
        grossAmount: 8000,
        netAmount: 8000,
        dealStage: 'Lost', // Excluded!
      }),
    ];

    const ruleSet: CommissionRuleSet = {
      ...DEFAULT_TIERED_RULESET,
      dealStageFilter: ['Closed Won', 'Paid', 'Completed', 'Refunded'],
      reportingPeriod: {
        granularity: 'monthly',
        enforcePeriodExclusion: false,
      },
    };

    const issuesByRow = new Map<number, ValidationIssue[]>();
    const processed = calculateAllRecords(dataset, ruleSet, issuesByRow);
    const summary = generateProcessingSummary(processed, ruleSet, []);

    // Global counts
    assertEqual(summary.totalRows, 5, '5 total rows');
    assertEqual(summary.validRows, 4, '4 valid rows');
    assertEqual(summary.excludedRows, 1, '1 excluded row (Lost deal)');

    // Global Sales & Commission:
    // Sarah: $5,000 (Tier 3 10% * 1.2 = $600 + $100 high ticket = $700) + $10,000 (Tier 3 10% * 1.2 = $1200 + $100 high ticket = $1300) = $15,000 gross, $2,000 comm
    // David: $3,000 (Tier 2 8% * 1.0 = $240 + $25 bonus = $265) - $1,000 (Tier 2 8% * 1.0 = -$80) = $2,000 gross, $185 comm
    // Elena: Excluded ($0 included in total)
    // Global Total Gross = $17,000
    // Global Total Commission = $2,185
    assertEqual(summary.totalGrossSales, 17000, 'Total gross sales $17,000');
    assertEqual(summary.totalCommissionPaid, 2185, 'Total commission $2,185');

    // Totals by Salesperson Verification:
    const sarahSummary = summary.repSummaries.find((r) => r.salesRep === 'Sarah Jenkins');
    assert(sarahSummary !== undefined, 'Sarah summary exists');
    assertEqual(sarahSummary!.totalGrossSales, 15000, 'Sarah total gross $15,000');
    assertEqual(sarahSummary!.totalCommission, 2000, 'Sarah total comm $2,000');
    assertEqual(sarahSummary!.qualifiedDeals, 2, 'Sarah 2 qualified deals');
    assertEqual(sarahSummary!.periodBreakdowns.length, 2, 'Sarah has 2 period breakdowns (2024-07 & 2024-08)');

    const davidSummary = summary.repSummaries.find((r) => r.salesRep === 'David Chen');
    assert(davidSummary !== undefined, 'David summary exists');
    assertEqual(davidSummary!.totalGrossSales, 2000, 'David total gross $2,000');
    assertEqual(davidSummary!.totalCommission, 185, 'David total comm $185');
    assertEqual(davidSummary!.refundDeals, 1, 'David 1 refund deal');

    const elenaSummary = summary.repSummaries.find((r) => r.salesRep === 'Elena Rostova');
    assert(elenaSummary !== undefined, 'Elena summary exists');
    assertEqual(elenaSummary!.excludedDeals, 1, 'Elena has 1 excluded deal');
    assertEqual(elenaSummary!.totalCommission, 0, 'Elena total comm $0');

    // Totals by Reporting Period Verification:
    assertEqual(summary.periodSummaries.length, 2, '2 reporting periods (2024-07 and 2024-08)');

    const julyPeriod = summary.periodSummaries.find((p) => p.periodKey === '2024-07');
    assert(julyPeriod !== undefined, 'July period exists');
    assertEqual(julyPeriod!.periodLabel, 'July 2024', 'July label');
    // July qualified: Sarah ($5000, $700) + David ($3000, $265) = $8,000 gross, $965 comm
    assertEqual(julyPeriod!.totalGrossSales, 8000, 'July gross sales $8,000');
    assertEqual(julyPeriod!.totalCommission, 965, 'July commission $965');
    assertEqual(julyPeriod!.repBreakdowns.length, 2, 'July has 2 reps (Sarah & David)');

    const augustPeriod = summary.periodSummaries.find((p) => p.periodKey === '2024-08');
    assert(augustPeriod !== undefined, 'August period exists');
    assertEqual(augustPeriod!.periodLabel, 'August 2024', 'August label');
    // August qualified: Sarah ($10,000, $1300) + David (-$1,000, -$80) = $9,000 gross, $1,220 comm
    assertEqual(augustPeriod!.totalGrossSales, 9000, 'August gross sales $9,000');
    assertEqual(augustPeriod!.totalCommission, 1220, 'August commission $1,220');
  });

  // --- Suite 7: Deterministic Checksum & Auditability ---
  console.log('\n7. Deterministic Audit Checksum Tests:');
  test('Produces consistent reproducible checksum for identical data and rules', () => {
    const dataset = [
      createSampleRecord({ rowIndex: 1, grossAmount: 5000 }),
      createSampleRecord({ rowIndex: 2, grossAmount: 3000 }),
    ];
    const issuesMap = new Map();
    const run1 = calculateAllRecords(dataset, DEFAULT_TIERED_RULESET, issuesMap);
    const checksum1 = generateAuditChecksum(run1, DEFAULT_TIERED_RULESET);

    const run2 = calculateAllRecords(dataset, DEFAULT_TIERED_RULESET, issuesMap);
    const checksum2 = generateAuditChecksum(run2, DEFAULT_TIERED_RULESET);

    assertEqual(checksum1, checksum2, 'Checksums must match exactly');
    assert(checksum1.startsWith('CHK-'), 'Checksum format starts with CHK-');

    // Modifying rule must change checksum
    const checksumDiffRule = generateAuditChecksum(run1, FLAT_RATE_RULESET);
    assert(checksum1 !== checksumDiffRule, 'Different ruleset changes checksum');
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    throw new Error(`${failed} tests failed!`);
  }
}
