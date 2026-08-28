import ExcelJS from 'exceljs';
import { ProcessingSummary, ExportOptions, CategorySummary } from '../types';

// Theme Color Palette
const COLORS = {
  NAVY_HEADER: 'FF1E293B',    // #1E293B Dark Navy
  SLATE_SUBHEADER: 'FF334155',// #334155 Slate Blue
  CARD_BG: 'FFF1F5F9',        // #F1F5F9 Soft Card Background
  ZEBRA_BG: 'FFF8FAFC',       // #F8FAFC Light Grey / Slate
  WHITE_BG: 'FFFFFFFF',       // #FFFFFF Pure White
  BORDER_MUTED: 'FFCBD5E1',   // #CBD5E1 Thin Muted Border
  TEXT_WHITE: 'FFFFFFFF',     // White
  TEXT_DARK: 'FF0F172A',      // Slate 900
  TEXT_MUTED: 'FF64748B',     // Slate 500
  EMERALD_ACCENT: 'FF059669', // Emerald 600
  RED_ALERT: 'FFE11D48',      // Rose / Red Alert
  AMBER_ALERT: 'FFD97706',    // Amber Alert
};

// Font Family Default
const FONT_FAMILY = 'Segoe UI';

// Active Table Cell Border (Thin Muted #CBD5E1)
const BORDER_CELL: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: COLORS.BORDER_MUTED } },
  bottom: { style: 'thin', color: { argb: COLORS.BORDER_MUTED } },
  left: { style: 'thin', color: { argb: COLORS.BORDER_MUTED } },
  right: { style: 'thin', color: { argb: COLORS.BORDER_MUTED } },
};

// Double-Underline Total Row Border
const BORDER_TOTAL_ROW: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: COLORS.BORDER_MUTED } },
  bottom: { style: 'double', color: { argb: COLORS.BORDER_MUTED } },
  left: { style: 'thin', color: { argb: COLORS.BORDER_MUTED } },
  right: { style: 'thin', color: { argb: COLORS.BORDER_MUTED } },
};

/**
 * Auto-fits all column widths across a worksheet:
 * Width = Math.max(maxLen + 5, 16) so text never gets truncated.
 * Explicitly gives Column A a minimum width of 34 for metric labels on summary/metric sheets.
 */
export function autoFitColumnsWithPadding(
  ws: ExcelJS.Worksheet,
  minWidth = 16,
  minColAWidth = 16,
  maxWidth = 70
) {
  ws.columns.forEach((column, colIdx) => {
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

    const calculatedWidth = Math.min(maxWidth, Math.max(maxLen + 5, minWidth));
    // Col Index is 0-based in array
    if (colIdx === 0 && minColAWidth > calculatedWidth) {
      column.width = minColAWidth;
    } else {
      column.width = calculatedWidth;
    }
  });
}

/**
 * Applies primary table header styling:
 * Dark Navy (#1E293B) background with bold white text (#FFFFFF), row height = 24.
 */
export function styleHeaderRow(row: ExcelJS.Row, colCount?: number) {
  row.height = 24;
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
      size: 10,
      bold: true,
      color: { argb: COLORS.TEXT_WHITE },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'left',
      wrapText: false,
    };
    cell.border = BORDER_CELL;
  }
}

/**
 * Applies section sub-header styling:
 * Slate Blue (#334155) background with white text, row height = 26.
 */
export function styleSectionHeaderRow(row: ExcelJS.Row, colCount: number) {
  row.height = 26;
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.SLATE_SUBHEADER },
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
      indent: 1,
    };
    cell.border = BORDER_CELL;
  }
}

/**
 * Applies zebra striping (#F8FAFC / #FFFFFF), thin muted borders (#CBD5E1),
 * row height = 20, and vertical: 'middle' alignment on all active data cells.
 */
export function styleDataRow(
  row: ExcelJS.Row,
  isEven: boolean,
  colFormats?: Record<number, 'currency' | 'percent' | 'percent_1dec' | 'int' | 'string' | 'date'>,
  colCount?: number
) {
  row.height = 20;
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
    cell.border = BORDER_CELL;
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'left',
    };

    if (colFormats && colFormats[c - 1]) {
      const fmt = colFormats[c - 1];
      if (fmt === 'currency') {
        cell.numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (fmt === 'percent' || fmt === 'percent_1dec') {
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
 * Normalizes and groups categories in title casing (e.g. merge 'Basic' and 'basic'),
 * recalculating totals and revenue shares accurately.
 */
export function groupCategorySummaries(categories: CategorySummary[]): CategorySummary[] {
  const map = new Map<string, { category: string; dealCount: number; totalSales: number; totalCommission: number }>();

  for (const cat of categories) {
    const rawName = (cat.category || 'General').trim();
    const key = rawName.toLowerCase();
    const titleCased = rawName.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());

    if (!map.has(key)) {
      map.set(key, {
        category: titleCased,
        dealCount: cat.dealCount,
        totalSales: cat.totalSales,
        totalCommission: cat.totalCommission,
      });
    } else {
      const existing = map.get(key)!;
      existing.dealCount += cat.dealCount;
      existing.totalSales += cat.totalSales;
      existing.totalCommission += cat.totalCommission;
    }
  }

  const grouped = Array.from(map.values());
  const grandTotalSales = grouped.reduce((sum, c) => sum + c.totalSales, 0);

  return grouped.map((c) => ({
    ...c,
    percentOfTotalSales: grandTotalSales > 0 ? (c.totalSales / grandTotalSales) * 100 : 0,
  }));
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
  // 1. SHEET: Executive Summary (Tab 1)
  // ===========================================================================
  if (exportOpts.includeSummarySheet) {
    const ws = wb.addWorksheet('Summary', {
      views: [{ state: 'frozen', ySplit: 4, showGridLines: true }],
    });

    // Main Title Banner (Height = 38, scoped to Columns A:E)
    const titleRow = ws.addRow(['EXECUTIVE SALES & COMMISSION SUMMARY DELIVERABLE', '', '', '', '']);
    titleRow.height = 38;
    for (let c = 1; c <= 5; c++) {
      const cell = titleRow.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_HEADER } };
      cell.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: COLORS.TEXT_WHITE } };
      cell.border = BORDER_CELL;
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    }
    ws.mergeCells('A1:E1');

    // Meta Header Rows (Height = 20, vertical: middle)
    const metaRow1 = ws.addRow(['Generated On', new Date().toLocaleString(), '', 'Audit Checksum / Hash', summary.checksum]);
    const metaRow2 = ws.addRow(['Reporting Period', `${summary.dateRange.start} to ${summary.dateRange.end}`, '', 'Commission Plan', summary.ruleSetUsed.name]);
    [metaRow1, metaRow2].forEach((r) => {
      r.height = 20;
      r.getCell(1).font = { name: FONT_FAMILY, size: 9, bold: true, color: { argb: COLORS.TEXT_MUTED } };
      r.getCell(2).font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_DARK } };
      r.getCell(4).font = { name: FONT_FAMILY, size: 9, bold: true, color: { argb: COLORS.TEXT_MUTED } };
      r.getCell(5).font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_DARK } };
      for (let c = 1; c <= 5; c++) {
        r.getCell(c).alignment = { vertical: 'middle', horizontal: c === 2 || c === 5 ? 'left' : 'left' };
      }
    });

    ws.addRow([]); // Blank spacer row 4

    // Top 4 Boxed KPI Metric Cards (Soft background #F1F5F9, bold numbers)
    const kpiLabelRow = ws.addRow(['TOTAL GROSS SALES', 'NET ELIGIBLE VOLUME', 'TOTAL COMMISSION PAYOUT', 'TOP PERFORMER', '']);
    kpiLabelRow.height = 20;
    for (let c = 1; c <= 4; c++) {
      const cell = kpiLabelRow.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.CARD_BG } };
      cell.font = { name: FONT_FAMILY, size: 9, bold: true, color: { argb: COLORS.TEXT_MUTED } };
      cell.border = BORDER_CELL;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }

    const netEligibleVolume = summary.totalQualifyingNetSales ?? summary.totalNetSales;
    const topRepText = summary.topPerformingRep?.name ? summary.topPerformingRep.name : 'N/A';
    const kpiValRow = ws.addRow([summary.totalGrossSales, netEligibleVolume, summary.totalCommissionPaid, topRepText, '']);
    kpiValRow.height = 30;
    for (let c = 1; c <= 4; c++) {
      const cell = kpiValRow.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.CARD_BG } };
      cell.font = { name: FONT_FAMILY, size: 13, bold: true, color: { argb: COLORS.TEXT_DARK } };
      cell.border = BORDER_CELL;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (c === 1 || c === 2 || c === 3) {
        cell.numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
      }
    }

    ws.addRow([]); // Blank spacer

    // Section 1: Executive Sales & Commission Summary (Scoped strictly to Columns A:B)
    const s1Header = ws.addRow(['1. EXECUTIVE FINANCIAL TOTALS', '']);
    styleSectionHeaderRow(s1Header, 2);
    ws.mergeCells(`A${s1Header.number}:B${s1Header.number}`);

    const financialMetrics = [
      { label: 'Total Raw Gross Sales', value: summary.totalRawGrossSales ?? summary.totalGrossSales, format: 'currency' },
      { label: 'Total Qualifying Gross Sales', value: summary.totalQualifyingGrossSales ?? summary.totalGrossSales, format: 'currency' },
      { label: 'Total Qualifying Net Sales', value: summary.totalQualifyingNetSales ?? summary.totalNetSales, format: 'currency' },
      { label: 'Total Sales Discounts Granted', value: summary.totalDiscounts, format: 'currency' },
      { label: 'Total Base Commission', value: summary.totalBaseCommission ?? (summary.totalCommissionPaid - (summary.totalBonuses ?? 0)), format: 'currency' },
      { label: 'Total Bonuses & Accelerators', value: summary.totalBonuses ?? 0, format: 'currency' },
      { label: 'Total Refund Clawbacks & Penalties', value: summary.totalRefundClawbacks ?? 0, format: 'currency' },
      { label: 'Total Net Commission Payout', value: summary.totalCommissionPaid, format: 'currency' },
      { label: 'Effective Overall Commission Rate', value: summary.averageCommissionRate, format: 'percent' },
    ];

    financialMetrics.forEach((m, idx) => {
      const row = ws.addRow([m.label, m.value]);
      row.height = 20;
      const c1 = row.getCell(1);
      const c2 = row.getCell(2);
      c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 1 ? COLORS.ZEBRA_BG : COLORS.WHITE_BG } };
      c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 1 ? COLORS.ZEBRA_BG : COLORS.WHITE_BG } };
      c1.font = { name: FONT_FAMILY, size: 10, color: { argb: COLORS.TEXT_DARK } };
      c2.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_DARK } };
      c1.border = BORDER_CELL;
      c2.border = BORDER_CELL;
      c1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      c2.alignment = { vertical: 'middle', horizontal: 'right' };
      if (m.format === 'currency') {
        c2.numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
      } else if (m.format === 'percent') {
        c2.numFmt = '0.0%';
      }
    });

    ws.addRow([]); // Blank spacer

    // Section 2: Operational & Integrity Counters (Scoped to Columns A:B)
    const s2Header = ws.addRow(['2. OPERATIONAL & INTEGRITY COUNTERS', '']);
    styleSectionHeaderRow(s2Header, 2);
    ws.mergeCells(`A${s2Header.number}:B${s2Header.number}`);

    const operationalMetrics = [
      { label: 'Total Processed Transactions', value: summary.totalRows, format: 'int' },
      { label: 'Qualified Transactions', value: summary.qualifiedRows ?? summary.validRows, format: 'int' },
      { label: 'Excluded Transactions', value: summary.excludedRows, format: 'int' },
      { label: 'Flagged / Anomaly Transactions', value: summary.errorRows, format: 'int' },
      { label: 'Active Sales Representatives', value: summary.totalReps, format: 'int' },
    ];

    operationalMetrics.forEach((m, idx) => {
      const row = ws.addRow([m.label, m.value]);
      row.height = 20;
      const c1 = row.getCell(1);
      const c2 = row.getCell(2);
      c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 1 ? COLORS.ZEBRA_BG : COLORS.WHITE_BG } };
      c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 1 ? COLORS.ZEBRA_BG : COLORS.WHITE_BG } };
      c1.font = { name: FONT_FAMILY, size: 10, color: { argb: COLORS.TEXT_DARK } };
      c2.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_DARK } };
      c1.border = BORDER_CELL;
      c2.border = BORDER_CELL;
      c1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      c2.alignment = { vertical: 'middle', horizontal: 'right' };
      c2.numFmt = '#,##0';
    });

    ws.addRow([]); // Blank spacer

    // Section 3: Clean Product Category Rollup Table (Scoped strictly to Columns A:E)
    const s3Header = ws.addRow(['3. PRODUCT CATEGORY PERFORMANCE BREAKDOWN', '', '', '', '']);
    styleSectionHeaderRow(s3Header, 5);
    ws.mergeCells(`A${s3Header.number}:E${s3Header.number}`);

    const catHeadersRow = ws.addRow(['Product Category', 'Deal Count', 'Total Gross Sales', 'Total Commission Paid', 'Revenue Share']);
    styleHeaderRow(catHeadersRow, 5);

    const groupedCategories = groupCategorySummaries(summary.categorySummaries || []);
    const catFormats: Record<number, 'string' | 'int' | 'currency' | 'currency' | 'percent_1dec'> = {
      0: 'string',
      1: 'int',
      2: 'currency',
      3: 'currency',
      4: 'percent_1dec',
    };

    let totalCatDeals = 0;
    let totalCatSales = 0;
    let totalCatCommission = 0;

    groupedCategories.forEach((cat, idx) => {
      totalCatDeals += cat.dealCount;
      totalCatSales += cat.totalSales;
      totalCatCommission += cat.totalCommission;

      const row = ws.addRow([
        cat.category,
        cat.dealCount,
        cat.totalSales,
        cat.totalCommission,
        cat.percentOfTotalSales / 100,
      ]);
      styleDataRow(row, idx % 2 === 1, catFormats as any, 5);
    });

    // Summary Total Row with double underline
    const catTotalRow = ws.addRow([
      'TOTALS',
      totalCatDeals,
      totalCatSales,
      totalCatCommission,
      totalCatSales > 0 ? 1.0 : 0.0,
    ]);
    catTotalRow.height = 22;
    for (let c = 1; c <= 5; c++) {
      const cell = catTotalRow.getCell(c);
      cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_DARK } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.ZEBRA_BG } };
      cell.border = BORDER_TOTAL_ROW;
      cell.alignment = { vertical: 'middle', horizontal: c === 1 ? 'left' : 'right' };
    }
    catTotalRow.getCell(2).numFmt = '#,##0';
    catTotalRow.getCell(3).numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
    catTotalRow.getCell(4).numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
    catTotalRow.getCell(5).numFmt = '0.0%';

    ws.addRow([]); // Blank spacer

    // Section 4: Reporting Period Rollup Table (Scoped strictly to Columns A:H)
    if (summary.periodSummaries && summary.periodSummaries.length > 0) {
      const s4Header = ws.addRow(['4. REPORTING PERIOD REVENUE & COMMISSION ROLLUP', '', '', '', '', '', '', '']);
      styleSectionHeaderRow(s4Header, 8);
      ws.mergeCells(`A${s4Header.number}:H${s4Header.number}`);

      const periodHeadersRow = ws.addRow(['Period Key', 'Period Label', 'Start Date', 'End Date', 'Qualified Deals', 'Gross Sales', 'Commission Payout', 'Effective Rate']);
      styleHeaderRow(periodHeadersRow, 8);

      const periodFormats: Record<number, 'string' | 'string' | 'date' | 'date' | 'int' | 'currency' | 'currency' | 'percent_1dec'> = {
        0: 'string',
        1: 'string',
        2: 'date',
        3: 'date',
        4: 'int',
        5: 'currency',
        6: 'currency',
        7: 'percent_1dec',
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

      const pTotalRow = ws.addRow([
        'TOTALS',
        '',
        '',
        '',
        summary.qualifiedRows ?? summary.validRows,
        summary.totalGrossSales,
        summary.totalCommissionPaid,
        summary.averageCommissionRate,
      ]);
      pTotalRow.height = 22;
      for (let c = 1; c <= 8; c++) {
        const cell = pTotalRow.getCell(c);
        cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_DARK } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.ZEBRA_BG } };
        cell.border = BORDER_TOTAL_ROW;
        cell.alignment = { vertical: 'middle', horizontal: c <= 4 ? 'left' : 'right' };
      }
      pTotalRow.getCell(5).numFmt = '#,##0';
      pTotalRow.getCell(6).numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
      pTotalRow.getCell(7).numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
      pTotalRow.getCell(8).numFmt = '0.0%';
    }

    autoFitColumnsWithPadding(ws, 16, 34);
  }

  // ===========================================================================
  // 2. SHEET: Cleaned Data
  // ===========================================================================
  if (exportOpts.includeCleanedDataSheet) {
    const ws = wb.addWorksheet('Cleaned Data', {
      views: [{ state: 'frozen', ySplit: 4, showGridLines: true }],
    });

    // Sheet Banner (Height = 38)
    const banner = ws.addRow(['CLEANED & NORMALIZED SALES DATASET', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    banner.height = 38;
    for (let c = 1; c <= 14; c++) {
      const cell = banner.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_HEADER } };
      cell.font = { name: FONT_FAMILY, size: 13, bold: true, color: { argb: COLORS.TEXT_WHITE } };
      cell.border = BORDER_CELL;
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    }
    ws.mergeCells('A1:N1');

    const meta = ws.addRow([`Total Source Records: ${summary.totalRows}`, `Generated: ${summary.processedAt}`, '', '', '', '', '', '', '', '', '', '', '', '']);
    meta.height = 20;
    meta.getCell(1).font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_MUTED } };
    for (let c = 1; c <= 14; c++) {
      meta.getCell(c).alignment = { vertical: 'middle', horizontal: 'left' };
    }

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

    const cleanedFormats: Record<number, 'int' | 'string' | 'date' | 'string' | 'string' | 'string' | 'string' | 'currency' | 'currency' | 'currency' | 'percent_1dec' | 'string' | 'int' | 'string'> = {
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
      10: 'percent_1dec',
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

    autoFitColumnsWithPadding(ws, 16, 16);
  }

  // ===========================================================================
  // 3. SHEET: Commission Results (Detailed Audit Ledger)
  // ===========================================================================
  if (exportOpts.includeCommissionResultsSheet) {
    const ws = wb.addWorksheet('Commission Results', {
      views: [{ state: 'frozen', ySplit: 4, showGridLines: true }],
    });

    // Sheet Banner (Height = 38)
    const banner = ws.addRow(['COMMISSION CALCULATION RESULTS & DETAILED AUDIT LEDGER', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    banner.height = 38;
    for (let c = 1; c <= 25; c++) {
      const cell = banner.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_HEADER } };
      cell.font = { name: FONT_FAMILY, size: 13, bold: true, color: { argb: COLORS.TEXT_WHITE } };
      cell.border = BORDER_CELL;
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    }
    ws.mergeCells('A1:Y1');

    const meta = ws.addRow([`Audit Checksum: ${summary.checksum}`, `Commission Plan: ${summary.ruleSetUsed.name}`, `Processed Records: ${summary.totalRows}`]);
    meta.height = 20;
    meta.getCell(1).font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_MUTED } };
    for (let c = 1; c <= 25; c++) {
      meta.getCell(c).alignment = { vertical: 'middle', horizontal: 'left' };
    }

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

    const commFormats: Record<number, 'int' | 'string' | 'date' | 'string' | 'string' | 'string' | 'string' | 'string' | 'string' | 'string' | 'currency' | 'currency' | 'currency' | 'currency' | 'percent_1dec' | 'percent_1dec' | 'currency' | 'currency' | 'currency' | 'currency' | 'currency' | 'currency' | 'string' | 'string' | 'string'> = {
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
      14: 'percent_1dec',
      15: 'percent_1dec',
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

    // Summary Total Row with Double-Underline
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
    totalRow.height = 24;
    for (let c = 1; c <= commHeaders.length; c++) {
      const cell = totalRow.getCell(c);
      cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_DARK } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.ZEBRA_BG } };
      cell.border = BORDER_TOTAL_ROW;
      cell.alignment = { vertical: 'middle', horizontal: c <= 10 ? 'left' : 'right' };
    }
    totalRow.getCell(11).numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
    totalRow.getCell(12).numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
    totalRow.getCell(13).numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
    totalRow.getCell(16).numFmt = '0.0%';
    totalRow.getCell(17).numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
    totalRow.getCell(21).numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
    totalRow.getCell(22).numFmt = '$#,##0.00;($#,##0.00);"$0.00"';

    autoFitColumnsWithPadding(ws, 16, 16);
  }

  // ===========================================================================
  // 4. SHEET: Issues & Anomalies Log
  // ===========================================================================
  if (exportOpts.includeIssuesSheet) {
    const ws = wb.addWorksheet('Issues', {
      views: [{ state: 'frozen', ySplit: 4, showGridLines: true }],
    });

    // Sheet Banner (Height = 38)
    const banner = ws.addRow(['DATA QUALITY, ANOMALIES & AUDIT ISSUES LOG', '', '', '', '', '', '', '', '', '']);
    banner.height = 38;
    for (let c = 1; c <= 10; c++) {
      const cell = banner.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_HEADER } };
      cell.font = { name: FONT_FAMILY, size: 13, bold: true, color: { argb: COLORS.TEXT_WHITE } };
      cell.border = BORDER_CELL;
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    }
    ws.mergeCells('A1:J1');

    const meta = ws.addRow([`Total Validation Issues Detected: ${summary.allIssues.length}`, '', '', '', '', '', '', '', '', '']);
    meta.height = 20;
    meta.getCell(1).font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_MUTED } };
    for (let c = 1; c <= 10; c++) {
      meta.getCell(c).alignment = { vertical: 'middle', horizontal: 'left' };
    }

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

    autoFitColumnsWithPadding(ws, 16, 16);
  }

  // ===========================================================================
  // 5. SHEET: Salesperson Summary
  // ===========================================================================
  if (exportOpts.includeSalespersonSummarySheet) {
    const ws = wb.addWorksheet('Salesperson Summary', {
      views: [{ state: 'frozen', ySplit: 4, showGridLines: true }],
    });

    // Sheet Banner (Height = 38)
    const banner = ws.addRow(['TOTALS BY SALESPERSON (COMMISSION EARNINGS & QUOTAS)', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    banner.height = 38;
    for (let c = 1; c <= 16; c++) {
      const cell = banner.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_HEADER } };
      cell.font = { name: FONT_FAMILY, size: 13, bold: true, color: { argb: COLORS.TEXT_WHITE } };
      cell.border = BORDER_CELL;
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    }
    ws.mergeCells('A1:P1');

    const meta = ws.addRow([`Commission Plan: ${summary.ruleSetUsed.name}`, `Generated: ${summary.processedAt}`]);
    meta.height = 20;
    meta.getCell(1).font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_MUTED } };
    for (let c = 1; c <= 16; c++) {
      meta.getCell(c).alignment = { vertical: 'middle', horizontal: 'left' };
    }

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

    const repFormats: Record<number, 'string' | 'int' | 'int' | 'int' | 'int' | 'currency' | 'currency' | 'currency' | 'currency' | 'currency' | 'currency' | 'percent_1dec' | 'currency' | 'percent_1dec' | 'currency' | 'int'> = {
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
      11: 'percent_1dec',
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

    // Summary Total Row with Double Underline
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
    repTotalRow.height = 24;
    for (let c = 1; c <= repHeaders.length; c++) {
      const cell = repTotalRow.getCell(c);
      cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_DARK } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.ZEBRA_BG } };
      cell.border = BORDER_TOTAL_ROW;
      cell.alignment = { vertical: 'middle', horizontal: c === 1 ? 'left' : 'right' };
    }
    repTotalRow.getCell(2).numFmt = '#,##0';
    repTotalRow.getCell(3).numFmt = '#,##0';
    repTotalRow.getCell(4).numFmt = '#,##0';
    repTotalRow.getCell(5).numFmt = '#,##0';
    repTotalRow.getCell(6).numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
    repTotalRow.getCell(7).numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
    repTotalRow.getCell(8).numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
    repTotalRow.getCell(9).numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
    repTotalRow.getCell(10).numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
    repTotalRow.getCell(11).numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
    repTotalRow.getCell(12).numFmt = '0.0%';
    repTotalRow.getCell(15).numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
    repTotalRow.getCell(16).numFmt = '#,##0';

    autoFitColumnsWithPadding(ws, 16, 24);
  }

  // ===========================================================================
  // 6. SHEET: Period Summary
  // ===========================================================================
  if (exportOpts.includePeriodSummarySheet && summary.periodSummaries && summary.periodSummaries.length > 0) {
    const ws = wb.addWorksheet('Period Summary', {
      views: [{ state: 'frozen', ySplit: 4, showGridLines: true }],
    });

    // Sheet Banner (Height = 38)
    const banner = ws.addRow(['TOTALS BY REPORTING PERIOD (TIMELINE SUMMARY)', '', '', '', '', '', '', '', '', '', '', '', '']);
    banner.height = 38;
    for (let c = 1; c <= 13; c++) {
      const cell = banner.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_HEADER } };
      cell.font = { name: FONT_FAMILY, size: 13, bold: true, color: { argb: COLORS.TEXT_WHITE } };
      cell.border = BORDER_CELL;
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    }
    ws.mergeCells('A1:M1');

    const meta = ws.addRow([`Reporting Granularity: ${summary.ruleSetUsed.reportingPeriod?.granularity || 'all_dates'}`, `Generated: ${summary.processedAt}`]);
    meta.height = 20;
    meta.getCell(1).font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_MUTED } };
    for (let c = 1; c <= 13; c++) {
      meta.getCell(c).alignment = { vertical: 'middle', horizontal: 'left' };
    }

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

    const periodFormats: Record<number, 'string' | 'string' | 'date' | 'date' | 'int' | 'int' | 'int' | 'int' | 'currency' | 'currency' | 'currency' | 'percent_1dec' | 'int'> = {
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
      11: 'percent_1dec',
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

    // Summary Total Row with Double Underline
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
    periodTotalRow.height = 24;
    for (let c = 1; c <= periodHeaders.length; c++) {
      const cell = periodTotalRow.getCell(c);
      cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLORS.TEXT_DARK } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.ZEBRA_BG } };
      cell.border = BORDER_TOTAL_ROW;
      cell.alignment = { vertical: 'middle', horizontal: c <= 4 ? 'left' : 'right' };
    }
    periodTotalRow.getCell(5).numFmt = '#,##0';
    periodTotalRow.getCell(6).numFmt = '#,##0';
    periodTotalRow.getCell(7).numFmt = '#,##0';
    periodTotalRow.getCell(8).numFmt = '#,##0';
    periodTotalRow.getCell(9).numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
    periodTotalRow.getCell(10).numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
    periodTotalRow.getCell(11).numFmt = '$#,##0.00;($#,##0.00);"$0.00"';
    periodTotalRow.getCell(12).numFmt = '0.0%';
    periodTotalRow.getCell(13).numFmt = '#,##0';

    autoFitColumnsWithPadding(ws, 16, 22);
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
