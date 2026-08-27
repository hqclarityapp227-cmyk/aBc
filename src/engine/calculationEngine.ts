import {
  CommissionRuleSet,
  NormalizedRecord,
  ProcessedRecord,
  ValidationIssue,
  CalculationTrace,
  MarginalTierBracket,
  QualificationResult,
  ReportingPeriodConfig,
  ReportingPeriodGranularity,
} from '../types';

/**
 * Derives a normalized reporting period key from a date string (YYYY-MM-DD).
 * Examples:
 * - 'monthly' -> '2024-08'
 * - 'quarterly' -> '2024-Q3'
 * - 'annual' -> '2024'
 * - 'all_dates' -> 'all_time'
 */
export function getPeriodKey(dateStr: string, granularity: ReportingPeriodGranularity): string {
  if (!dateStr || dateStr === 'N/A' || granularity === 'all_dates') {
    return 'all_time';
  }

  const clean = dateStr.trim().slice(0, 10);
  const parts = clean.split('-');
  if (parts.length < 2) return 'all_time';

  const year = parts[0];
  const month = parseInt(parts[1], 10);

  if (isNaN(month) || month < 1 || month > 12) return 'all_time';

  switch (granularity) {
    case 'monthly':
      return `${year}-${parts[1].padStart(2, '0')}`;
    case 'quarterly': {
      const q = Math.ceil(month / 3);
      return `${year}-Q${q}`;
    }
    case 'annual':
      return `${year}`;
    case 'custom_range':
      return 'custom_period';
    default:
      return 'all_time';
  }
}

/**
 * Produces a human-readable label for a given period key.
 */
export function getPeriodLabel(periodKey: string, granularity: ReportingPeriodGranularity): string {
  if (periodKey === 'all_time' || granularity === 'all_dates') {
    return 'All Dates in Dataset';
  }
  if (periodKey === 'custom_period') {
    return 'Custom Date Range';
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (granularity === 'monthly') {
    const [year, monthStr] = periodKey.split('-');
    const mIdx = parseInt(monthStr, 10) - 1;
    if (mIdx >= 0 && mIdx < 12) {
      return `${monthNames[mIdx]} ${year}`;
    }
    return periodKey;
  }

  if (granularity === 'quarterly') {
    const [year, qStr] = periodKey.split('-');
    return `Quarter ${qStr.replace('Q', '')}, ${year}`;
  }

  if (granularity === 'annual') {
    return `Year ${periodKey}`;
  }

  return periodKey;
}

/**
 * Checks whether a given transaction date falls within the configured reporting period.
 */
export function isDateInReportingPeriod(
  dateStr: string,
  periodConfig?: ReportingPeriodConfig
): boolean {
  if (!periodConfig || periodConfig.granularity === 'all_dates') {
    return true;
  }

  if (!dateStr || dateStr.length < 10) {
    return false;
  }

  const { customStartDate, customEndDate } = periodConfig;

  if (customStartDate && dateStr < customStartDate) {
    return false;
  }
  if (customEndDate && dateStr > customEndDate) {
    return false;
  }

  return true;
}

/**
 * Deterministically evaluates qualification criteria for a transaction.
 */
export function evaluateQualification(
  record: NormalizedRecord,
  ruleSet: CommissionRuleSet,
  issues: ValidationIssue[]
): QualificationResult {
  const reasons: string[] = [];
  const hasErrors = issues.some((i) => i.severity === 'error');
  const periodKey = getPeriodKey(record.date, ruleSet.reportingPeriod?.granularity || 'all_dates');
  const isWithinActivePeriod = isDateInReportingPeriod(record.date, ruleSet.reportingPeriod);

  // Check 1: Hard validation error in source data
  if (hasErrors) {
    const errMsgs = issues
      .filter((i) => i.severity === 'error')
      .map((i) => i.message)
      .join('; ');
    reasons.push(`Validation Error: ${errMsgs}`);
    return {
      isQualified: false,
      status: 'error',
      reasons,
      periodKey,
      isWithinActivePeriod,
    };
  }

  // Check 2: Excluded Product Categories
  const category = (record.productCategory || '').trim().toLowerCase();
  if (category) {
    // Check global excluded categories
    const isGloballyExcluded = ruleSet.excludedCategories.some(
      (exc) => exc.trim().toLowerCase() === category
    );

    // Check category multiplier exclusion flag
    const catRule = ruleSet.categoryMultipliers.find(
      (c) => c.category.trim().toLowerCase() === category
    );
    const isExplicitlyExcluded = catRule?.isExcluded === true;

    if (isGloballyExcluded || isExplicitlyExcluded) {
      reasons.push(`Product Category "${record.productCategory}" is in the excluded categories list.`);
      return {
        isQualified: false,
        status: 'excluded',
        reasons,
        periodKey,
        isWithinActivePeriod,
      };
    }
  }

  // Check 2.5: Refund Inclusion Policy
  const commissionBase = ruleSet.applyTo === 'gross' ? record.grossAmount : record.netAmount;
  const isRefund = commissionBase < 0;

  if (isRefund && !ruleSet.includeRefunds) {
    reasons.push('Refunds and negative transactions are excluded by commission plan configuration.');
    return {
      isQualified: false,
      status: 'excluded',
      reasons,
      periodKey,
      isWithinActivePeriod,
    };
  }

  // Check 3: Deal Stage Filter Exclusions
  if (ruleSet.dealStageFilter && ruleSet.dealStageFilter.length > 0) {
    const stage = (record.dealStage || '').trim().toLowerCase();
    const isAllowedStage = ruleSet.dealStageFilter.some(
      (allowed) => allowed.trim().toLowerCase() === stage
    );
    const isRefundStage =
      isRefund ||
      ['refunded', 'refund', 'returned', 'return', 'clawback', 'credit memo'].includes(stage);

    // If deal stage is not in allowed list, and it is not an included refund
    if (!isAllowedStage && !(isRefundStage && ruleSet.includeRefunds)) {
      const displayStage = record.dealStage || '(blank)';
      reasons.push(
        `Deal Stage "${displayStage}" is excluded (eligible stages: ${ruleSet.dealStageFilter.join(', ')}).`
      );
      return {
        isQualified: false,
        status: 'excluded',
        reasons,
        periodKey,
        isWithinActivePeriod,
      };
    }
  }

  // Check 4: Reporting Period Exclusion (if enforced)
  if (ruleSet.reportingPeriod?.enforcePeriodExclusion && !isWithinActivePeriod) {
    reasons.push(
      `Transaction date (${record.date || 'unknown'}) is outside active reporting period (${ruleSet.reportingPeriod.customStartDate || 'start'} to ${ruleSet.reportingPeriod.customEndDate || 'end'}).`
    );
    return {
      isQualified: false,
      status: 'excluded',
      reasons,
      periodKey,
      isWithinActivePeriod: false,
    };
  }

  // Check 5: Minimum Deal Value Threshold for non-refund deals
  const absBase = Math.abs(commissionBase);

  if (!isRefund && ruleSet.minimumDealThreshold > 0 && absBase < ruleSet.minimumDealThreshold) {
    reasons.push(
      `Deal value ($${absBase.toFixed(2)}) is below the minimum threshold ($${ruleSet.minimumDealThreshold.toFixed(2)}).`
    );
    return {
      isQualified: false,
      status: 'excluded',
      reasons,
      periodKey,
      isWithinActivePeriod,
    };
  }

  // Check for non-fatal warnings
  const hasWarnings = issues.some((i) => i.severity === 'warning');
  if (hasWarnings) {
    const warnMsgs = issues
      .filter((i) => i.severity === 'warning')
      .map((i) => i.message)
      .join('; ');
    reasons.push(`Note: ${warnMsgs}`);
    return {
      isQualified: true,
      status: 'warning',
      reasons,
      periodKey,
      isWithinActivePeriod,
    };
  }

  return {
    isQualified: true,
    status: 'qualified',
    reasons: ['Meets all qualification and reporting eligibility criteria.'],
    periodKey,
    isWithinActivePeriod,
  };
}

/**
 * Calculates progressive marginal tier commission portions.
 * Portions of deal size are taxed at successive marginal brackets.
 */
export function calculateMarginalTiers(
  amount: number,
  tiers: CommissionRuleSet['tiers'],
  defaultRate: number
): { totalBaseCommission: number; brackets: MarginalTierBracket[]; formula: string } {
  const absAmount = Math.abs(amount);
  if (absAmount === 0 || !tiers || tiers.length === 0) {
    const comm = Math.round(absAmount * defaultRate * 100) / 100;
    return {
      totalBaseCommission: comm,
      brackets: [],
      formula: `$${absAmount.toFixed(2)} × ${(defaultRate * 100).toFixed(1)}% = $${comm.toFixed(2)}`,
    };
  }

  // Sort tiers by minAmount ascending
  const sortedTiers = [...tiers].sort((a, b) => a.minAmount - b.minAmount);
  let totalBaseCommission = 0;
  const brackets: MarginalTierBracket[] = [];
  const formulaParts: string[] = [];

  for (const tier of sortedTiers) {
    const tierMin = tier.minAmount;
    const tierMax = tier.maxAmount;

    if (absAmount <= tierMin) {
      // Transaction did not reach this bracket
      continue;
    }

    const ceiling = tierMax === null ? absAmount : Math.min(absAmount, tierMax);
    const eligiblePortion = Math.max(0, ceiling - tierMin);

    if (eligiblePortion > 0) {
      const tierComm = Math.round(eligiblePortion * tier.rate * 100) / 100;
      totalBaseCommission += tierComm;

      brackets.push({
        tierLabel: tier.label,
        minAmount: tierMin,
        maxAmount: tierMax,
        rate: tier.rate,
        eligiblePortion,
        commission: tierComm,
      });

      formulaParts.push(`[$${eligiblePortion.toFixed(2)} @ ${(tier.rate * 100).toFixed(1)}% = $${tierComm.toFixed(2)}]`);
    }
  }

  totalBaseCommission = Math.round(totalBaseCommission * 100) / 100;

  return {
    totalBaseCommission,
    brackets,
    formula: formulaParts.length > 0 ? formulaParts.join(' + ') : `$0.00`,
  };
}

/**
 * Calculates deterministic commission and audit trace for a single normalized record.
 */
export function calculateRecordCommission(
  record: NormalizedRecord,
  ruleSet: CommissionRuleSet,
  issues: ValidationIssue[]
): ProcessedRecord {
  const { grossAmount, netAmount, salesRep, productCategory, customRate } = record;
  const qualification = evaluateQualification(record, ruleSet, issues);

  const sourceReference = {
    rowIndex: record.rowIndex,
    transactionId: record.transactionId,
    date: record.date,
    salesRep: record.salesRep,
    customer: record.customer,
    productCategory: record.productCategory,
    dealStage: record.dealStage,
    rawValues: record.rawValues,
    originalData: record.originalData,
  };

  // Determine base amount (Gross or Net)
  const commissionBase = ruleSet.applyTo === 'gross' ? grossAmount : netAmount;
  const isRefund = commissionBase < 0;
  const absBase = Math.abs(commissionBase);

  // If disqualified due to error or exclusion, return zero commission with full explanation
  if (!qualification.isQualified) {
    const status = qualification.status === 'error' ? 'invalid' : 'excluded';
    const reasonText = qualification.reasons.join(' | ');

    const trace: CalculationTrace = {
      commissionBase: 0,
      appliedBaseRate: 0,
      baseCommission: 0,
      categoryBonus: 0,
      highTicketBonus: 0,
      repBonus: 0,
      refundAdjustment: 0,
      formulaDescription: `Commission = $0.00 (${reasonText})`,
      ruleSetId: ruleSet.id,
      ruleSetName: ruleSet.name,
      modelType: ruleSet.modelType,
    };

    return {
      rowIndex: record.rowIndex,
      sourceReference,
      normalized: record,
      isValid: qualification.status !== 'error',
      qualification,
      status,
      issues,
      calculation: {
        commissionBase: 0,
        appliedBaseRate: 0,
        effectiveRate: 0,
        baseCommission: 0,
        categoryBonus: 0,
        highTicketBonus: 0,
        repBonus: 0,
        refundAdjustment: 0,
        totalCommission: 0,
        ruleSetId: ruleSet.id,
        ruleSetName: ruleSet.name,
        modelType: ruleSet.modelType,
        formulaDescription: trace.formulaDescription,
        trace,
      },
    };
  }

  // --- Step 1: Base Rate & Model Calculation ---
  let appliedBaseRate = ruleSet.defaultBaseRate;
  let rateSource = `Default Base (${(appliedBaseRate * 100).toFixed(1)}%)`;
  let tierAppliedName: string | undefined = undefined;
  let marginalBrackets: MarginalTierBracket[] | undefined = undefined;
  let baseCommission = 0;
  let baseFormula = '';

  // Check row-level override first
  if (customRate !== undefined && customRate >= 0 && record.isCustomRateValid !== false) {
    appliedBaseRate = customRate;
    rateSource = `Row Custom Rate (${(appliedBaseRate * 100).toFixed(1)}%)`;
    baseCommission = absBase * appliedBaseRate;
    baseFormula = `$${absBase.toFixed(2)} × ${(appliedBaseRate * 100).toFixed(1)}% [${rateSource}]`;
  } else {
    // Check Rep-specific override
    const repRule = ruleSet.repOverrides?.find(
      (r) => r.salesRep.trim().toLowerCase() === (salesRep || '').trim().toLowerCase()
    );

    if (repRule && repRule.baseRateOverride !== undefined) {
      appliedBaseRate = repRule.baseRateOverride;
      rateSource = `Rep Override for ${salesRep} (${(appliedBaseRate * 100).toFixed(1)}%)`;
      baseCommission = absBase * appliedBaseRate;
      baseFormula = `$${absBase.toFixed(2)} × ${(appliedBaseRate * 100).toFixed(1)}% [${rateSource}]`;
    } else if (ruleSet.modelType === 'tiered_marginal' && ruleSet.tiers && ruleSet.tiers.length > 0) {
      // Graduated Marginal Tiers
      const marginalResult = calculateMarginalTiers(absBase, ruleSet.tiers, ruleSet.defaultBaseRate);
      baseCommission = marginalResult.totalBaseCommission;
      marginalBrackets = marginalResult.brackets;
      appliedBaseRate = absBase > 0 ? baseCommission / absBase : ruleSet.defaultBaseRate;
      rateSource = `Marginal Tiers (${marginalResult.brackets.length} brackets applied, effective ${(appliedBaseRate * 100).toFixed(2)}%)`;
      baseFormula = marginalResult.formula;
    } else if (
      (ruleSet.modelType === 'tiered_cumulative' || ruleSet.modelType === 'category_based') &&
      ruleSet.tiers &&
      ruleSet.tiers.length > 0
    ) {
      // Tiered Cumulative Bracket (entire deal qualifies at bracket rate)
      const matchingTier = ruleSet.tiers.find((tier) => {
        const meetsMin = absBase >= tier.minAmount;
        const meetsMax = tier.maxAmount === null || absBase < tier.maxAmount;
        return meetsMin && meetsMax;
      });

      if (matchingTier) {
        appliedBaseRate = matchingTier.rate;
        tierAppliedName = matchingTier.label;
        rateSource = `${matchingTier.label}`;
      }
      baseCommission = absBase * appliedBaseRate;
      baseFormula = `$${absBase.toFixed(2)} × ${(appliedBaseRate * 100).toFixed(1)}% [${rateSource}]`;
    } else {
      // Flat Rate Model
      baseCommission = absBase * appliedBaseRate;
      baseFormula = `$${absBase.toFixed(2)} × ${(appliedBaseRate * 100).toFixed(1)}% [${rateSource}]`;
    }
  }

  // --- Step 2: Category Multipliers & Flat Bonuses ---
  let categoryMultiplier = 1.0;
  let categoryBonus = 0;
  if (productCategory && ruleSet.categoryMultipliers) {
    const catRule = ruleSet.categoryMultipliers.find(
      (c) => c.category.trim().toLowerCase() === productCategory.trim().toLowerCase()
    );
    if (catRule) {
      categoryMultiplier = catRule.multiplier;
      categoryBonus = catRule.bonusFlatAmount || 0;
    }
  }

  // Apply category multiplier to base commission
  baseCommission = baseCommission * categoryMultiplier;

  // --- Step 3: High Ticket Bonus Accelerator ---
  let highTicketBonus = 0;
  if (
    !isRefund &&
    ruleSet.highTicketThreshold > 0 &&
    ruleSet.highTicketBonus > 0 &&
    absBase >= ruleSet.highTicketThreshold
  ) {
    highTicketBonus = ruleSet.highTicketBonus;
  }

  // --- Step 4: Rep Quota / Milestone Bonus ---
  let repBonus = 0;
  const repRule = ruleSet.repOverrides?.find(
    (r) => r.salesRep.trim().toLowerCase() === (salesRep || '').trim().toLowerCase()
  );
  if (!isRefund && repRule?.fixedBonusTarget && repRule?.fixedBonusAmount) {
    if (absBase >= repRule.fixedBonusTarget) {
      repBonus = repRule.fixedBonusAmount;
    }
  }

  // --- Step 5: Refund & Cancellation Handling ---
  let totalCommission = 0;
  let refundAdjustment = 0;
  let formulaDesc = '';

  if (isRefund) {
    if (!ruleSet.includeRefunds || ruleSet.refundPolicy === 'no_deduction') {
      totalCommission = 0;
      refundAdjustment = 0;
      formulaDesc = `Refund ignored based on rule configuration. Commission = $0.00`;
    } else if (ruleSet.refundPolicy === 'flat_penalty') {
      const penalty = ruleSet.refundFlatPenalty || 0;
      totalCommission = -penalty;
      refundAdjustment = -penalty;
      formulaDesc = `Refund flat fee deduction: -$${penalty.toFixed(2)}`;
    } else {
      // Full clawback / proportional deduction
      baseCommission = -(Math.abs(baseCommission));
      refundAdjustment = baseCommission;
      totalCommission = baseCommission; // bonuses not awarded on returns
      formulaDesc = `Refund Clawback: -$${absBase.toFixed(2)} @ ${(appliedBaseRate * 100).toFixed(1)}% × ${categoryMultiplier.toFixed(2)}x = -$${Math.abs(totalCommission).toFixed(2)}`;
    }
  } else {
    totalCommission = baseCommission + categoryBonus + highTicketBonus + repBonus;

    const parts: string[] = [baseFormula];
    if (categoryMultiplier !== 1.0) {
      parts.push(`× Cat Multiplier (${categoryMultiplier.toFixed(2)}x)`);
    }
    if (categoryBonus > 0) {
      parts.push(`+ Cat Bonus ($${categoryBonus.toFixed(2)})`);
    }
    if (highTicketBonus > 0) {
      parts.push(`+ High-Ticket Bonus ($${highTicketBonus.toFixed(2)})`);
    }
    if (repBonus > 0) {
      parts.push(`+ Rep Deal Bonus ($${repBonus.toFixed(2)})`);
    }

    formulaDesc = `${parts.join(' ')} = $${totalCommission.toFixed(2)}`;
  }

  // Clean rounding to 2 decimal places
  baseCommission = Math.round(baseCommission * 100) / 100;
  totalCommission = Math.round(totalCommission * 100) / 100;
  categoryBonus = Math.round(categoryBonus * 100) / 100;
  highTicketBonus = Math.round(highTicketBonus * 100) / 100;
  repBonus = Math.round(repBonus * 100) / 100;
  refundAdjustment = Math.round(refundAdjustment * 100) / 100;

  const effectiveRate = absBase > 0 ? totalCommission / absBase : 0;

  const trace: CalculationTrace = {
    commissionBase,
    appliedBaseRate: Math.round(appliedBaseRate * 10000) / 10000,
    baseCommission,
    tierApplied: tierAppliedName,
    marginalBrackets,
    categoryMultiplierApplied: categoryMultiplier !== 1.0 ? categoryMultiplier : undefined,
    categoryBonus,
    highTicketBonus,
    repBonus,
    refundAdjustment,
    formulaDescription: formulaDesc,
    ruleSetId: ruleSet.id,
    ruleSetName: ruleSet.name,
    modelType: ruleSet.modelType,
  };

  const finalStatus = issues.some((i) => i.severity === 'warning') ? 'has_warnings' : 'valid';

  return {
    rowIndex: record.rowIndex,
    sourceReference,
    normalized: record,
    isValid: true,
    qualification,
    status: finalStatus,
    issues,
    calculation: {
      commissionBase,
      appliedBaseRate: Math.round(appliedBaseRate * 10000) / 10000,
      effectiveRate: Math.round(effectiveRate * 10000) / 10000,
      baseCommission,
      categoryBonus,
      highTicketBonus,
      repBonus,
      refundAdjustment,
      totalCommission,
      ruleSetId: ruleSet.id,
      ruleSetName: ruleSet.name,
      modelType: ruleSet.modelType,
      formulaDescription: formulaDesc,
      trace,
    },
  };
}

/**
 * Deterministic batch calculation across all normalized records.
 */
export function calculateAllRecords(
  records: NormalizedRecord[],
  ruleSet: CommissionRuleSet,
  issuesByRow: Map<number, ValidationIssue[]>
): ProcessedRecord[] {
  return records.map((record) => {
    const rowIssues = issuesByRow.get(record.rowIndex) || [];
    return calculateRecordCommission(record, ruleSet, rowIssues);
  });
}

/**
 * Computes a deterministic checksum/hash of calculation inputs + outputs
 * so audits can verify identical reproduction.
 */
export function generateAuditChecksum(
  records: ProcessedRecord[],
  ruleSet: CommissionRuleSet
): string {
  let hashVal = 0;
  const str =
    `${ruleSet.id}-${ruleSet.defaultBaseRate}-${ruleSet.applyTo}-${ruleSet.modelType}-${records.length}-` +
    records
      .map(
        (r) =>
          `${r.rowIndex}:${r.qualification.isQualified ? 1 : 0}:${r.calculation.totalCommission}`
      )
      .join('|');

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hashVal = (hashVal << 5) - hashVal + char;
    hashVal |= 0; // Convert to 32bit integer
  }
  return `CHK-${Math.abs(hashVal).toString(16).toUpperCase()}-${records.length}R`;
}
