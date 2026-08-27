import * as XLSX from 'xlsx';
import { ProcessingSummary, ExportOptions } from '../types';

/**
 * Helper to apply cell formatting and autofilters to a SheetJS worksheet.
 */
function applyWorksheetFormatting(
  ws: XLSX.WorkSheet,
  options: {
    headerRowIndex?: number;
    totalRows?: number;
    totalCols?: number;
    colFormats?: Record<number, 'currency' | 'percent' | 'percent_1dec' | 'int' | 'string'>;
    startDataRow?: number;
  }
) {
  const { headerRowIndex, totalRows, totalCols, colFormats, startDataRow = 0 } = options;

  // Apply autofilter if header row and dimensions provided
  if (headerRowIndex !== undefined && totalRows !== undefined && totalCols !== undefined && totalRows > headerRowIndex) {
    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: headerRowIndex, c: 0 },
        e: { r: totalRows - 1, c: totalCols - 1 },
      }),
    };
  }

  // Apply cell number formats
  if (colFormats) {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = startDataRow; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const format = colFormats[C];
        if (!format) continue;

        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellAddress];
        if (!cell || cell.v === null || cell.v === undefined || cell.v === '' || cell.v === 'N/A') continue;

        if (typeof cell.v === 'number') {
          if (format === 'currency') {
            cell.t = 'n';
            cell.z = '$#,##0.00';
          } else if (format === 'percent') {
            cell.t = 'n';
            cell.z = '0.00%';
          } else if (format === 'percent_1dec') {
            cell.t = 'n';
            cell.z = '0.0%';
          } else if (format === 'int') {
            cell.t = 'n';
            cell.z = '#,##0';
          }
        }
      }
    }
  }
}

/**
 * Generates a polished, multi-tab Excel (.xlsx) workbook with sheets for:
 * - Summary
 * - Cleaned Data
 * - Commission Results
 * - Issues
 * - Salesperson Summary
 * - Period Summary
 */
export function generateExcelWorkbook(
  summary: ProcessingSummary,
  options: Partial<ExportOptions> = {}
): XLSX.WorkBook {
  const exportOpts: ExportOptions = {
    includeSummarySheet: options.includeSummarySheet ?? true,
    includeCleanedDataSheet: options.includeCleanedDataSheet ?? true,
    includeCommissionResultsSheet: options.includeCommissionResultsSheet ?? true,
    includeIssuesSheet: options.includeIssuesSheet ?? true,
    includeSalespersonSummarySheet: options.includeSalespersonSummarySheet ?? true,
    includePeriodSummarySheet: options.includePeriodSummarySheet ?? true,
    dateFormat: options.dateFormat ?? 'YYYY-MM-DD',
    currencySymbol: options.currencySymbol ?? '$',
  };

  const wb = XLSX.utils.book_new();

  // ---------------------------------------------------------------------------
  // 1. SHEET: Summary
  // ---------------------------------------------------------------------------
  if (exportOpts.includeSummarySheet) {
    const summaryRows: (string | number)[][] = [
      ['EXECUTIVE SALES & COMMISSION SUMMARY REPORT'],
      ['Generated On', new Date().toLocaleString()],
      ['Reporting Period Window', `${summary.dateRange.start} to ${summary.dateRange.end}`],
      ['Commission Plan Applied', summary.ruleSetUsed.name],
      ['Deterministic Checksum / Audit Hash', summary.checksum],
      [],
      ['1. EXECUTIVE SALES & REVENUE TOTALS', 'METRIC VALUE'],
      ['Total Raw Processed Sales ($)', summary.totalRawGrossSales ?? summary.totalGrossSales],
      ['Total Qualifying Gross Sales ($)', summary.totalQualifyingGrossSales ?? summary.totalGrossSales],
      ['Total Qualifying Net Sales ($)', summary.totalQualifyingNetSales ?? summary.totalNetSales],
      ['Total Sales Discounts ($)', summary.totalDiscounts],
      [],
      ['2. COMMISSION PAYOUT METRICS', 'METRIC VALUE'],
      ['Total Net Commission Payout ($)', summary.totalCommissionPaid],
      ['Total Base Commission ($)', summary.totalBaseCommission ?? (summary.totalCommissionPaid - (summary.totalBonuses ?? 0))],
      ['Total Bonuses & Accelerators ($)', summary.totalBonuses ?? 0],
      ['Total Refund Clawbacks ($)', summary.totalRefundClawbacks ?? 0],
      ['Overall Effective Commission Rate', summary.averageCommissionRate],
      [],
      ['3. OPERATIONAL & DATA INTEGRITY COUNTERS', 'COUNT'],
      ['Total Processed Transactions', summary.totalRows],
      ['Qualified Deals', summary.qualifiedRows ?? summary.validRows],
      ['Excluded Deals', summary.excludedRows],
      ['Transactions with Warnings', summary.warningRows],
      ['Flagged / Invalid Rows', summary.errorRows],
      ['Active Sales Representatives', summary.totalReps],
      ['Product / Service Categories', summary.totalCategories],
      ['Top Performing Sales Representative', `${summary.topPerformingRep?.name || 'N/A'} ($${(summary.topPerformingRep?.sales || 0).toLocaleString()} sales | $${(summary.topPerformingRep?.commission || 0).toLocaleString()} commission)`],
      [],
      ['4. PRODUCT CATEGORY PERFORMANCE SUMMARY'],
      ['Category Name', 'Deal Count', 'Total Sales ($)', 'Total Commission ($)', 'Revenue Share (%)'],
    ];

    const catStartRow = summaryRows.length;
    summary.categorySummaries.forEach((cat) => {
      summaryRows.push([
        cat.category,
        cat.dealCount,
        cat.totalSales,
        cat.totalCommission,
        cat.percentOfTotalSales / 100,
      ]);
    });

    summaryRows.push([]);
    summaryRows.push(['5. REPORTING PERIOD REVENUE & COMMISSION ROLLUP']);
    summaryRows.push(['Reporting Period', 'Period Label', 'Start Date', 'End Date', 'Qualified Deals', 'Total Gross Sales ($)', 'Net Commission ($)', 'Effective Rate (%)']);

    const periodStartRow = summaryRows.length;
    summary.periodSummaries.forEach((p) => {
      summaryRows.push([
        p.periodKey,
        p.periodLabel,
        p.startDate,
        p.endDate,
        p.qualifiedDeals,
        p.totalGrossSales,
        p.totalCommission,
        p.effectiveCommissionRate,
      ]);
    });

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary['!cols'] = [
      { wch: 38 },
      { wch: 26 },
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
      { wch: 22 },
      { wch: 22 },
      { wch: 20 },
    ];

    // Format specific summary sections
    const range = XLSX.utils.decode_range(wsSummary['!ref'] || 'A1');
    for (let R = 6; R <= range.e.r; ++R) {
      // Key metrics numbers (rows 7 to 18)
      if (R >= 7 && R <= 10) {
        const cell = wsSummary[XLSX.utils.encode_cell({ r: R, c: 1 })];
        if (cell && typeof cell.v === 'number') {
          cell.t = 'n';
          cell.z = '$#,##0.00';
        }
      } else if (R >= 13 && R <= 16) {
        const cell = wsSummary[XLSX.utils.encode_cell({ r: R, c: 1 })];
        if (cell && typeof cell.v === 'number') {
          cell.t = 'n';
          cell.z = '$#,##0.00';
        }
      } else if (R === 17) {
        const cell = wsSummary[XLSX.utils.encode_cell({ r: R, c: 1 })];
        if (cell && typeof cell.v === 'number') {
          cell.t = 'n';
          cell.z = '0.00%';
        }
      } else if (R >= 20 && R <= 25) {
        const cell = wsSummary[XLSX.utils.encode_cell({ r: R, c: 1 })];
        if (cell && typeof cell.v === 'number') {
          cell.t = 'n';
          cell.z = '#,##0';
        }
      }
    }

    // Category table cell formatting
    for (let R = catStartRow; R < catStartRow + summary.categorySummaries.length; ++R) {
      const dealCell = wsSummary[XLSX.utils.encode_cell({ r: R, c: 1 })];
      if (dealCell && typeof dealCell.v === 'number') { dealCell.t = 'n'; dealCell.z = '#,##0'; }
      const salesCell = wsSummary[XLSX.utils.encode_cell({ r: R, c: 2 })];
      if (salesCell && typeof salesCell.v === 'number') { salesCell.t = 'n'; salesCell.z = '$#,##0.00'; }
      const commCell = wsSummary[XLSX.utils.encode_cell({ r: R, c: 3 })];
      if (commCell && typeof commCell.v === 'number') { commCell.t = 'n'; commCell.z = '$#,##0.00'; }
      const pctCell = wsSummary[XLSX.utils.encode_cell({ r: R, c: 4 })];
      if (pctCell && typeof pctCell.v === 'number') { pctCell.t = 'n'; pctCell.z = '0.0%'; }
    }

    // Period table cell formatting
    for (let R = periodStartRow; R < periodStartRow + summary.periodSummaries.length; ++R) {
      const dealCell = wsSummary[XLSX.utils.encode_cell({ r: R, c: 4 })];
      if (dealCell && typeof dealCell.v === 'number') { dealCell.t = 'n'; dealCell.z = '#,##0'; }
      const salesCell = wsSummary[XLSX.utils.encode_cell({ r: R, c: 5 })];
      if (salesCell && typeof salesCell.v === 'number') { salesCell.t = 'n'; salesCell.z = '$#,##0.00'; }
      const commCell = wsSummary[XLSX.utils.encode_cell({ r: R, c: 6 })];
      if (commCell && typeof commCell.v === 'number') { commCell.t = 'n'; commCell.z = '$#,##0.00'; }
      const effCell = wsSummary[XLSX.utils.encode_cell({ r: R, c: 7 })];
      if (effCell && typeof effCell.v === 'number') { effCell.t = 'n'; effCell.z = '0.00%'; }
    }

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
  }

  // ---------------------------------------------------------------------------
  // 2. SHEET: Cleaned Data
  // ---------------------------------------------------------------------------
  if (exportOpts.includeCleanedDataSheet) {
    const cleanedHeaders = [
      'Row #',
      'Transaction ID',
      'Date (Standardized)',
      'Sales Representative',
      'Customer',
      'Product Category',
      'Deal Stage',
      'Gross Amount ($)',
      'Discount Amount ($)',
      'Net Amount ($)',
      'Custom Rate (%)',
      'Data Integrity Status',
      'Issues Flagged',
      'Sanitization & Cleaning Notes',
    ];

    const cleanedRows = summary.processedRecords.map((r) => [
      r.rowIndex,
      r.normalized.transactionId || `Row #${r.rowIndex}`,
      r.normalized.date || r.normalized.rawDate,
      r.normalized.salesRep || 'Unassigned',
      r.normalized.customer || '',
      r.normalized.productCategory || 'General',
      r.normalized.dealStage || '',
      r.normalized.grossAmount,
      r.normalized.discountAmount,
      r.normalized.netAmount,
      r.normalized.customRate !== undefined ? r.normalized.customRate : '',
      r.status.toUpperCase(),
      r.issues.length,
      r.normalized.notes || (r.issues.length > 0 ? r.issues.map((i) => i.message).join('; ') : 'Clean'),
    ]);

    const headerRowIndex = 3;
    const wsCleaned = XLSX.utils.aoa_to_sheet([
      ['CLEANED & NORMALIZED SALES DATASET'],
      ['Source File Records Cleaned:', summary.totalRows, 'Generated:', summary.processedAt],
      [],
      cleanedHeaders,
      ...cleanedRows,
    ]);

    wsCleaned['!cols'] = [
      { wch: 8 },   // Row #
      { wch: 18 },  // Transaction ID
      { wch: 18 },  // Date
      { wch: 22 },  // Sales Rep
      { wch: 24 },  // Customer
      { wch: 18 },  // Category
      { wch: 14 },  // Deal Stage
      { wch: 16 },  // Gross Amount
      { wch: 14 },  // Discount
      { wch: 16 },  // Net Amount
      { wch: 16 },  // Custom Rate
      { wch: 18 },  // Integrity Status
      { wch: 14 },  // Issues Flagged
      { wch: 45 },  // Notes
    ];

    applyWorksheetFormatting(wsCleaned, {
      headerRowIndex,
      totalRows: cleanedRows.length + headerRowIndex + 1,
      totalCols: cleanedHeaders.length,
      startDataRow: headerRowIndex + 1,
      colFormats: {
        0: 'int',
        7: 'currency',
        8: 'currency',
        9: 'currency',
        10: 'percent',
        12: 'int',
      },
    });

    XLSX.utils.book_append_sheet(wb, wsCleaned, 'Cleaned Data');
  }

  // ---------------------------------------------------------------------------
  // 3. SHEET: Commission Results
  // ---------------------------------------------------------------------------
  if (exportOpts.includeCommissionResultsSheet) {
    const commHeaders = [
      'Row #',
      'Transaction ID',
      'Date',
      'Reporting Period',
      'Sales Representative',
      'Customer',
      'Product Category',
      'Deal Stage',
      'Qualification Status',
      'Exclusion / Status Reason',
      'Gross Amount ($)',
      'Discount ($)',
      'Net Amount ($)',
      'Commission Base ($)',
      'Applied Base Rate (%)',
      'Effective Rate (%)',
      'Base Commission ($)',
      'Category Bonus ($)',
      'High-Ticket Bonus ($)',
      'Rep Quota Bonus ($)',
      'Refund Adjustment ($)',
      'Total Net Commission ($)',
      'Rule Plan Applied',
      'Formula / Calculation Breakdown',
      'Integrity Status',
    ];

    const commRows = summary.processedRecords.map((r) => {
      const qual = r.qualification;
      return [
        r.rowIndex,
        r.normalized.transactionId || `Row #${r.rowIndex}`,
        r.normalized.date || r.normalized.rawDate,
        qual?.periodKey || 'N/A',
        r.normalized.salesRep || 'Unassigned',
        r.normalized.customer || '',
        r.normalized.productCategory || 'General',
        r.normalized.dealStage || '',
        qual?.status ? qual.status.toUpperCase() : 'QUALIFIED',
        qual?.reasons && qual.reasons.length > 0 ? qual.reasons.join('; ') : 'Qualified transaction',
        r.normalized.grossAmount,
        r.normalized.discountAmount,
        r.normalized.netAmount,
        r.calculation.commissionBase,
        r.calculation.appliedBaseRate,
        r.calculation.effectiveRate,
        r.calculation.baseCommission,
        r.calculation.categoryBonus,
        r.calculation.highTicketBonus,
        r.calculation.repBonus,
        r.calculation.refundAdjustment,
        r.calculation.totalCommission,
        r.calculation.ruleSetName,
        r.calculation.formulaDescription || r.calculation.trace.formulaDescription,
        r.status.toUpperCase(),
      ];
    });

    const headerRowIndex = 3;
    const wsComm = XLSX.utils.aoa_to_sheet([
      ['COMMISSION CALCULATION RESULTS & DETAILED LEDGER'],
      ['Audit Signature / Checksum:', summary.checksum, 'Plan:', summary.ruleSetUsed.name],
      [],
      commHeaders,
      ...commRows,
    ]);

    wsComm['!cols'] = [
      { wch: 8 },   // Row #
      { wch: 18 },  // Transaction ID
      { wch: 13 },  // Date
      { wch: 16 },  // Reporting Period
      { wch: 22 },  // Sales Rep
      { wch: 22 },  // Customer
      { wch: 18 },  // Category
      { wch: 14 },  // Deal Stage
      { wch: 20 },  // Qualification Status
      { wch: 32 },  // Exclusion / Status Reason
      { wch: 16 },  // Gross Amount
      { wch: 14 },  // Discount
      { wch: 16 },  // Net Amount
      { wch: 18 },  // Commission Base
      { wch: 18 },  // Applied Base Rate
      { wch: 16 },  // Effective Rate
      { wch: 18 },  // Base Commission
      { wch: 16 },  // Category Bonus
      { wch: 18 },  // High-Ticket Bonus
      { wch: 18 },  // Rep Quota Bonus
      { wch: 18 },  // Refund Adjustment
      { wch: 22 },  // Total Net Commission
      { wch: 24 },  // Rule Plan
      { wch: 55 },  // Formula
      { wch: 16 },  // Integrity Status
    ];

    applyWorksheetFormatting(wsComm, {
      headerRowIndex,
      totalRows: commRows.length + headerRowIndex + 1,
      totalCols: commHeaders.length,
      startDataRow: headerRowIndex + 1,
      colFormats: {
        0: 'int',
        10: 'currency',
        11: 'currency',
        12: 'currency',
        13: 'currency',
        14: 'percent',
        15: 'percent',
        16: 'currency',
        17: 'currency',
        18: 'currency',
        19: 'currency',
        20: 'currency',
        21: 'currency',
      },
    });

    XLSX.utils.book_append_sheet(wb, wsComm, 'Commission Results');
  }

  // ---------------------------------------------------------------------------
  // 4. SHEET: Issues
  // ---------------------------------------------------------------------------
  if (exportOpts.includeIssuesSheet) {
    const issueHeaders = [
      'Issue ID',
      'Row #',
      'Transaction ID',
      'Sales Representative',
      'Field Name',
      'Severity',
      'Issue Code',
      'Detailed Description',
      'Recommended Remedy / Fix',
      'Original Raw Value',
    ];

    const issueRows = summary.allIssues.map((issue) => [
      issue.id,
      issue.rowIndex,
      issue.transactionId || 'N/A',
      issue.salesRep || 'N/A',
      issue.field,
      issue.severity.toUpperCase(),
      issue.code,
      issue.message,
      issue.suggestedFix || 'Review source file',
      issue.originalValue !== undefined ? String(issue.originalValue) : '',
    ]);

    const headerRowIndex = 3;
    const wsIssues = XLSX.utils.aoa_to_sheet([
      ['DATA QUALITY, ANOMALIES & AUDIT ISSUES LOG'],
      ['Total Validation Issues Detected:', summary.allIssues.length],
      [],
      issueHeaders,
      ...issueRows,
    ]);

    wsIssues['!cols'] = [
      { wch: 18 },  // Issue ID
      { wch: 8 },   // Row #
      { wch: 18 },  // Transaction ID
      { wch: 22 },  // Sales Rep
      { wch: 16 },  // Field
      { wch: 12 },  // Severity
      { wch: 25 },  // Issue Code
      { wch: 45 },  // Description
      { wch: 40 },  // Recommended Remedy
      { wch: 22 },  // Original Value
    ];

    applyWorksheetFormatting(wsIssues, {
      headerRowIndex,
      totalRows: issueRows.length + headerRowIndex + 1,
      totalCols: issueHeaders.length,
      startDataRow: headerRowIndex + 1,
      colFormats: {
        1: 'int',
      },
    });

    XLSX.utils.book_append_sheet(wb, wsIssues, 'Issues');
  }

  // ---------------------------------------------------------------------------
  // 5. SHEET: Salesperson Summary
  // ---------------------------------------------------------------------------
  if (exportOpts.includeSalespersonSummarySheet) {
    const repHeaders = [
      'Sales Representative',
      'Total Deals',
      'Qualified Deals',
      'Excluded Deals',
      'Refund Deals',
      'Total Gross Sales ($)',
      'Qualifying Net Sales ($)',
      'Base Commission ($)',
      'Bonuses & Accelerators ($)',
      'Refund Adjustments ($)',
      'Total Net Commission Payout ($)',
      'Effective Commission Rate (%)',
      'Quota Target ($)',
      'Quota Attainment (%)',
      'Average Deal Size ($)',
      'Flagged Issues Count',
    ];

    const repRows = summary.repSummaries.map((rep) => [
      rep.salesRep,
      rep.dealCount,
      rep.qualifiedDeals,
      rep.excludedDeals,
      rep.refundDeals,
      rep.totalGrossSales,
      rep.totalNetSales,
      rep.totalBaseCommission,
      rep.totalBonuses,
      rep.totalRefundAdjustments,
      rep.totalCommission,
      rep.effectiveCommissionRate,
      rep.quotaTarget !== undefined ? rep.quotaTarget : 'N/A',
      rep.quotaAttainmentPct !== undefined ? rep.quotaAttainmentPct / 100 : 'N/A',
      rep.averageDealSize,
      rep.flaggedIssuesCount,
    ]);

    const headerRowIndex = 3;
    const wsRep = XLSX.utils.aoa_to_sheet([
      ['TOTALS BY SALESPERSON (COMMISSION EARNINGS & QUOTAS)'],
      ['Commission Plan:', summary.ruleSetUsed.name, 'Generated:', summary.processedAt],
      [],
      repHeaders,
      ...repRows,
    ]);

    wsRep['!cols'] = [
      { wch: 26 },  // Sales Rep
      { wch: 12 },  // Total Deals
      { wch: 15 },  // Qualified Deals
      { wch: 15 },  // Excluded Deals
      { wch: 13 },  // Refund Deals
      { wch: 18 },  // Gross Sales
      { wch: 20 },  // Qualifying Net Sales
      { wch: 20 },  // Base Commission
      { wch: 24 },  // Bonuses
      { wch: 20 },  // Refund Adjustments
      { wch: 24 },  // Total Net Payout
      { wch: 22 },  // Effective Rate
      { wch: 16 },  // Quota Target
      { wch: 18 },  // Quota Attainment
      { wch: 18 },  // Average Deal Size
      { wch: 16 },  // Flagged Issues
    ];

    applyWorksheetFormatting(wsRep, {
      headerRowIndex,
      totalRows: repRows.length + headerRowIndex + 1,
      totalCols: repHeaders.length,
      startDataRow: headerRowIndex + 1,
      colFormats: {
        1: 'int',
        2: 'int',
        3: 'int',
        4: 'int',
        5: 'currency',
        6: 'currency',
        7: 'currency',
        8: 'currency',
        9: 'currency',
        10: 'currency',
        11: 'percent',
        12: 'currency',
        13: 'percent_1dec',
        14: 'currency',
        15: 'int',
      },
    });

    XLSX.utils.book_append_sheet(wb, wsRep, 'Salesperson Summary');
  }

  // ---------------------------------------------------------------------------
  // 6. SHEET: Period Summary
  // ---------------------------------------------------------------------------
  if (exportOpts.includePeriodSummarySheet && summary.periodSummaries && summary.periodSummaries.length > 0) {
    const periodHeaders = [
      'Reporting Period Key',
      'Period Label',
      'Start Date',
      'End Date',
      'Total Deals',
      'Qualified Deals',
      'Excluded Deals',
      'Refund Deals',
      'Total Gross Sales ($)',
      'Qualifying Net Sales ($)',
      'Total Commission Payout ($)',
      'Effective Commission Rate (%)',
      'Active Sales Reps Count',
    ];

    const periodRows = summary.periodSummaries.map((p) => [
      p.periodKey,
      p.periodLabel,
      p.startDate,
      p.endDate,
      p.totalDeals,
      p.qualifiedDeals,
      p.excludedDeals,
      p.refundDeals,
      p.totalGrossSales,
      p.totalNetSales,
      p.totalCommission,
      p.effectiveCommissionRate,
      p.repBreakdowns.length,
    ]);

    const headerRowIndex = 3;
    const wsPeriod = XLSX.utils.aoa_to_sheet([
      ['TOTALS BY REPORTING PERIOD (TIMELINE SUMMARY)'],
      ['Reporting Granularity:', summary.ruleSetUsed.reportingPeriod?.granularity || 'all_dates'],
      [],
      periodHeaders,
      ...periodRows,
    ]);

    wsPeriod['!cols'] = [
      { wch: 20 },  // Period Key
      { wch: 22 },  // Period Label
      { wch: 14 },  // Start Date
      { wch: 14 },  // End Date
      { wch: 12 },  // Total Deals
      { wch: 15 },  // Qualified Deals
      { wch: 15 },  // Excluded Deals
      { wch: 13 },  // Refund Deals
      { wch: 18 },  // Total Gross Sales
      { wch: 20 },  // Qualifying Net Sales
      { wch: 22 },  // Total Commission Payout
      { wch: 22 },  // Effective Rate
      { wch: 20 },  // Active Reps
    ];

    applyWorksheetFormatting(wsPeriod, {
      headerRowIndex,
      totalRows: periodRows.length + headerRowIndex + 1,
      totalCols: periodHeaders.length,
      startDataRow: headerRowIndex + 1,
      colFormats: {
        4: 'int',
        5: 'int',
        6: 'int',
        7: 'int',
        8: 'currency',
        9: 'currency',
        10: 'currency',
        11: 'percent',
        12: 'int',
      },
    });

    XLSX.utils.book_append_sheet(wb, wsPeriod, 'Period Summary');
  }

  return wb;
}

/**
 * Generates and triggers direct browser download of the finished Excel file.
 */
export function downloadExcelWorkbook(
  summary: ProcessingSummary,
  fileName = 'Sales_Commission_Report.xlsx',
  options?: Partial<ExportOptions>
): void {
  const workbook = generateExcelWorkbook(summary, options);
  XLSX.writeFile(workbook, fileName);
}

/**
 * Exports processed ledger as a clean CSV string.
 */
export function exportLedgerAsCSV(summary: ProcessingSummary): string {
  const headers = [
    'Row_Number',
    'Transaction_ID',
    'Date',
    'Reporting_Period',
    'Sales_Rep',
    'Customer',
    'Category',
    'Deal_Stage',
    'Qualification_Status',
    'Status_Reason',
    'Gross_Amount',
    'Discount_Amount',
    'Net_Amount',
    'Commission_Base',
    'Applied_Base_Rate_Pct',
    'Effective_Rate_Pct',
    'Base_Commission',
    'Category_Bonus',
    'High_Ticket_Bonus',
    'Rep_Quota_Bonus',
    'Refund_Adjustment',
    'Total_Commission',
    'Integrity_Status',
    'Formula_Breakdown',
  ];

  const rows = summary.processedRecords.map((r) => {
    const qual = r.qualification;
    return [
      r.rowIndex,
      `"${(r.normalized.transactionId || `Row #${r.rowIndex}`).replace(/"/g, '""')}"`,
      `"${r.normalized.date || r.normalized.rawDate}"`,
      `"${qual?.periodKey || ''}"`,
      `"${(r.normalized.salesRep || 'Unassigned').replace(/"/g, '""')}"`,
      `"${(r.normalized.customer || '').replace(/"/g, '""')}"`,
      `"${(r.normalized.productCategory || 'General').replace(/"/g, '""')}"`,
      `"${(r.normalized.dealStage || '').replace(/"/g, '""')}"`,
      `"${qual?.status || 'qualified'}"`,
      `"${(qual?.reasons && qual.reasons.length > 0 ? qual.reasons.join('; ') : 'Qualified').replace(/"/g, '""')}"`,
      r.normalized.grossAmount,
      r.normalized.discountAmount,
      r.normalized.netAmount,
      r.calculation.commissionBase,
      (r.calculation.appliedBaseRate * 100).toFixed(2),
      (r.calculation.effectiveRate * 100).toFixed(2),
      r.calculation.baseCommission,
      r.calculation.categoryBonus,
      r.calculation.highTicketBonus,
      r.calculation.repBonus,
      r.calculation.refundAdjustment,
      r.calculation.totalCommission,
      `"${r.status}"`,
      `"${(r.calculation.formulaDescription || r.calculation.trace.formulaDescription).replace(/"/g, '""')}"`,
    ];
  });

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
