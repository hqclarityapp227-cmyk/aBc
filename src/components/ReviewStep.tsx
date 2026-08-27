import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Users,
  FileSpreadsheet,
  AlertTriangle,
  Download,
  ArrowLeft,
  Search,
  Filter,
  DollarSign,
  Percent,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldCheck,
  TrendingUp,
  Tag,
  Calendar,
  Layers,
  ArrowUpDown,
  FileCheck,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  ProcessingSummary,
  ProcessedRecord,
  ValidationIssue,
  RepSummary,
  PeriodSummary,
} from '../types';
import { RowTraceModal } from './RowTraceModal';
import { downloadExcelWorkbook } from '../engine/excelGenerator';

interface ReviewStepProps {
  summary: ProcessingSummary;
  onBackToRules: () => void;
  onProceedToExport: () => void;
  isUnlocked?: boolean;
  onRequirePro?: (onSuccess?: () => void) => void;
}

type TabType = 'overview' | 'reps' | 'periods' | 'ledger' | 'cleaned' | 'issues';

const CATEGORY_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export const ReviewStep: React.FC<ReviewStepProps> = ({
  summary,
  onBackToRules,
  onProceedToExport,
  isUnlocked,
  onRequirePro,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedRecordForTrace, setSelectedRecordForTrace] = useState<ProcessedRecord | null>(null);

  // Quick download state
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Salesperson View State
  const [repSearch, setRepSearch] = useState('');
  const [repSortField, setRepSortField] = useState<'sales' | 'commission' | 'deals' | 'name' | 'attainment'>('commission');
  const [repSortAsc, setRepSortAsc] = useState(false);
  const [expandedRep, setExpandedRep] = useState<string | null>(null);

  // Period View State
  const [periodSearch, setPeriodSearch] = useState('');
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);

  // Commission Ledger View State
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerRepFilter, setLedgerRepFilter] = useState('all');
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState<'all' | 'valid' | 'has_warnings' | 'invalid'>('all');
  const [ledgerQualFilter, setLedgerQualFilter] = useState<'all' | 'qualified' | 'excluded' | 'refund'>('all');

  // Cleaned Data View State
  const [cleanedSearch, setCleanedSearch] = useState('');
  const [cleanedStatusFilter, setCleanedStatusFilter] = useState<'all' | 'valid' | 'has_warnings' | 'invalid'>('all');

  // Issues Filter State
  const [issuesSeverityFilter, setIssuesSeverityFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [issuesSearch, setIssuesSearch] = useState('');

  // Quick instant download
  const executeQuickDownload = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadExcelWorkbook(summary, `Sales_Commission_Report_${timestamp}.xlsx`);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  const handleQuickDownload = () => {
    if (isUnlocked) {
      executeQuickDownload();
    } else if (onRequirePro) {
      onRequirePro(executeQuickDownload);
    } else {
      executeQuickDownload();
    }
  };

  // Filtered & Sorted Rep Summaries
  const filteredRepSummaries = useMemo(() => {
    let list = summary.repSummaries.filter((r) =>
      r.salesRep.toLowerCase().includes(repSearch.toLowerCase())
    );

    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (repSortField === 'sales') {
        valA = a.totalGrossSales;
        valB = b.totalGrossSales;
      } else if (repSortField === 'commission') {
        valA = a.totalCommission;
        valB = b.totalCommission;
      } else if (repSortField === 'deals') {
        valA = a.dealCount;
        valB = b.dealCount;
      } else if (repSortField === 'attainment') {
        valA = a.quotaAttainmentPct ?? -1;
        valB = b.quotaAttainmentPct ?? -1;
      } else if (repSortField === 'name') {
        return repSortAsc
          ? a.salesRep.localeCompare(b.salesRep)
          : b.salesRep.localeCompare(a.salesRep);
      }
      return repSortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [summary.repSummaries, repSearch, repSortField, repSortAsc]);

  // Filtered Period Summaries
  const filteredPeriodSummaries = useMemo(() => {
    if (!periodSearch.trim()) return summary.periodSummaries;
    const q = periodSearch.toLowerCase();
    return summary.periodSummaries.filter(
      (p) => p.periodKey.toLowerCase().includes(q) || p.periodLabel.toLowerCase().includes(q)
    );
  }, [summary.periodSummaries, periodSearch]);

  // Filtered Ledger Records
  const filteredRecords = useMemo(() => {
    return summary.processedRecords.filter((record) => {
      if (ledgerRepFilter !== 'all' && record.normalized.salesRep !== ledgerRepFilter) {
        return false;
      }
      if (ledgerStatusFilter !== 'all' && record.status !== ledgerStatusFilter) {
        return false;
      }
      if (ledgerQualFilter !== 'all') {
        const qual = record.calculation.qualification;
        if (ledgerQualFilter === 'qualified' && !qual?.isQualified) return false;
        if (ledgerQualFilter === 'excluded' && (qual?.isQualified || qual?.isRefund)) return false;
        if (ledgerQualFilter === 'refund' && !qual?.isRefund) return false;
      }
      if (ledgerSearch.trim() !== '') {
        const query = ledgerSearch.toLowerCase();
        const matchId = (record.normalized.transactionId || '').toLowerCase().includes(query);
        const matchCust = (record.normalized.customer || '').toLowerCase().includes(query);
        const matchNotes = (record.normalized.notes || '').toLowerCase().includes(query);
        const matchCat = (record.normalized.productCategory || '').toLowerCase().includes(query);
        const matchRep = (record.normalized.salesRep || '').toLowerCase().includes(query);
        return matchId || matchCust || matchNotes || matchCat || matchRep;
      }
      return true;
    });
  }, [summary.processedRecords, ledgerRepFilter, ledgerStatusFilter, ledgerQualFilter, ledgerSearch]);

  // Filtered Cleaned Records
  const filteredCleanedRecords = useMemo(() => {
    return summary.processedRecords.filter((record) => {
      if (cleanedStatusFilter !== 'all' && record.status !== cleanedStatusFilter) {
        return false;
      }
      if (cleanedSearch.trim() !== '') {
        const query = cleanedSearch.toLowerCase();
        const matchId = (record.normalized.transactionId || '').toLowerCase().includes(query);
        const matchCust = (record.normalized.customer || '').toLowerCase().includes(query);
        const matchRep = (record.normalized.salesRep || '').toLowerCase().includes(query);
        const matchCat = (record.normalized.productCategory || '').toLowerCase().includes(query);
        return matchId || matchCust || matchRep || matchCat;
      }
      return true;
    });
  }, [summary.processedRecords, cleanedStatusFilter, cleanedSearch]);

  // Filtered Issues List
  const filteredIssues = useMemo(() => {
    return summary.allIssues.filter((issue) => {
      if (issuesSeverityFilter !== 'all' && issue.severity !== issuesSeverityFilter) {
        return false;
      }
      if (issuesSearch.trim() !== '') {
        const q = issuesSearch.toLowerCase();
        const matchCode = issue.code.toLowerCase().includes(q);
        const matchMsg = issue.message.toLowerCase().includes(q);
        const matchRep = (issue.salesRep || '').toLowerCase().includes(q);
        const matchId = (issue.transactionId || '').toLowerCase().includes(q);
        return matchCode || matchMsg || matchRep || matchId;
      }
      return true;
    });
  }, [summary.allIssues, issuesSeverityFilter, issuesSearch]);

  // Rep chart data
  const repChartData = useMemo(() => {
    return summary.repSummaries.slice(0, 10).map((r) => ({
      name: r.salesRep || 'Unassigned',
      'Gross Sales': r.totalGrossSales,
      'Net Commission': r.totalCommission,
    }));
  }, [summary.repSummaries]);

  // Period chart data
  const periodChartData = useMemo(() => {
    return summary.periodSummaries.map((p) => ({
      name: p.periodLabel || p.periodKey,
      'Gross Sales': p.totalGrossSales,
      'Net Commission': p.totalCommission,
    }));
  }, [summary.periodSummaries]);

  // Category chart data
  const categoryChartData = useMemo(() => {
    return summary.categorySummaries.map((c) => ({
      name: c.category,
      value: c.totalSales,
    }));
  }, [summary.categorySummaries]);

  const uniqueReps = useMemo(() => {
    const set = new Set<string>();
    summary.processedRecords.forEach((r) => {
      if (r.normalized.salesRep) set.add(r.normalized.salesRep);
    });
    return Array.from(set).sort();
  }, [summary.processedRecords]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Primary KPIs */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                4. Review Commission Results
              </h1>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Review your total sales, payouts per sales rep, date summaries, and deal breakdowns before downloading your file.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              id="btn-quick-download-xlsx"
              onClick={handleQuickDownload}
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
              title="Download formatted Excel workbook immediately"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Quick Excel Download</span>
            </button>

            <button
              type="button"
              id="btn-proceed-to-export-top"
              onClick={onProceedToExport}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Next: Download Options</span>
            </button>
          </div>
        </div>

        {downloadSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-emerald-900 text-xs animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">Spreadsheet downloaded successfully to your computer!</span>
          </div>
        )}

        {/* 6 Executive KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* KPI 1: Total Raw Sales */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Sales</span>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-lg font-mono font-bold text-slate-900 truncate">
              ${(summary.totalRawGrossSales ?? summary.totalGrossSales).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              Total file sales volume
            </div>
          </div>

          {/* KPI 2: Qualifying Sales */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Eligible Sales</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-lg font-mono font-bold text-emerald-950 truncate">
              ${(summary.totalQualifyingGrossSales ?? summary.totalGrossSales).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-emerald-700 truncate">
              {summary.qualifiedRows ?? summary.validRows} sales qualified
            </div>
          </div>

          {/* KPI 3: Commission Total */}
          <div className="p-4 rounded-xl bg-emerald-900 text-white shadow-xs space-y-1">
            <div className="flex items-center justify-between text-emerald-300">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Payout</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-mono font-extrabold text-white truncate">
              ${summary.totalCommissionPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-emerald-300 truncate">
              Average rate: {(summary.averageCommissionRate * 100).toFixed(2)}%
            </div>
          </div>

          {/* KPI 4: Base vs Bonuses */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Base & Bonuses</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-sm font-mono font-bold text-slate-800 truncate">
              ${(summary.totalBaseCommission ?? summary.totalCommissionPaid).toLocaleString(undefined, { minimumFractionDigits: 0 })} Base
            </div>
            <div className="text-[10px] text-amber-700 font-semibold truncate">
              +${(summary.totalBonuses ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0 })} Bonuses
            </div>
          </div>

          {/* KPI 5: Top Sales Rep */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Top Earner</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {summary.topPerformingRep?.name || 'None'}
            </div>
            <div className="text-[10px] font-mono text-emerald-700 font-semibold truncate">
              ${(summary.topPerformingRep?.commission || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })} commission
            </div>
          </div>

          {/* KPI 6: Data Integrity */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider">File Health</span>
              <AlertCircle className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-lg font-mono font-bold text-slate-900 flex items-center space-x-1.5">
              <span>{summary.allIssues.length}</span>
              <span className="text-xs font-sans text-slate-500">notices</span>
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {summary.errorRows} errors • {summary.warningRows} warnings
            </div>
          </div>
        </div>
      </div>

      {/* Main Review Navigation Tabs */}
      <div className="flex items-center space-x-1 bg-slate-200/80 p-1.5 rounded-xl border border-slate-300 text-xs font-semibold overflow-x-auto">
        <button
          type="button"
          id="tab-overview"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-600" />
          <span>Overview & Charts</span>
        </button>

        <button
          type="button"
          id="tab-salespersons"
          onClick={() => setActiveTab('reps')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
            activeTab === 'reps'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-blue-600" />
          <span>Salesperson Summary ({summary.repSummaries.length})</span>
        </button>

        <button
          type="button"
          id="tab-periods"
          onClick={() => setActiveTab('periods')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
            activeTab === 'periods'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-purple-600" />
          <span>Period Summary ({summary.periodSummaries.length})</span>
        </button>

        <button
          type="button"
          id="tab-ledger"
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
            activeTab === 'ledger'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Commission Results ({summary.processedRecords.length})</span>
        </button>

        <button
          type="button"
          id="tab-cleaned-data"
          onClick={() => setActiveTab('cleaned')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
            activeTab === 'cleaned'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4 text-indigo-600" />
          <span>Cleaned Data</span>
        </button>

        <button
          type="button"
          id="tab-issues"
          onClick={() => setActiveTab('issues')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
            activeTab === 'issues'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Issues & Integrity ({summary.allIssues.length})</span>
        </button>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TAB 1: OVERVIEW & CHARTS */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Sales & Commission by Rep */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Sales & Commission by Salesperson (Top 10)</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">Gross vs Commission</span>
              </div>

              <div className="h-64 w-full text-xs">
                {repChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400">No representative data</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={repChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                      <Tooltip formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, '']} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="Gross Sales" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Net Commission" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: Reporting Period Revenue Trend */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span>Performance Trend by Reporting Period</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">{summary.reportingPeriodConfig.granularity}</span>
              </div>

              <div className="h-64 w-full text-xs">
                {periodChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400">Single or continuous period</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={periodChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                      <Tooltip formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, '']} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Line type="monotone" dataKey="Gross Sales" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Net Commission" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Grid: Category Share & Quotas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Revenue Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 lg:col-span-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Tag className="w-4 h-4 text-amber-600" />
                <span>Product / Category Share</span>
              </h3>

              <div className="h-44 w-full text-xs flex items-center justify-center">
                {categoryChartData.length === 0 ? (
                  <div className="text-slate-400">No category breakdown</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={55}
                        innerRadius={25}
                        paddingAngle={3}
                      >
                        {categoryChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Sales']} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs divide-y divide-slate-100">
                {summary.categorySummaries.map((cat, idx) => (
                  <div key={cat.category} className="flex items-center justify-between pt-1.5">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} />
                      <span className="font-medium text-slate-700 truncate">{cat.category}</span>
                    </div>
                    <div className="text-right font-mono font-semibold text-slate-900 shrink-0">
                      ${cat.totalSales.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">({cat.percentOfTotalSales}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rep Quota Attainment Mini-Table */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Sales Representative Quota Attainment & Payouts</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('reps')}
                  className="text-xs text-emerald-700 font-semibold hover:underline cursor-pointer"
                >
                  View Full Rep Table →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="py-2">Representative</th>
                      <th className="py-2 text-right">Gross Sales</th>
                      <th className="py-2 text-right">Commission Payout</th>
                      <th className="py-2 text-right">Effective %</th>
                      <th className="py-2 text-right">Quota Target</th>
                      <th className="py-2 text-right">Attainment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {summary.repSummaries.slice(0, 6).map((rep) => (
                      <tr key={rep.salesRep} className="hover:bg-slate-50 font-sans">
                        <td className="py-2.5 font-medium text-slate-900">{rep.salesRep}</td>
                        <td className="py-2.5 text-right font-mono">${rep.totalGrossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-emerald-700">${rep.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 text-right font-mono text-slate-600">{(rep.effectiveCommissionRate * 100).toFixed(1)}%</td>
                        <td className="py-2.5 text-right font-mono text-slate-500">{rep.quotaTarget ? `$${rep.quotaTarget.toLocaleString()}` : '—'}</td>
                        <td className="py-2.5 text-right">
                          {rep.quotaAttainmentPct !== undefined ? (
                            <div className="flex items-center justify-end space-x-2">
                              <span className={`font-mono text-xs font-bold ${rep.quotaAttainmentPct >= 100 ? 'text-emerald-700' : 'text-slate-700'}`}>
                                {rep.quotaAttainmentPct.toFixed(1)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono text-[10px]">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 2: SALESPERSON SUMMARY */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'reps' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Salesperson Commission Rollup Summary</span>
              </h3>
              <p className="text-xs text-slate-500">
                Detailed rep earnings, qualifying deal counts, base commissions, accelerators, clawbacks, and quota progress.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search reps..."
                  value={repSearch}
                  onChange={(e) => setRepSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs w-44 focus:bg-white focus:outline-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => {
                    if (repSortField === 'commission') setRepSortAsc(!repSortAsc);
                    else { setRepSortField('commission'); setRepSortAsc(false); }
                  }}
                  className={`px-2 py-1 rounded font-medium transition ${repSortField === 'commission' ? 'bg-white font-bold shadow-xs text-slate-900' : 'text-slate-600'}`}
                >
                  Sort by Payout
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (repSortField === 'sales') setRepSortAsc(!repSortAsc);
                    else { setRepSortField('sales'); setRepSortAsc(false); }
                  }}
                  className={`px-2 py-1 rounded font-medium transition ${repSortField === 'sales' ? 'bg-white font-bold shadow-xs text-slate-900' : 'text-slate-600'}`}
                >
                  Sort by Sales
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3 py-2.5">Representative</th>
                  <th className="px-3 py-2.5 text-center">Deals (Q / Ex / Ref)</th>
                  <th className="px-3 py-2.5 text-right">Gross Sales ($)</th>
                  <th className="px-3 py-2.5 text-right">Qualifying Net ($)</th>
                  <th className="px-3 py-2.5 text-right">Base Comm ($)</th>
                  <th className="px-3 py-2.5 text-right">Bonuses ($)</th>
                  <th className="px-3 py-2.5 text-right">Clawbacks ($)</th>
                  <th className="px-3 py-2.5 text-right font-bold text-emerald-800">Net Payout ($)</th>
                  <th className="px-3 py-2.5 text-right">Effective Rate</th>
                  <th className="px-3 py-2.5 text-right">Quota Target</th>
                  <th className="px-3 py-2.5 text-right">Attainment</th>
                  <th className="px-3 py-2.5 text-center">Timeline Drilldown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {filteredRepSummaries.map((rep) => {
                  const isExpanded = expandedRep === rep.salesRep;
                  return (
                    <React.Fragment key={rep.salesRep}>
                      <tr className="hover:bg-slate-50/80 font-sans transition">
                        <td className="px-3 py-2.5 font-bold text-slate-900">
                          {rep.salesRep}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono">
                          <span className="text-emerald-700 font-bold">{rep.qualifiedDeals}</span>
                          <span className="text-slate-400"> / </span>
                          <span className="text-slate-500">{rep.excludedDeals}</span>
                          <span className="text-slate-400"> / </span>
                          <span className="text-rose-600">{rep.refundDeals}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono">${rep.totalGrossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-medium text-slate-900">${rep.totalNetSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-slate-700">${rep.totalBaseCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-amber-600">
                          {rep.totalBonuses > 0 ? `+$${rep.totalBonuses.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$0.00'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-rose-600">
                          {rep.totalRefundAdjustments < 0 ? `-$${Math.abs(rep.totalRefundAdjustments).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$0.00'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-extrabold text-emerald-700 text-xs">
                          ${rep.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-slate-600">
                          {(rep.effectiveCommissionRate * 100).toFixed(2)}%
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-slate-500">
                          {rep.quotaTarget ? `$${rep.quotaTarget.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {rep.quotaAttainmentPct !== undefined ? (
                            <span className={`font-mono text-xs font-bold ${rep.quotaAttainmentPct >= 100 ? 'text-emerald-700' : 'text-slate-700'}`}>
                              {rep.quotaAttainmentPct.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[10px]">N/A</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {rep.periodBreakdowns && rep.periodBreakdowns.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setExpandedRep(isExpanded ? null : rep.salesRep)}
                              className="inline-flex items-center space-x-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold transition cursor-pointer"
                            >
                              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              <span>{rep.periodBreakdowns.length} Periods</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10px]">1 Period</span>
                          )}
                        </td>
                      </tr>

                      {/* Sub-table: Period breakdown for this rep */}
                      {isExpanded && rep.periodBreakdowns && (
                        <tr className="bg-slate-50/90 font-sans">
                          <td colSpan={12} className="px-6 py-3 border-y border-slate-200">
                            <div className="space-y-2">
                              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                                Period-by-Period Performance for {rep.salesRep}:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                                {rep.periodBreakdowns.map((p) => (
                                  <div key={p.periodKey} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                                    <div className="font-bold text-slate-900">{p.periodKey}</div>
                                    <div className="flex justify-between text-slate-600 font-mono text-[11px]">
                                      <span>Sales ({p.dealCount} deals):</span>
                                      <span className="font-medium">${p.grossSales.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-700 font-mono text-[11px]">
                                      <span>Commission:</span>
                                      <span className="font-bold">${p.commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 3: PERIOD SUMMARY */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'periods' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>Reporting Period Timeline Summary</span>
              </h3>
              <p className="text-xs text-slate-500">
                Aggregated sales and commission totals across each reporting period window.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search periods..."
                value={periodSearch}
                onChange={(e) => setPeriodSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs w-44 focus:bg-white focus:outline-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3 py-2.5">Period Key</th>
                  <th className="px-3 py-2.5">Period Label</th>
                  <th className="px-3 py-2.5">Start Date</th>
                  <th className="px-3 py-2.5">End Date</th>
                  <th className="px-3 py-2.5 text-center">Deals (Q / Ex / Ref)</th>
                  <th className="px-3 py-2.5 text-right">Gross Sales ($)</th>
                  <th className="px-3 py-2.5 text-right">Qualifying Net ($)</th>
                  <th className="px-3 py-2.5 text-right font-bold text-emerald-800">Commission Payout ($)</th>
                  <th className="px-3 py-2.5 text-right">Effective Rate</th>
                  <th className="px-3 py-2.5 text-center">Active Reps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {filteredPeriodSummaries.map((p) => {
                  const isExpanded = expandedPeriod === p.periodKey;
                  return (
                    <React.Fragment key={p.periodKey}>
                      <tr className="hover:bg-slate-50/80 font-sans transition">
                        <td className="px-3 py-2.5 font-bold font-mono text-slate-900">{p.periodKey}</td>
                        <td className="px-3 py-2.5 font-medium text-slate-800">{p.periodLabel}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-600">{p.startDate}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-600">{p.endDate}</td>
                        <td className="px-3 py-2.5 text-center font-mono">
                          <span className="text-emerald-700 font-bold">{p.qualifiedDeals}</span>
                          <span className="text-slate-400"> / </span>
                          <span className="text-slate-500">{p.excludedDeals}</span>
                          <span className="text-slate-400"> / </span>
                          <span className="text-rose-600">{p.refundDeals}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono">${p.totalGrossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-medium text-slate-900">${p.totalNetSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-extrabold text-emerald-700 text-xs">
                          ${p.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-slate-600">
                          {(p.effectiveCommissionRate * 100).toFixed(2)}%
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => setExpandedPeriod(isExpanded ? null : p.periodKey)}
                            className="inline-flex items-center space-x-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold transition cursor-pointer"
                          >
                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            <span>{p.repBreakdowns.length} Reps</span>
                          </button>
                        </td>
                      </tr>

                      {/* Sub-table: Rep breakdown for this period */}
                      {isExpanded && p.repBreakdowns && (
                        <tr className="bg-slate-50/90 font-sans">
                          <td colSpan={10} className="px-6 py-3 border-y border-slate-200">
                            <div className="space-y-2">
                              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                                Rep Contributions for {p.periodLabel}:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {p.repBreakdowns.map((r) => (
                                  <div key={r.salesRep} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                                    <div className="font-bold text-slate-900">{r.salesRep}</div>
                                    <div className="flex justify-between text-slate-600 font-mono text-[11px]">
                                      <span>Sales ({r.dealCount} deals):</span>
                                      <span>${r.grossSales.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-700 font-mono text-[11px]">
                                      <span>Commission:</span>
                                      <span className="font-bold">${r.commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 4: COMMISSION RESULTS (TRANSACTIONAL LEDGER) */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Commission Results & Calculation Ledger</span>
              </h3>
              <p className="text-xs text-slate-500">
                Detailed transaction records with qualifications, applied base rates, accelerators, clawbacks, and exact trace formulas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ID, customer, rep..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs w-48 focus:bg-white focus:outline-emerald-500"
                />
              </div>

              {/* Rep Filter */}
              <select
                value={ledgerRepFilter}
                onChange={(e) => setLedgerRepFilter(e.target.value)}
                aria-label="Filter by sales representative"
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 font-medium focus:bg-white focus:outline-emerald-500"
              >
                <option value="all">All Sales Reps</option>
                {uniqueReps.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {/* Qual Filter */}
              <select
                value={ledgerQualFilter}
                onChange={(e) => setLedgerQualFilter(e.target.value as any)}
                aria-label="Filter by qualification status"
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 font-medium focus:bg-white focus:outline-emerald-500"
              >
                <option value="all">All Qualifications</option>
                <option value="qualified">Qualified Deals</option>
                <option value="excluded">Excluded Deals</option>
                <option value="refund">Refund Items</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[520px]">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3 py-2.5 w-12 text-center">Row</th>
                  <th className="px-3 py-2.5">Qualification</th>
                  <th className="px-3 py-2.5">Order ID</th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Rep</th>
                  <th className="px-3 py-2.5">Customer</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5 text-right">Gross ($)</th>
                  <th className="px-3 py-2.5 text-right">Net ($)</th>
                  <th className="px-3 py-2.5 text-right">Rate</th>
                  <th className="px-3 py-2.5 text-right">Base Comm ($)</th>
                  <th className="px-3 py-2.5 text-right">Bonuses ($)</th>
                  <th className="px-3 py-2.5 text-right font-bold text-emerald-800">Total Comm ($)</th>
                  <th className="px-3 py-2.5 text-center">Trace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {filteredRecords.map((r) => {
                  const qual = r.calculation.qualification;
                  const totalBonuses = r.calculation.categoryBonus + r.calculation.highTicketBonus + r.calculation.repQuotaBonus;
                  return (
                    <tr key={r.rowIndex} className="hover:bg-slate-50 font-sans">
                      <td className="px-3 py-2 text-center text-slate-400 font-mono">
                        #{r.rowIndex}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${
                            qual?.isQualified
                              ? 'bg-emerald-100 text-emerald-800'
                              : qual?.isRefund
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                          title={qual?.reasons?.join(', ')}
                        >
                          {qual?.status || (r.status === 'valid' ? 'Qualified' : r.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono font-semibold text-slate-800">
                        {r.normalized.transactionId || '-'}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-600 whitespace-nowrap">
                        {r.normalized.date || r.normalized.rawDate || '-'}
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {r.normalized.salesRep || <span className="text-rose-600 font-bold">Unassigned</span>}
                      </td>
                      <td className="px-3 py-2 text-slate-700 max-w-[120px] truncate" title={r.normalized.customer}>
                        {r.normalized.customer || '-'}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {r.normalized.productCategory}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        ${r.normalized.grossAmount.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-medium text-slate-900">
                        ${r.normalized.netAmount.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-600">
                        {(r.calculation.effectiveRate * 100).toFixed(1)}%
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-700">
                        ${r.calculation.baseCommission.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-amber-600">
                        {totalBonuses > 0 ? `+$${totalBonuses.toFixed(2)}` : '$0.00'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700 text-xs">
                        ${r.calculation.totalCommission.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedRecordForTrace(r)}
                          className="inline-flex items-center space-x-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-medium transition cursor-pointer"
                          title="View mathematical audit trace"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 5: CLEANED DATA */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'cleaned' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <span>Cleaned & Standardized Dataset</span>
              </h3>
              <p className="text-xs text-slate-500">
                Inspection view of the sanitized fields, parsed ISO dates, standardized reps, and cleaned amounts before rules evaluation.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search cleaned data..."
                  value={cleanedSearch}
                  onChange={(e) => setCleanedSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs w-48 focus:bg-white focus:outline-emerald-500"
                />
              </div>

              <select
                value={cleanedStatusFilter}
                onChange={(e) => setCleanedStatusFilter(e.target.value as any)}
                aria-label="Filter by data integrity status"
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 font-medium focus:bg-white focus:outline-emerald-500"
              >
                <option value="all">All Data Statuses</option>
                <option value="valid">Valid Rows</option>
                <option value="has_warnings">Rows with Warnings</option>
                <option value="invalid">Invalid Rows</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[520px]">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3 py-2.5 w-12 text-center">Row</th>
                  <th className="px-3 py-2.5">Standardized ID</th>
                  <th className="px-3 py-2.5">Clean Date (YYYY-MM-DD)</th>
                  <th className="px-3 py-2.5">Sales Rep</th>
                  <th className="px-3 py-2.5">Customer</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5">Deal Stage</th>
                  <th className="px-3 py-2.5 text-right">Gross ($)</th>
                  <th className="px-3 py-2.5 text-right">Discount ($)</th>
                  <th className="px-3 py-2.5 text-right">Net ($)</th>
                  <th className="px-3 py-2.5 text-right">Custom Rate</th>
                  <th className="px-3 py-2.5 text-center">Integrity</th>
                  <th className="px-3 py-2.5">Sanitization Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {filteredCleanedRecords.map((r) => (
                  <tr key={r.rowIndex} className="hover:bg-slate-50 font-sans">
                    <td className="px-3 py-2 text-center text-slate-400 font-mono">#{r.rowIndex}</td>
                    <td className="px-3 py-2 font-mono font-semibold text-slate-800">{r.normalized.transactionId || '-'}</td>
                    <td className="px-3 py-2 font-mono text-slate-600 whitespace-nowrap">{r.normalized.date || r.normalized.rawDate || '-'}</td>
                    <td className="px-3 py-2 font-medium text-slate-900">{r.normalized.salesRep || <span className="text-rose-600 font-bold">Unassigned</span>}</td>
                    <td className="px-3 py-2 text-slate-700 max-w-[120px] truncate">{r.normalized.customer || '-'}</td>
                    <td className="px-3 py-2 text-slate-600">{r.normalized.productCategory}</td>
                    <td className="px-3 py-2 text-slate-600">{r.normalized.dealStage || '-'}</td>
                    <td className="px-3 py-2 text-right font-mono">${r.normalized.grossAmount.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-500">${r.normalized.discountAmount.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono font-medium text-slate-900">${r.normalized.netAmount.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-600">
                      {r.normalized.customRate !== undefined ? `${(r.normalized.customRate * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${
                        r.status === 'valid' ? 'bg-emerald-100 text-emerald-800' : r.status === 'has_warnings' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-600 max-w-[180px] truncate" title={r.normalized.notes}>
                      {r.normalized.notes || 'Clean'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 6: ISSUES & INTEGRITY LOG */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'issues' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Data Quality, Anomaly & Integrity Log ({summary.allIssues.length})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Highlights missing representatives, refunds/returns, duplicate IDs, invalid dates, and recommended fixes.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search issues..."
                  value={issuesSearch}
                  onChange={(e) => setIssuesSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs w-44 focus:bg-white focus:outline-emerald-500"
                />
              </div>

              {/* Severity Filter */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
                {(['all', 'error', 'warning', 'info'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setIssuesSeverityFilter(sev)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition cursor-pointer ${
                      issuesSeverityFilter === sev
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredIssues.length === 0 ? (
            <div className="text-center py-10 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-emerald-950 text-sm">No Quality Issues Found</h4>
              <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                All records passed structural validation, rep attribution, and date parsing checks.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    issue.severity === 'error'
                      ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                      : issue.severity === 'warning'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                      : 'bg-blue-50/70 border-blue-200 text-blue-950'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          issue.severity === 'error'
                            ? 'bg-rose-200 text-rose-900'
                            : issue.severity === 'warning'
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-blue-200 text-blue-900'
                        }`}
                      >
                        {issue.severity}
                      </span>
                      <span className="font-mono text-xs font-bold">
                        {issue.code}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        (Row #{issue.rowIndex} • ID: {issue.transactionId || 'N/A'})
                      </span>
                    </div>

                    <p className="text-xs font-medium">{issue.message}</p>
                    {issue.suggestedFix && (
                      <p className="text-[11px] opacity-80">
                        Recommended Fix: {issue.suggestedFix}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const record = summary.processedRecords.find((r) => r.rowIndex === issue.rowIndex);
                      if (record) setSelectedRecordForTrace(record);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 shrink-0 transition cursor-pointer shadow-xs"
                  >
                    Inspect Row #{issue.rowIndex}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          id="btn-back-to-rules"
          onClick={onBackToRules}
          className="flex items-center space-x-2 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Rules Configuration</span>
        </button>

        <button
          type="button"
          id="btn-proceed-to-export-footer"
          onClick={onProceedToExport}
          className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Proceed to Finished Excel Workbook Export</span>
        </button>
      </div>

      {/* Trace Drilldown Modal */}
      <RowTraceModal
        record={selectedRecordForTrace}
        onClose={() => setSelectedRecordForTrace(null)}
      />
    </div>
  );
};
