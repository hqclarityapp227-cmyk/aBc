import ExcelJS from 'exceljs';
import { ProcessingSummary, ExportOptions } from '../types';

// Theme Color Palette
const COLORS = {
  NAVY_HEADER: 'FF1E293B',    // #1E293B Dark Navy
  NAVY_SUBHEADER: 'FF334155', // #334155 Slate
  ZEBRA_BG: 'FFF8FAFC',       // #F8FAFC Soft Grey / White
  WHITE_BG: 'FFFFFFFF',       // #FFFFFF Pure White
  BORDER_GREY: 'FFCBD5E1',    // #CBD5E1 Light Grey Border
  BORDER_SUBTLE: 'FFF1F5F9',  // #F1F5F9 Very Light Row Border
  TEXT_WHITE: 'FFFFFFFF',     // White
  TEXT_DARK: 'FF0F172A',      // Slate 900
  TEXT_MUTED: 'FF64748B',     // Slate 500
  EMERALD_ACCENT: 'FF059669', // Emerald 600
  RED_ALERT: 'FFE11D48',      // Rose / Red
  AMBER_ALERT: 'FFD97706',    // Amber
};

// Font Defaults
const FONT_FAMILY = 'Segoe UI';

const BORDER_CARD: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: COLORS.BORDER_GREY } },
  bottom: { style: 'thin', color: { argb: COLORS.BORDER_GREY } },
  left: { style: 'thin', color: { argb: COLORS.BORDER_GREY } },
  right: { style: 'thin', color: { argb: COLORS.BORDER_GREY } },
};

const BORDER_ROW_SUBTLE: Partial<ExcelJS.Borders> = {
  bottom: { style: 'thin', color: { argb: COLORS.BORDER_SUBTLE } },
  left: { style: 'thin', color: { argb: COLORS.BORDER_SUBTLE } },
  right: { style: 'thin', color: { argb: COLORS.BORDER_SUBTLE } },
};

const BORDER_TOTAL_ROW: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: COLORS.BORDER_GREY } },
  bottom: { style: 'double', color: { argb: COLORS.BORDER_GREY } },
  left: { style: 'thin', color: { argb: COLORS.BORDER_GREY } },
  right: { style: 'thin', color: { argb: COLORS.BORDER_GREY } },
};

/**
 * Auto-fits all column widths across a worksheet with +4 character padding
 * to prevent text and numerical truncation.
 */
export function autoFitColumnsWithPadding(ws: ExcelJS.Worksheet, extraPadding = 4, minWidth = 14, maxWidth = 65) {
  ws.columns.forEach((column) => {
    let maxLen = minWidth;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const v = cell.value;
      let cellText = '';
      if (v !== null && v !== undefined) {
        if (typeof v === 'object' && 'text' in v && v.text) {
          cellText = String(v.text);
        } else if (typeof v === 'object' && 'result' in v && v.result !== undefined) {
          cellText = String(v.result);
        } else {
          cellText = String(v);
        }
      }
      if (cellText.length > maxLen) {
        maxLen = cellText.length;
      }
    });
    column.width = Math.min(maxWidth, maxLen + extraPadding);
  });
}

/**
 * Applies header styling (Dark Navy #1E293B with white bold text).
 */
export function styleHeaderRow(row: ExcelJS.Row, colCount?: number) {
  row.height = 28;
  const count = colCount || row.cellCount;
  for (let c = 1; c <= count; c++) {
    const cell = row.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.NAVY_HEADER },
    };
    cell.font = {
      name: FONT_FAMILY,
      size: 11,
      bold: true,
      color: { argb: COLORS.TEXT_WHITE },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'left',
      wrapText: false,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.NAVY_HEADER } },
      bottom: { style: 'medium', color: { argb: COLORS.BORDER_GREY } },
      left: { style: 'thin', color: { argb: COLORS.NAVY_HEADER } },
      right: { style: 'thin', color: { argb: COLORS.NAVY_HEADER } },
    };
  }
}

/**
 * Applies zebra striping (#F8FAFC / #FFFFFF) and cell borders to a data row.
 */
export function styleDataRow(
  row: ExcelJS.Row,
  isEven: boolean,
  colFormats?: Record<number, 'currency' | 'percent' | 'percent_1dec' | 'int' | 'string' | 'date'>,
  colCount?: number
) {
  row.height = 22;
  const bgArgb = isEven ? COLORS.ZEBRA_BG : COLORS.WHITE_BG;
  const count = colCount || row.cellCount;

  for (let c = 1; c <= count; c++) {
    const cell = row.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: bgArgb },
    };
    cell.font = {
      name: FONT_FAMILY,
      size: 10,
      color: { argb: COLORS.TEXT_DARK },
    };
    cell.border = BORDER_ROW_SUBTLE;
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'left',
    };

    if (colFormats && colFormats[c - 1]) {
      const fmt = colFormats[c - 1];
      if (fmt === 'currency') {
        cell.numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (fmt === 'percent') {
        cell.numFmt = '0.00%';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (fmt === 'percent_1dec') {
        cell.numFmt = '0.0%';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (fmt === 'int') {
        cell.numFmt = '#,##0';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (fmt === 'date') {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    }
  }
}

/**
 * Builds the high-end Executive Financial Deliverable Excel Workbook using ExcelJS.
 */
export async function generateExcelWorkbook(
  summary: ProcessingSummary,
  options: Partial<ExportOptions> = {}
): Promise<ExcelJS.Workbook> {
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

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Commission Engine Pro';
  wb.lastModifiedBy = 'Commission Engine Pro';
  wb.created = new Date();
  wb.modified = new Date();

  // ===========================================================================
  // 1. SHEET: Executive Summary
  // ===========================================================================
  if (exportOpts.includeSummarySheet) {
    const ws = wb.addWorksheet('Summary', {
      views: [{ state: 'frozen', ySplit: 5, showGridLines: true }],
    });

    // Top Title & Meta Banner
    const titleRow = ws.addRow(['EXECUTIVE SALES & COMMISSION SUMMARY REPORT']);
    titleRow.height = 32;
    titleRow.getCell(1).font = { name: FONT_FAMILY, size: 16, bold: true, color: { argb: COLORS.TEXT_WHITE } };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_HEADER } };
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws.mergeCells('A1:G1');

    const metaRow1 = ws.addRow(['Generated On', new Date().toLocaleString(), '', 'Audit Checksum / Hash', summary.checksum]);
    const metaRow2 = ws.addRow(['Reporting Period', `${summary.dateRange.start} to ${summary.dateRange.end}`, '', 'Commission Plan', summary.ruleSetUsed.name]);
    [metaRow1, metaRow2].forEach((r) => {
      r.height = 20;
      r.getCell(1).font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_MUTED } };
      r.getCell(2).font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_DARK } };
      r.getCell(4).font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_MUTED } };
      r.getCell(5).font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_DARK } };
    });

    ws.addRow([]); // Blank spacer

    // Function to write a Polished Summary Metric Card Box
    const addMetricCardSection = (sectionTitle: string, cards: Array<{ label: string; value: number | string; format?: 'currency' | 'percent' | 'int' | 'string' }>) => {
      const sectionHeaderRow = ws.addRow([sectionTitle]);
      sectionHeaderRow.height = 24;
      sectionHeaderRow.getCell(1).font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: COLORS.TEXT_WHITE } };
      sectionHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_SUBHEADER } };
      sectionHeaderRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      ws.mergeCells(`A${sectionHeaderRow.number}:G${sectionHeaderRow.number}`);

      cards.forEach((card) => {
        const row = ws.addRow([card.label, card.value]);
        row.height = 22;
        const c1 = row.getCell(1);
        const c2 = row.getCell(2);

        c1.font = { name: FONT_FAMILY, size: 10, color: { argb: COLORS.TEXT_MUTED } };
        c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.ZEBRA_BG } };
        c1.border = BORDER_CARD;
        c1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

        c2.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_DARK } };
        c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.ZEBRA_BG } };
        c2.border = BORDER_CARD;

        if (card.format === 'currency') {
          c2.numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
          c2.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if (card.format === 'percent') {
          c2.numFmt = '0.00%';
          c2.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if (card.format === 'int') {
          c2.numFmt = '#,##0';
          c2.alignment = { vertical: 'middle', horizontal: 'right' };
        } else {
          c2.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });

      ws.addRow([]); // Blank spacer
    };

    // 1. Executive Sales & Revenue
    addMetricCardSection('1. EXECUTIVE SALES & REVENUE TOTALS', [
      { label: 'Total Raw Processed Sales', value: summary.totalRawGrossSales ?? summary.totalGrossSales, format: 'currency' },
      { label: 'Total Qualifying Gross Sales', value: summary.totalQualifyingGrossSales ?? summary.totalGrossSales, format: 'currency' },
      { label: 'Total Qualifying Net Sales', value: summary.totalQualifyingNetSales ?? summary.totalNetSales, format: 'currency' },
      { label: 'Total Sales Discounts Granted', value: summary.totalDiscounts, format: 'currency' },
    ]);

    // 2. Commission Payout Metrics
    addMetricCardSection('2. COMMISSION PAYOUT METRICS', [
      { label: 'Total Net Commission Payout', value: summary.totalCommissionPaid, format: 'currency' },
      { label: 'Total Base Commission', value: summary.totalBaseCommission ?? (summary.totalCommissionPaid - (summary.totalBonuses ?? 0)), format: 'currency' },
      { label: 'Total Bonuses & Accelerators', value: summary.totalBonuses ?? 0, format: 'currency' },
      { label: 'Total Refund Clawbacks & Penalties', value: summary.totalRefundClawbacks ?? 0, format: 'currency' },
      { label: 'Overall Effective Commission Rate', value: summary.averageCommissionRate, format: 'percent' },
    ]);

    // 3. Operational Integrity Counters
    addMetricCardSection('3. OPERATIONAL & DATA INTEGRITY COUNTERS', [
      { label: 'Total Processed Transactions', value: summary.totalRows, format: 'int' },
      { label: 'Qualified Transactions', value: summary.qualifiedRows ?? summary.validRows, format: 'int' },
      { label: 'Excluded Transactions', value: summary.excludedRows, format: 'int' },
      { label: 'Flagged / Anomaly Transactions', value: summary.errorRows, format: 'int' },
      { label: 'Active Sales Representatives', value: summary.totalReps, format: 'int' },
      { label: 'Top Performing Sales Representative', value: `${summary.topPerformingRep?.name || 'N/A'} ($${(summary.topPerformingRep?.sales || 0).toLocaleString()} sales | $${(summary.topPerformingRep?.commission || 0).toLocaleString()} payout)`, format: 'string' },
    ]);

    // 4. Product Category Performance Table
    const catHeaderSection = ws.addRow(['4. PRODUCT CATEGORY PERFORMANCE SUMMARY']);
    catHeaderSection.height = 24;
    catHeaderSection.getCell(1).font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: COLORS.TEXT_WHITE } };
    catHeaderSection.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_SUBHEADER } };
    ws.mergeCells(`A${catHeaderSection.number}:E${catHeaderSection.number}`);

    const catHeadersRow = ws.addRow(['Category Name', 'Deal Count', 'Total Gross Sales', 'Total Commission', 'Revenue Share']);
    styleHeaderRow(catHeadersRow, 5);

    const catFormats: Record<number, 'int' | 'currency' | 'currency' | 'percent_1dec'> = {
      1: 'int',
      2: 'currency',
      3: 'currency',
      4: 'percent_1dec',
    };

    summary.categorySummaries.forEach((cat, idx) => {
      const row = ws.addRow([
        cat.category,
        cat.dealCount,
        cat.totalSales,
        cat.totalCommission,
        cat.percentOfTotalSales / 100,
      ]);
      styleDataRow(row, idx % 2 === 1, catFormats as any, 5);
    });

    ws.addRow([]); // Blank spacer

    // 5. Reporting Period Timeline Rollup Table
    const periodHeaderSection = ws.addRow(['5. REPORTING PERIOD REVENUE & COMMISSION ROLLUP']);
    periodHeaderSection.height = 24;
    periodHeaderSection.getCell(1).font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: COLORS.TEXT_WHITE } };
    periodHeaderSection.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_SUBHEADER } };
    ws.mergeCells(`A${periodHeaderSection.number}:H${periodHeaderSection.number}`);

    const periodHeadersRow = ws.addRow(['Period Key', 'Period Label', 'Start Date', 'End Date', 'Qualified Deals', 'Gross Sales', 'Commission Payout', 'Effective Rate']);
    styleHeaderRow(periodHeadersRow, 8);

    const periodFormats: Record<number, 'string' | 'string' | 'date' | 'date' | 'int' | 'currency' | 'currency' | 'percent'> = {
      0: 'string',
      1: 'string',
      2: 'date',
      3: 'date',
      4: 'int',
      5: 'currency',
      6: 'currency',
      7: 'percent',
    };

    summary.periodSummaries.forEach((p, idx) => {
      const row = ws.addRow([
        p.periodKey,
        p.periodLabel,
        p.startDate,
        p.endDate,
        p.qualifiedDeals,
        p.totalGrossSales,
        p.totalCommission,
        p.effectiveCommissionRate,
      ]);
      styleDataRow(row, idx % 2 === 1, periodFormats as any, 8);
    });

    autoFitColumnsWithPadding(ws, 4, 16);
  }

  // ===========================================================================
  // 2. SHEET: Cleaned Data
  // ===========================================================================
  if (exportOpts.includeCleanedDataSheet) {
    const ws = wb.addWorksheet('Cleaned Data', {
      views: [{ state: 'frozen', ySplit: 4, showGridLines: true }],
    });

    // Sheet Banner
    const banner = ws.addRow(['CLEANED & NORMALIZED SALES DATASET']);
    banner.height = 28;
    banner.getCell(1).font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: COLORS.TEXT_WHITE } };
    banner.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_HEADER } };
    ws.mergeCells('A1:N1');

    const meta = ws.addRow([`Total Source Records: ${summary.totalRows}`, `Generated: ${summary.processedAt}`, '', '', '', '', '', '', '', '', '', '', '', '']);
    meta.height = 18;
    meta.getCell(1).font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_MUTED } };

    ws.addRow([]); // Blank spacer

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

    const headerRow = ws.addRow(cleanedHeaders);
    styleHeaderRow(headerRow, cleanedHeaders.length);

    const cleanedFormats: Record<number, 'int' | 'string' | 'date' | 'string' | 'string' | 'string' | 'string' | 'currency' | 'currency' | 'currency' | 'percent' | 'string' | 'int' | 'string'> = {
      0: 'int',
      1: 'string',
      2: 'date',
      3: 'string',
      4: 'string',
      5: 'string',
      6: 'string',
      7: 'currency',
      8: 'currency',
      9: 'currency',
      10: 'percent',
      11: 'string',
      12: 'int',
      13: 'string',
    };

    summary.processedRecords.forEach((r, idx) => {
      const row = ws.addRow([
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

      styleDataRow(row, idx % 2 === 1, cleanedFormats as any, cleanedHeaders.length);
    });

    autoFitColumnsWithPadding(ws, 4, 12);
  }

  // ===========================================================================
  // 3. SHEET: Commission Results (Audit Ledger)
  // ===========================================================================
  if (exportOpts.includeCommissionResultsSheet) {
    const ws = wb.addWorksheet('Commission Results', {
      views: [{ state: 'frozen', ySplit: 4, showGridLines: true }],
    });

    // Sheet Banner
    const banner = ws.addRow(['COMMISSION CALCULATION RESULTS & DETAILED AUDIT LEDGER']);
    banner.height = 28;
    banner.getCell(1).font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: COLORS.TEXT_WHITE } };
    banner.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_HEADER } };
    ws.mergeCells('A1:Y1');

    const meta = ws.addRow([`Audit Checksum: ${summary.checksum}`, `Commission Plan: ${summary.ruleSetUsed.name}`, `Processed Records: ${summary.totalRows}`]);
    meta.height = 18;
    meta.getCell(1).font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_MUTED } };

    ws.addRow([]); // Blank spacer

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

    const headerRow = ws.addRow(commHeaders);
    styleHeaderRow(headerRow, commHeaders.length);

    const commFormats: Record<number, 'int' | 'string' | 'date' | 'string' | 'string' | 'string' | 'string' | 'string' | 'string' | 'string' | 'currency' | 'currency' | 'currency' | 'currency' | 'percent' | 'percent' | 'currency' | 'currency' | 'currency' | 'currency' | 'currency' | 'currency' | 'string' | 'string' | 'string'> = {
      0: 'int',
      1: 'string',
      2: 'date',
      3: 'string',
      4: 'string',
      5: 'string',
      6: 'string',
      7: 'string',
      8: 'string',
      9: 'string',
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
      22: 'string',
      23: 'string',
      24: 'string',
    };

    summary.processedRecords.forEach((r, idx) => {
      const qual = r.qualification;
      const row = ws.addRow([
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
      ]);

      styleDataRow(row, idx % 2 === 1, commFormats as any, commHeaders.length);
    });

    // Total Summary Row
    const totalRow = ws.addRow([
      'TOTALS',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      summary.totalGrossSales,
      summary.totalDiscounts,
      summary.totalNetSales,
      '',
      '',
      summary.averageCommissionRate,
      summary.totalBaseCommission ?? (summary.totalCommissionPaid - (summary.totalBonuses ?? 0)),
      '',
      '',
      '',
      summary.totalRefundClawbacks ?? 0,
      summary.totalCommissionPaid,
      '',
      '',
      '',
    ]);
    totalRow.height = 26;
    for (let c = 1; c <= commHeaders.length; c++) {
      const cell = totalRow.getCell(c);
      cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_DARK } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.ZEBRA_BG } };
      cell.border = BORDER_TOTAL_ROW;
    }
    totalRow.getCell(11).numFmt = '$#,##0.00';
    totalRow.getCell(12).numFmt = '$#,##0.00';
    totalRow.getCell(13).numFmt = '$#,##0.00';
    totalRow.getCell(16).numFmt = '0.00%';
    totalRow.getCell(17).numFmt = '$#,##0.00';
    totalRow.getCell(21).numFmt = '$#,##0.00';
    totalRow.getCell(22).numFmt = '$#,##0.00';

    autoFitColumnsWithPadding(ws, 4, 14);
  }

  // ===========================================================================
  // 4. SHEET: Issues & Anomalies Log
  // ===========================================================================
  if (exportOpts.includeIssuesSheet) {
    const ws = wb.addWorksheet('Issues', {
      views: [{ state: 'frozen', ySplit: 4, showGridLines: true }],
    });

    // Sheet Banner
    const banner = ws.addRow(['DATA QUALITY, ANOMALIES & AUDIT ISSUES LOG']);
    banner.height = 28;
    banner.getCell(1).font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: COLORS.TEXT_WHITE } };
    banner.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_HEADER } };
    ws.mergeCells('A1:J1');

    const meta = ws.addRow([`Total Validation Issues Detected: ${summary.allIssues.length}`, '', '', '', '', '', '', '', '', '']);
    meta.height = 18;
    meta.getCell(1).font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_MUTED } };

    ws.addRow([]); // Blank spacer

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

    const headerRow = ws.addRow(issueHeaders);
    styleHeaderRow(headerRow, issueHeaders.length);

    const issueFormats: Record<number, 'string' | 'int' | 'string' | 'string' | 'string' | 'string' | 'string' | 'string' | 'string' | 'string'> = {
      0: 'string',
      1: 'int',
      2: 'string',
      3: 'string',
      4: 'string',
      5: 'string',
      6: 'string',
      7: 'string',
      8: 'string',
      9: 'string',
    };

    summary.allIssues.forEach((issue, idx) => {
      const row = ws.addRow([
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

      styleDataRow(row, idx % 2 === 1, issueFormats as any, issueHeaders.length);

      // Accent color for Severity
      const sevCell = row.getCell(6);
      if (issue.severity === 'error') {
        sevCell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.RED_ALERT } };
      } else if (issue.severity === 'warning') {
        sevCell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.AMBER_ALERT } };
      }
    });

    autoFitColumnsWithPadding(ws, 4, 14);
  }

  // ===========================================================================
  // 5. SHEET: Salesperson Summary
  // ===========================================================================
  if (exportOpts.includeSalespersonSummarySheet) {
    const ws = wb.addWorksheet('Salesperson Summary', {
      views: [{ state: 'frozen', ySplit: 4, showGridLines: true }],
    });

    // Sheet Banner
    const banner = ws.addRow(['TOTALS BY SALESPERSON (COMMISSION EARNINGS & QUOTAS)']);
    banner.height = 28;
    banner.getCell(1).font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: COLORS.TEXT_WHITE } };
    banner.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_HEADER } };
    ws.mergeCells('A1:P1');

    const meta = ws.addRow([`Commission Plan: ${summary.ruleSetUsed.name}`, `Generated: ${summary.processedAt}`]);
    meta.height = 18;
    meta.getCell(1).font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_MUTED } };

    ws.addRow([]); // Blank spacer

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

    const headerRow = ws.addRow(repHeaders);
    styleHeaderRow(headerRow, repHeaders.length);

    const repFormats: Record<number, 'string' | 'int' | 'int' | 'int' | 'int' | 'currency' | 'currency' | 'currency' | 'currency' | 'currency' | 'currency' | 'percent' | 'currency' | 'percent_1dec' | 'currency' | 'int'> = {
      0: 'string',
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
    };

    summary.repSummaries.forEach((rep, idx) => {
      const row = ws.addRow([
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

      styleDataRow(row, idx % 2 === 1, repFormats as any, repHeaders.length);
    });

    // Summary Total Row
    const avgDeal = (summary.qualifiedRows ?? summary.validRows) > 0 ? summary.totalGrossSales / (summary.qualifiedRows ?? summary.validRows) : 0;
    const repTotalRow = ws.addRow([
      'TOTALS',
      summary.totalRows,
      summary.qualifiedRows ?? summary.validRows,
      summary.excludedRows,
      summary.repSummaries.reduce((sum, r) => sum + r.refundDeals, 0),
      summary.totalGrossSales,
      summary.totalNetSales,
      summary.totalBaseCommission ?? (summary.totalCommissionPaid - (summary.totalBonuses ?? 0)),
      summary.totalBonuses ?? 0,
      summary.totalRefundClawbacks ?? 0,
      summary.totalCommissionPaid,
      summary.averageCommissionRate,
      '',
      '',
      avgDeal,
      summary.allIssues.length,
    ]);
    repTotalRow.height = 26;
    for (let c = 1; c <= repHeaders.length; c++) {
      const cell = repTotalRow.getCell(c);
      cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_DARK } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.ZEBRA_BG } };
      cell.border = BORDER_TOTAL_ROW;
    }
    repTotalRow.getCell(2).numFmt = '#,##0';
    repTotalRow.getCell(3).numFmt = '#,##0';
    repTotalRow.getCell(4).numFmt = '#,##0';
    repTotalRow.getCell(5).numFmt = '#,##0';
    repTotalRow.getCell(6).numFmt = '$#,##0.00';
    repTotalRow.getCell(7).numFmt = '$#,##0.00';
    repTotalRow.getCell(8).numFmt = '$#,##0.00';
    repTotalRow.getCell(9).numFmt = '$#,##0.00';
    repTotalRow.getCell(10).numFmt = '$#,##0.00';
    repTotalRow.getCell(11).numFmt = '$#,##0.00';
    repTotalRow.getCell(12).numFmt = '0.00%';
    repTotalRow.getCell(15).numFmt = '$#,##0.00';
    repTotalRow.getCell(16).numFmt = '#,##0';

    autoFitColumnsWithPadding(ws, 4, 14);
  }

  // ===========================================================================
  // 6. SHEET: Period Summary
  // ===========================================================================
  if (exportOpts.includePeriodSummarySheet && summary.periodSummaries && summary.periodSummaries.length > 0) {
    const ws = wb.addWorksheet('Period Summary', {
      views: [{ state: 'frozen', ySplit: 4, showGridLines: true }],
    });

    // Sheet Banner
    const banner = ws.addRow(['TOTALS BY REPORTING PERIOD (TIMELINE SUMMARY)']);
    banner.height = 28;
    banner.getCell(1).font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: COLORS.TEXT_WHITE } };
    banner.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_HEADER } };
    ws.mergeCells('A1:M1');

    const meta = ws.addRow([`Reporting Granularity: ${summary.ruleSetUsed.reportingPeriod?.granularity || 'all_dates'}`, `Generated: ${summary.processedAt}`]);
    meta.height = 18;
    meta.getCell(1).font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_MUTED } };

    ws.addRow([]); // Blank spacer

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

    const headerRow = ws.addRow(periodHeaders);
    styleHeaderRow(headerRow, periodHeaders.length);

    const periodFormats: Record<number, 'string' | 'string' | 'date' | 'date' | 'int' | 'int' | 'int' | 'int' | 'currency' | 'currency' | 'currency' | 'percent' | 'int'> = {
      0: 'string',
      1: 'string',
      2: 'date',
      3: 'date',
      4: 'int',
      5: 'int',
      6: 'int',
      7: 'int',
      8: 'currency',
      9: 'currency',
      10: 'currency',
      11: 'percent',
      12: 'int',
    };

    summary.periodSummaries.forEach((p, idx) => {
      const row = ws.addRow([
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

      styleDataRow(row, idx % 2 === 1, periodFormats as any, periodHeaders.length);
    });

    // Summary Total Row
    const periodTotalRow = ws.addRow([
      'TOTALS',
      '',
      '',
      '',
      summary.totalRows,
      summary.qualifiedRows ?? summary.validRows,
      summary.excludedRows,
      summary.periodSummaries.reduce((sum, p) => sum + p.refundDeals, 0),
      summary.totalGrossSales,
      summary.totalNetSales,
      summary.totalCommissionPaid,
      summary.averageCommissionRate,
      summary.totalReps,
    ]);
    periodTotalRow.height = 26;
    for (let c = 1; c <= periodHeaders.length; c++) {
      const cell = periodTotalRow.getCell(c);
      cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_DARK } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.ZEBRA_BG } };
      cell.border = BORDER_TOTAL_ROW;
    }
    periodTotalRow.getCell(5).numFmt = '#,##0';
    periodTotalRow.getCell(6).numFmt = '#,##0';
    periodTotalRow.getCell(7).numFmt = '#,##0';
    periodTotalRow.getCell(8).numFmt = '#,##0';
    periodTotalRow.getCell(9).numFmt = '$#,##0.00';
    periodTotalRow.getCell(10).numFmt = '$#,##0.00';
    periodTotalRow.getCell(11).numFmt = '$#,##0.00';
    periodTotalRow.getCell(12).numFmt = '0.00%';
    periodTotalRow.getCell(13).numFmt = '#,##0';

    autoFitColumnsWithPadding(ws, 4, 14);
  }

  return wb;
}

/**
 * Generates and triggers direct browser download of the finished Excel file.
 */
export async function downloadExcelWorkbook(
  summary: ProcessingSummary,
  fileName = 'Sales_Commission_Report.xlsx',
  options?: Partial<ExportOptions>
): Promise<void> {
  const workbook = await generateExcelWorkbook(summary, options);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
