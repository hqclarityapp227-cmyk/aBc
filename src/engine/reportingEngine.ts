import {
  ProcessedRecord,
  ProcessingSummary,
  RepSummary,
  PeriodSummary,
  PeriodRepBreakdown,
  RepPeriodBreakdown,
  CategorySummary,
  ValidationIssue,
  CommissionRuleSet,
} from '../types';
import { generateAuditChecksum, getPeriodKey, getPeriodLabel } from './calculationEngine';

/**
 * Deterministically generates comprehensive reporting rollups:
 * 1. Global totals (Gross, Net, Discounts, Commission, Qualified/Excluded/Refund counts)
 * 2. Totals by Salesperson (including individual deal sizes, bonuses, refunds, quota attainment, and period breakdown)
 * 3. Totals by Reporting Period (monthly/quarterly/annual periods with per-rep distributions)
 * 4. Product category rollups
 * 5. Full audit trail and deterministic checksum
 */
export function generateProcessingSummary(
  processedRecords: ProcessedRecord[],
  ruleSetUsed: CommissionRuleSet,
  allIssues: ValidationIssue[]
): ProcessingSummary {
  let totalRawGrossSales = 0;
  let totalGrossSales = 0;
  let totalNetSales = 0;
  let totalDiscounts = 0;
  let totalCommissionPaid = 0;
  let totalBaseCommission = 0;
  let totalBonuses = 0;
  let totalRefundClawbacks = 0;
  let validRows = 0;
  let warningRows = 0;
  let errorRows = 0;
  let excludedRows = 0;
  let qualifiedRows = 0;

  // Rep tracking map: repName -> RepAccumulator
  const repMap = new Map<
    string,
    {
      salesRep: string;
      dealCount: number;
      validDeals: number;
      qualifiedDeals: number;
      excludedDeals: number;
      refundDeals: number;
      totalGrossSales: number;
      totalNetSales: number;
      totalDiscounts: number;
      totalBaseCommission: number;
      totalBonuses: number;
      totalRefundAdjustments: number;
      totalCommission: number;
      deals: number[];
      highestDeal: number;
      flaggedIssuesCount: number;
      periodBreakdownMap: Map<string, { grossSales: number; netSales: number; commission: number; dealCount: number }>;
    }
  >();

  // Period tracking map: periodKey -> PeriodAccumulator
  const periodMap = new Map<
    string,
    {
      periodKey: string;
      periodLabel: string;
      dates: string[];
      totalDeals: number;
      qualifiedDeals: number;
      excludedDeals: number;
      refundDeals: number;
      totalGrossSales: number;
      totalNetSales: number;
      totalDiscounts: number;
      totalCommission: number;
      repBreakdownMap: Map<string, { grossSales: number; netSales: number; commission: number; dealCount: number }>;
    }
  >();

  // Category tracking map
  const categoryMap = new Map<
    string,
    {
      dealCount: number;
      totalSales: number;
      totalCommission: number;
    }
  >();

  let earliestDate = '';
  let latestDate = '';

  const granularity = ruleSetUsed.reportingPeriod?.granularity || 'all_dates';

  processedRecords.forEach((record) => {
    const { normalized, calculation, status, qualification, issues } = record;
    const isError = qualification.status === 'error';
    const isExcluded = qualification.status === 'excluded';
    const isRefund = normalized.grossAmount < 0;

    // Status counters
    if (isError) {
      errorRows++;
    } else if (isExcluded) {
      excludedRows++;
    } else if (status === 'has_warnings') {
      warningRows++;
      validRows++;
    } else {
      validRows++;
    }

    // Raw gross sales accumulated across all transactions
    totalRawGrossSales += normalized.grossAmount;

    // Global revenue & commission totals (accumulate from all valid/qualified records)
    if (qualification.isQualified && !isError) {
      qualifiedRows++;
      totalGrossSales += normalized.grossAmount;
      totalNetSales += normalized.netAmount;
      totalDiscounts += normalized.discountAmount;
      totalCommissionPaid += calculation.totalCommission;
      totalBaseCommission += calculation.baseCommission;
      totalBonuses += calculation.categoryBonus + calculation.highTicketBonus + calculation.repBonus;
      totalRefundClawbacks += Math.abs(calculation.refundAdjustment);
    }

    // Date range tracking
    if (normalized.date && normalized.isDateValid) {
      if (!earliestDate || normalized.date < earliestDate) earliestDate = normalized.date;
      if (!latestDate || normalized.date > latestDate) latestDate = normalized.date;
    }

    const repName = (normalized.salesRep || '').trim() || 'Unassigned';
    const periodKey = qualification.periodKey || getPeriodKey(normalized.date, granularity);
    const periodLabel = getPeriodLabel(periodKey, granularity);

    // --- 1. Rep Rollups Accumulator ---
    let repData = repMap.get(repName);
    if (!repData) {
      repData = {
        salesRep: repName,
        dealCount: 0,
        validDeals: 0,
        qualifiedDeals: 0,
        excludedDeals: 0,
        refundDeals: 0,
        totalGrossSales: 0,
        totalNetSales: 0,
        totalDiscounts: 0,
        totalBaseCommission: 0,
        totalBonuses: 0,
        totalRefundAdjustments: 0,
        totalCommission: 0,
        deals: [],
        highestDeal: 0,
        flaggedIssuesCount: 0,
        periodBreakdownMap: new Map(),
      };
      repMap.set(repName, repData);
    }

    repData.dealCount++;
    if (issues.length > 0) {
      repData.flaggedIssuesCount += issues.length;
    }

    if (!isError) {
      repData.validDeals++;
      if (isRefund) {
        repData.refundDeals++;
      }

      if (qualification.isQualified) {
        repData.qualifiedDeals++;
        repData.totalGrossSales += normalized.grossAmount;
        repData.totalNetSales += normalized.netAmount;
        repData.totalDiscounts += normalized.discountAmount;
        repData.totalBaseCommission += calculation.baseCommission;
        repData.totalBonuses +=
          calculation.categoryBonus + calculation.highTicketBonus + calculation.repBonus;
        repData.totalRefundAdjustments += calculation.refundAdjustment;
        repData.totalCommission += calculation.totalCommission;
        repData.deals.push(normalized.grossAmount);

        if (normalized.grossAmount > repData.highestDeal) {
          repData.highestDeal = normalized.grossAmount;
        }

        // Rep Period Breakdown sub-map
        const repPeriod = repData.periodBreakdownMap.get(periodKey) || {
          grossSales: 0,
          netSales: 0,
          commission: 0,
          dealCount: 0,
        };
        repPeriod.dealCount++;
        repPeriod.grossSales += normalized.grossAmount;
        repPeriod.netSales += normalized.netAmount;
        repPeriod.commission += calculation.totalCommission;
        repData.periodBreakdownMap.set(periodKey, repPeriod);
      } else {
        repData.excludedDeals++;
      }
    }

    // --- 2. Period Rollups Accumulator ---
    let periodData = periodMap.get(periodKey);
    if (!periodData) {
      periodData = {
        periodKey,
        periodLabel,
        dates: [],
        totalDeals: 0,
        qualifiedDeals: 0,
        excludedDeals: 0,
        refundDeals: 0,
        totalGrossSales: 0,
        totalNetSales: 0,
        totalDiscounts: 0,
        totalCommission: 0,
        repBreakdownMap: new Map(),
      };
      periodMap.set(periodKey, periodData);
    }

    periodData.totalDeals++;
    if (normalized.date) {
      periodData.dates.push(normalized.date);
    }

    if (isRefund) {
      periodData.refundDeals++;
    }

    if (qualification.isQualified && !isError) {
      periodData.qualifiedDeals++;
      periodData.totalGrossSales += normalized.grossAmount;
      periodData.totalNetSales += normalized.netAmount;
      periodData.totalDiscounts += normalized.discountAmount;
      periodData.totalCommission += calculation.totalCommission;

      // Period Rep Breakdown sub-map
      const pRep = periodData.repBreakdownMap.get(repName) || {
        grossSales: 0,
        netSales: 0,
        commission: 0,
        dealCount: 0,
      };
      pRep.dealCount++;
      pRep.grossSales += normalized.grossAmount;
      pRep.netSales += normalized.netAmount;
      pRep.commission += calculation.totalCommission;
      periodData.repBreakdownMap.set(repName, pRep);
    } else {
      periodData.excludedDeals++;
    }

    // --- 3. Category Rollups Accumulator ---
    const category = (normalized.productCategory || '').trim() || 'General';
    let catData = categoryMap.get(category);
    if (!catData) {
      catData = {
        dealCount: 0,
        totalSales: 0,
        totalCommission: 0,
      };
      categoryMap.set(category, catData);
    }

    catData.dealCount++;
    if (qualification.isQualified && !isError) {
      catData.totalSales += normalized.grossAmount;
      catData.totalCommission += calculation.totalCommission;
    }
  });

  // --- Build Final RepSummaries Array ---
  const repSummaries: RepSummary[] = Array.from(repMap.values())
    .map((data) => {
      const avgDeal = data.qualifiedDeals > 0 ? data.totalGrossSales / data.qualifiedDeals : 0;
      const effRate = data.totalGrossSales > 0 ? data.totalCommission / data.totalGrossSales : 0;

      // Find rep rule if configured (for quota attainment)
      const repRule = ruleSetUsed.repOverrides?.find(
        (r) => r.salesRep.trim().toLowerCase() === data.salesRep.toLowerCase()
      );
      const quotaTarget = repRule?.quotaTarget;
      const quotaAttainmentPct =
        quotaTarget && quotaTarget > 0
          ? Math.round((data.totalGrossSales / quotaTarget) * 1000) / 10
          : undefined;

      // Period breakdowns for this rep
      const periodBreakdowns: RepPeriodBreakdown[] = Array.from(
        data.periodBreakdownMap.entries()
      )
        .map(([periodKey, pVal]) => ({
          periodKey,
          grossSales: Math.round(pVal.grossSales * 100) / 100,
          netSales: Math.round(pVal.netSales * 100) / 100,
          commission: Math.round(pVal.commission * 100) / 100,
          dealCount: pVal.dealCount,
        }))
        .sort((a, b) => a.periodKey.localeCompare(b.periodKey));

      return {
        salesRep: data.salesRep,
        dealCount: data.dealCount,
        validDeals: data.validDeals,
        qualifiedDeals: data.qualifiedDeals,
        excludedDeals: data.excludedDeals,
        refundDeals: data.refundDeals,
        totalGrossSales: Math.round(data.totalGrossSales * 100) / 100,
        totalNetSales: Math.round(data.totalNetSales * 100) / 100,
        totalDiscounts: Math.round(data.totalDiscounts * 100) / 100,
        totalBaseCommission: Math.round(data.totalBaseCommission * 100) / 100,
        totalBonuses: Math.round(data.totalBonuses * 100) / 100,
        totalRefundAdjustments: Math.round(data.totalRefundAdjustments * 100) / 100,
        totalCommission: Math.round(data.totalCommission * 100) / 100,
        effectiveCommissionRate: Math.round(effRate * 10000) / 10000,
        averageDealSize: Math.round(avgDeal * 100) / 100,
        highestDeal: Math.round(data.highestDeal * 100) / 100,
        flaggedIssuesCount: data.flaggedIssuesCount,
        quotaTarget,
        quotaAttainmentPct,
        periodBreakdowns,
      };
    })
    .sort((a, b) => b.totalGrossSales - a.totalGrossSales);

  // --- Build Final PeriodSummaries Array ---
  const periodSummaries: PeriodSummary[] = Array.from(periodMap.values())
    .map((p) => {
      const sortedDates = [...p.dates].sort();
      const startDate = sortedDates.length > 0 ? sortedDates[0] : earliestDate || 'N/A';
      const endDate =
        sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : latestDate || 'N/A';
      const effRate = p.totalGrossSales > 0 ? p.totalCommission / p.totalGrossSales : 0;

      const repBreakdowns: PeriodRepBreakdown[] = Array.from(p.repBreakdownMap.entries())
        .map(([salesRep, rVal]) => ({
          salesRep,
          grossSales: Math.round(rVal.grossSales * 100) / 100,
          netSales: Math.round(rVal.netSales * 100) / 100,
          commission: Math.round(rVal.commission * 100) / 100,
          dealCount: rVal.dealCount,
        }))
        .sort((a, b) => b.grossSales - a.grossSales);

      return {
        periodKey: p.periodKey,
        periodLabel: p.periodLabel,
        startDate,
        endDate,
        totalDeals: p.totalDeals,
        qualifiedDeals: p.qualifiedDeals,
        excludedDeals: p.excludedDeals,
        refundDeals: p.refundDeals,
        totalGrossSales: Math.round(p.totalGrossSales * 100) / 100,
        totalNetSales: Math.round(p.totalNetSales * 100) / 100,
        totalDiscounts: Math.round(p.totalDiscounts * 100) / 100,
        totalCommission: Math.round(p.totalCommission * 100) / 100,
        effectiveCommissionRate: Math.round(effRate * 10000) / 10000,
        repBreakdowns,
      };
    })
    .sort((a, b) => a.periodKey.localeCompare(b.periodKey));

  // --- Build Final CategorySummaries Array ---
  const categorySummaries: CategorySummary[] = Array.from(categoryMap.entries())
    .map(([category, data]) => {
      const pct = totalGrossSales > 0 ? (data.totalSales / totalGrossSales) * 100 : 0;
      return {
        category,
        dealCount: data.dealCount,
        totalSales: Math.round(data.totalSales * 100) / 100,
        totalCommission: Math.round(data.totalCommission * 100) / 100,
        percentOfTotalSales: Math.round(pct * 10) / 10,
      };
    })
    .sort((a, b) => b.totalSales - a.totalSales);

  const topRep =
    repSummaries.length > 0
      ? {
          name: repSummaries[0].salesRep,
          sales: repSummaries[0].totalGrossSales,
          commission: repSummaries[0].totalCommission,
        }
      : { name: 'N/A', sales: 0, commission: 0 };

  const avgCommRate = totalGrossSales > 0 ? totalCommissionPaid / totalGrossSales : 0;
  const checksum = generateAuditChecksum(processedRecords, ruleSetUsed);

  return {
    totalRows: processedRecords.length,
    validRows,
    warningRows,
    errorRows,
    excludedRows,
    qualifiedRows,
    totalRawGrossSales: Math.round(totalRawGrossSales * 100) / 100,
    totalGrossSales: Math.round(totalGrossSales * 100) / 100,
    totalQualifyingGrossSales: Math.round(totalGrossSales * 100) / 100,
    totalQualifyingNetSales: Math.round(totalNetSales * 100) / 100,
    totalNetSales: Math.round(totalNetSales * 100) / 100,
    totalDiscounts: Math.round(totalDiscounts * 100) / 100,
    totalCommissionPaid: Math.round(totalCommissionPaid * 100) / 100,
    totalBaseCommission: Math.round(totalBaseCommission * 100) / 100,
    totalBonuses: Math.round(totalBonuses * 100) / 100,
    totalRefundClawbacks: Math.round(totalRefundClawbacks * 100) / 100,
    averageCommissionRate: Math.round(avgCommRate * 10000) / 10000,
    totalReps: repSummaries.length,
    totalCategories: categorySummaries.length,
    totalPeriods: periodSummaries.length,
    topPerformingRep: topRep,
    dateRange: { start: earliestDate || 'N/A', end: latestDate || 'N/A' },
    reportingPeriodConfig: ruleSetUsed.reportingPeriod || {
      granularity: 'all_dates',
      enforcePeriodExclusion: false,
    },
    repSummaries,
    periodSummaries,
    categorySummaries,
    allIssues,
    processedRecords,
    processedAt: new Date().toISOString(),
    ruleSetUsed,
    checksum,
  };
}
