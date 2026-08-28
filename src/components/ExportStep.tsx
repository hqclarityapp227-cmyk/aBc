import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileType,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Layers,
  Settings2,
  RotateCcw,
  Sparkles,
  TableProperties,
} from 'lucide-react';
import { ProcessingSummary, ExportOptions } from '../types';
import { downloadExcelWorkbook, exportLedgerAsCSV } from '../engine/excelGenerator';

interface ExportStepProps {
  summary: ProcessingSummary;
  onBackToReview: () => void;
  onReset: () => void;
  isUnlocked?: boolean;
  onRequirePro: (onSuccess?: () => void) => void;
}

export const ExportStep: React.FC<ExportStepProps> = ({
  summary,
  onBackToReview,
  onReset,
  isUnlocked,
  onRequirePro,
}) => {
  const [options, setOptions] = useState<ExportOptions>({
    includeSummarySheet: true,
    includeCleanedDataSheet: true,
    includeCommissionResultsSheet: true,
    includeIssuesSheet: true,
    includeSalespersonSummarySheet: true,
    includePeriodSummarySheet: true,
    dateFormat: 'YYYY-MM-DD',
    currencySymbol: '$',
  });

  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);

  const executeDownloadXLSX = async () => {
    try {
      setIsGenerating(true);
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `Commission_Report_${timestamp}.xlsx`;
      await downloadExcelWorkbook(summary, fileName, options);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to generate Excel workbook:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadXLSX = () => {
    if (isUnlocked) {
      executeDownloadXLSX();
    } else {
      onRequirePro(executeDownloadXLSX);
    }
  };

  const executeDownloadCSV = () => {
    const csvContent = exportLedgerAsCSV(summary);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Commission_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadCSV = () => {
    if (isUnlocked) {
      executeDownloadCSV();
    } else {
      onRequirePro(executeDownloadCSV);
    }
  };

  const activeSheetsCount = Object.entries(options).filter(
    ([k, v]) => k.startsWith('include') && v === true
  ).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              5. Download Your Spreadsheet
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Export a clean, multi-tab Excel (.xlsx) file ready to share with your team, sales reps, or accountant.
          </p>
        </div>

        <button
          type="button"
          id="btn-restart-workflow"
          onClick={onReset}
          className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Start Over with a New File</span>
        </button>
      </div>

      {downloadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3 text-emerald-900 text-sm animate-in fade-in duration-200 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold">Excel File Downloaded Successfully!</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Your formatted workbook has been saved to your downloads folder.
            </p>
          </div>
        </div>
      )}

      {/* Main Download & Options Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Download Cards & Sheet Architecture */}
        <div className="lg:col-span-2 space-y-6">
          {/* Primary Action Card: XLSX */}
          <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-inner font-bold">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    Download Formatted Excel File (.xlsx)
                  </h3>
                  <p className="text-xs text-emerald-300">
                    Includes {activeSheetsCount} organized sheets with total formulas, dollar formatting, and rep summaries
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Total Deals</span>
                <p className="font-mono font-bold text-white text-sm">{summary.totalRows}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Total Commission</span>
                <p className="font-mono font-bold text-emerald-400 text-sm">
                  ${summary.totalCommissionPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Sales Reps</span>
                <p className="font-mono font-bold text-white text-sm">{summary.totalReps}</p>
              </div>
            </div>

            <button
              type="button"
              id="btn-download-xlsx"
              disabled={isGenerating}
              onClick={handleDownloadXLSX}
              className={`w-full py-3.5 ${
                isUnlocked
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              } font-extrabold text-sm rounded-xl transition shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60`}
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Generating Executive Excel Report...</span>
                </>
              ) : isUnlocked ? (
                <>
                  <Download className="w-5 h-5" />
                  <span>Download Finished Excel Workbook (.xlsx)</span>
                  <span className="text-[10px] bg-slate-950/20 text-slate-950 px-2 py-0.5 rounded-full font-bold ml-1">
                    PRO UNLOCKED
                  </span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Download Excel Workbook (.xlsx)</span>
                  <span className="text-[10px] bg-slate-950 text-emerald-300 px-2 py-0.5 rounded-full font-bold ml-1 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>PRO PASS</span>
                  </span>
                </>
              )}
            </button>
            {!isUnlocked && (
              <p className="text-[11px] text-center text-emerald-300/90">
                Calculations and previewing are 100% free • Requires Pro pass ($19/mo) or license key to export
              </p>
            )}
          </div>

          {/* Worksheets Manifest Preview */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>What's Included in Your Excel File</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className={`p-3 rounded-lg border flex items-center justify-between transition ${options.includeSummarySheet ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/50 border-dashed border-slate-200 opacity-60'}`}>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">Sheet 1: Summary</span>
                    {options.includeSummarySheet && <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">INCLUDED</span>}
                  </div>
                  <p className="text-slate-500 text-[11px]">Overall sales totals, commission payouts, category breakdown, and monthly timeline totals</p>
                </div>
                <span className="font-mono text-[10px] text-slate-500">Overview</span>
              </div>

              <div className={`p-3 rounded-lg border flex items-center justify-between transition ${options.includeCleanedDataSheet ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/50 border-dashed border-slate-200 opacity-60'}`}>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">Sheet 2: Cleaned Data</span>
                    {options.includeCleanedDataSheet && <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">INCLUDED</span>}
                  </div>
                  <p className="text-slate-500 text-[11px]">Cleaned table with uniform dates, sales rep names, and standardized dollar amounts</p>
                </div>
                <span className="font-mono text-[10px] text-slate-500">{summary.processedRecords.length} Rows</span>
              </div>

              <div className={`p-3 rounded-lg border flex items-center justify-between transition ${options.includeCommissionResultsSheet ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/50 border-dashed border-slate-200 opacity-60'}`}>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">Sheet 3: Commission Results</span>
                    {options.includeCommissionResultsSheet && <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">INCLUDED</span>}
                  </div>
                  <p className="text-slate-500 text-[11px]">Line-by-line payout calculations showing rates applied, bonus tiers, and notes</p>
                </div>
                <span className="font-mono text-[10px] text-slate-500">{summary.processedRecords.length} Rows</span>
              </div>

              <div className={`p-3 rounded-lg border flex items-center justify-between transition ${options.includeIssuesSheet ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/50 border-dashed border-slate-200 opacity-60'}`}>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">Sheet 4: Issues & Notes</span>
                    {options.includeIssuesSheet && <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">INCLUDED</span>}
                  </div>
                  <p className="text-slate-500 text-[11px]">List of any rows that had missing reps, refunds, duplicate IDs, or required formatting fixes</p>
                </div>
                <span className="font-mono text-[10px] text-slate-500">{summary.allIssues.length} Items</span>
              </div>

              <div className={`p-3 rounded-lg border flex items-center justify-between transition ${options.includeSalespersonSummarySheet ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/50 border-dashed border-slate-200 opacity-60'}`}>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">Sheet 5: Salesperson Summary</span>
                    {options.includeSalespersonSummarySheet && <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">INCLUDED</span>}
                  </div>
                  <p className="text-slate-500 text-[11px]">Summary for each sales rep with total sales, deal count, and net payout</p>
                </div>
                <span className="font-mono text-[10px] text-slate-500">{summary.repSummaries.length} Reps</span>
              </div>

              <div className={`p-3 rounded-lg border flex items-center justify-between transition ${options.includePeriodSummarySheet ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/50 border-dashed border-slate-200 opacity-60'}`}>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">Sheet 6: Period Summary</span>
                    {options.includePeriodSummarySheet && <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">INCLUDED</span>}
                  </div>
                  <p className="text-slate-500 text-[11px]">Monthly/quarterly summary of sales volume and total commission payouts</p>
                </div>
                <span className="font-mono text-[10px] text-slate-500">{summary.periodSummaries.length} Periods</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sheet Toggles & CSV Export */}
        <div className="space-y-6">
          {/* Sheet Inclusion Options */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Settings2 className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Choose Sheets to Include
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeSummarySheet}
                  onChange={(e) => setOptions({ ...options, includeSummarySheet: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-slate-800">Summary</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeCleanedDataSheet}
                  onChange={(e) => setOptions({ ...options, includeCleanedDataSheet: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-slate-800">Cleaned Data</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeCommissionResultsSheet}
                  onChange={(e) => setOptions({ ...options, includeCommissionResultsSheet: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-slate-800">Commission Results</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeIssuesSheet}
                  onChange={(e) => setOptions({ ...options, includeIssuesSheet: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-slate-800">Issues & Notes</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeSalespersonSummarySheet}
                  onChange={(e) => setOptions({ ...options, includeSalespersonSummarySheet: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-slate-800">Salesperson Summary</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includePeriodSummarySheet}
                  onChange={(e) => setOptions({ ...options, includePeriodSummarySheet: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-slate-800">Period Summary</span>
              </label>
            </div>
          </div>

          {/* Audit Checksum Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Calculation Verification</span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Unique verification code confirming that all calculations are exact and reproducible:
            </p>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 break-all font-bold">
              {summary.checksum}
            </div>
          </div>

          {/* Secondary CSV Export */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
              <FileType className="w-4 h-4 text-blue-600" />
              <span>Download Raw CSV</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Need a simple flat file? Download all calculated results as a CSV spreadsheet.
            </p>
            <button
              type="button"
              id="btn-download-csv"
              onClick={handleDownloadCSV}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-300 transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV File</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          id="btn-back-to-review-tab"
          onClick={onBackToReview}
          className="flex items-center space-x-2 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Results Review</span>
        </button>
      </div>
    </div>
  );
};
