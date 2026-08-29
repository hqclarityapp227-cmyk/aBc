import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Layers,
  Cpu,
  Download,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Play,
  BarChart3,
  Check,
  FileCheck,
  HelpCircle,
  Hash,
  Table,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InteractiveWorkflowDemoProps {
  onLaunchApp: () => void;
}

export const InteractiveWorkflowDemo: React.FC<InteractiveWorkflowDemoProps> = ({
  onLaunchApp,
}) => {
  const [activeStage, setActiveStage] = useState<1 | 2 | 3 | 4>(1);
  const [autoPlay, setAutoPlay] = useState<boolean>(true);

  // Auto cycle stages every 6 seconds unless user manually interacts
  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setActiveStage((prev) => (prev === 4 ? 1 : ((prev + 1) as 1 | 2 | 3 | 4)));
    }, 6000);
    return () => clearInterval(interval);
  }, [autoPlay]);

  const handleSelectStage = (stage: 1 | 2 | 3 | 4) => {
    setAutoPlay(false);
    setActiveStage(stage);
  };

  return (
    <section id="workflow-demo" className="py-20 md:py-28 bg-slate-900 text-slate-100 border-t border-slate-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Automated Reporting Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Raw data in → finished report out
          </h2>
          <p className="mt-4 text-slate-300 text-base sm:text-lg leading-relaxed">
            See the entire transformation: from inconsistent CSV or XLSX exports into a structured, calculated, and presentation-ready multi-tab Excel workbook.
          </p>
        </div>

        {/* 4-Stage Progress Nav Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 max-w-5xl mx-auto mb-8 bg-slate-950/90 p-2 sm:p-2.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => handleSelectStage(1)}
            className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeStage === 1
                ? 'bg-red-950/80 text-red-300 border border-red-800 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-red-900/70 text-red-200 flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
            <span className="truncate">1. Messy Raw CSV</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectStage(2)}
            className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeStage === 2
                ? 'bg-blue-950/80 text-blue-300 border border-blue-800 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-blue-900/70 text-blue-200 flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
            <span className="truncate">2. Auto Normalization</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectStage(3)}
            className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeStage === 3
                ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-indigo-900/70 text-indigo-200 flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
            <span className="truncate">3. Rules & Summaries</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectStage(4)}
            className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeStage === 4
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-emerald-900/70 text-emerald-200 flex items-center justify-center text-[10px] font-bold shrink-0">4</div>
            <span className="truncate">4. Finished Excel (.xlsx)</span>
          </button>
        </div>

        {/* Live Simulation Display Card */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
          {/* Mock Window Top Bar */}
          <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-xs text-slate-300">
                {activeStage === 1 && 'sales_export_q3_raw_crm.csv (Raw Input Data)'}
                {activeStage === 2 && 'Step 2: Auto-Detection & Sanitization Engine'}
                {activeStage === 3 && 'Step 3: Applied Rules, Issue Audit & Performance Rollups'}
                {activeStage === 4 && 'Q3_Commission_Executive_Deliverable.xlsx (Ready To Download)'}
              </span>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <button
                type="button"
                onClick={() => setAutoPlay(!autoPlay)}
                className="text-slate-400 hover:text-slate-200 flex items-center space-x-1"
                title={autoPlay ? 'Pause auto-rotation' : 'Play auto-rotation'}
              >
                {autoPlay ? (
                  <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Auto-playing
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                    <Play className="w-3 h-3" /> Resume Auto-play
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Active Stage Body */}
          <div className="p-5 sm:p-7 flex-1 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {/* STAGE 1: MESSY RAW CSV */}
              {activeStage === 1 && (
                <motion.div
                  key="stage-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-red-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        Stage 1: Messy Raw Export (CSV / XLSX)
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Raw exports from CRMs and payment processors arrive filled with non-standard dates, accounting parentheses, missing reps, and mixed currency notations.
                      </p>
                    </div>
                    <span className="self-start sm:self-auto px-2.5 py-1 bg-red-950 text-red-300 border border-red-800/80 rounded text-xs font-mono">
                      4 Anomaly Formats In Raw Data
                    </span>
                  </div>

                  {/* Messy Table Visualization */}
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
                    <table className="w-full text-xs font-mono text-left">
                      <thead className="bg-slate-800/90 text-slate-300 uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="p-2.5 border-b border-slate-700">Txn Date</th>
                          <th className="p-2.5 border-b border-slate-700">Sales Rep</th>
                          <th className="p-2.5 border-b border-slate-700">Deal Category</th>
                          <th className="p-2.5 border-b border-slate-700 text-right">Raw Sales Amount</th>
                          <th className="p-2.5 border-b border-slate-700">Stage</th>
                          <th className="p-2.5 border-b border-slate-700">Raw Format Quirks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        <tr className="hover:bg-slate-800/40">
                          <td className="p-2.5 text-amber-300">45488 (Excel Serial)</td>
                          <td className="p-2.5 font-bold text-white">Sarah Jenkins</td>
                          <td className="p-2.5">Enterprise Cloud</td>
                          <td className="p-2.5 text-right font-medium text-emerald-400">$24,500.00</td>
                          <td className="p-2.5"><span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded text-[10px]">Closed Won</span></td>
                          <td className="p-2.5 text-amber-400">Numeric serial date format</td>
                        </tr>
                        <tr className="hover:bg-slate-800/40 bg-red-950/20">
                          <td className="p-2.5 text-slate-400">07/16/2024</td>
                          <td className="p-2.5 text-red-400 font-bold italic">[Missing Rep]</td>
                          <td className="p-2.5">Consulting Pro</td>
                          <td className="p-2.5 text-right font-medium">$8,200.00</td>
                          <td className="p-2.5"><span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded text-[10px]">Closed Won</span></td>
                          <td className="p-2.5 text-red-400 font-semibold">Missing Rep Attribution</td>
                        </tr>
                        <tr className="hover:bg-slate-800/40 bg-amber-950/20">
                          <td className="p-2.5 text-slate-400">18-Jul-2024</td>
                          <td className="p-2.5 font-bold text-white">Marcus Vance</td>
                          <td className="p-2.5">SaaS License</td>
                          <td className="p-2.5 text-right font-medium text-red-400">($2,400.00)</td>
                          <td className="p-2.5"><span className="px-2 py-0.5 bg-red-950 text-red-300 rounded text-[10px]">Refund</span></td>
                          <td className="p-2.5 text-amber-300 font-semibold">Parenthesis Accounting Negative</td>
                        </tr>
                        <tr className="hover:bg-slate-800/40">
                          <td className="p-2.5 text-slate-400">2024/07/20</td>
                          <td className="p-2.5 font-bold text-white">Elena Rostova</td>
                          <td className="p-2.5">Enterprise Cloud</td>
                          <td className="p-2.5 text-right font-medium text-cyan-300">14.500,50 EUR</td>
                          <td className="p-2.5"><span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded text-[10px]">Closed Won</span></td>
                          <td className="p-2.5 text-cyan-300">European Comma Decimal & Symbol</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-xs text-red-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <span>⚠️ In standard manual Excel reporting, these format anomalies break `=VLOOKUP` and create `#VALUE!` formula failures.</span>
                    <button
                      type="button"
                      onClick={() => handleSelectStage(2)}
                      className="px-3 py-1.5 bg-red-900/80 hover:bg-red-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <span>Step 2: Auto Normalization</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STAGE 2: AUTOMATIC PROCESSING & NORMALIZATION */}
              {activeStage === 2 && (
                <motion.div
                  key="stage-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-blue-300 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-blue-400" />
                        Stage 2: Automatic Normalization & Issue Detection
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Detects header columns automatically, cleans numbers and dates into standard formats, and flags anomalies without losing source rows.
                      </p>
                    </div>
                    <span className="self-start sm:self-auto px-2.5 py-1 bg-blue-950 text-blue-300 border border-blue-800/80 rounded text-xs font-mono">
                      100% In-Browser Normalization
                    </span>
                  </div>

                  {/* Engine Processing Flow Visualization */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Format Normalizer</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Converts <span className="font-mono text-amber-300">45488</span> $\rightarrow$ <span className="font-mono text-emerald-300">2024-07-15</span>, and <span className="font-mono text-amber-300">14.500,50 EUR</span> $\rightarrow$ <span className="font-mono text-emerald-300">$14,500.50</span>.
                      </p>
                      <span className="inline-block text-[10px] font-mono text-emerald-400/90 bg-emerald-950/60 px-2 py-0.5 rounded">
                        Zero data loss
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold">
                        <Layers className="w-4 h-4" />
                        <span>Column Header Matcher</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Auto-maps varied column names (e.g., <span className="font-mono text-blue-300">"Rep Name"</span>, <span className="font-mono text-blue-300">"Closed Amount"</span>, <span className="font-mono text-blue-300">"Deal Stage"</span>).
                      </p>
                      <span className="inline-block text-[10px] font-mono text-blue-400/90 bg-blue-950/60 px-2 py-0.5 rounded">
                        Flexible schemas
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Issue & Anomaly Isolation</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Identifies missing rep names and duplicates, placing them in an audit review queue instead of failing silently.
                      </p>
                      <span className="inline-block text-[10px] font-mono text-amber-400/90 bg-amber-950/60 px-2 py-0.5 rounded">
                        Complete traceability
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-950/30 border border-blue-900/50 rounded-xl text-xs text-blue-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <span>⚡ Standardized every date, decimal, and currency format with zero manual data scrubbing.</span>
                    <button
                      type="button"
                      onClick={() => handleSelectStage(3)}
                      className="px-3 py-1.5 bg-blue-900/80 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <span>Step 3: Rules & Summaries</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STAGE 3: RULES, CALCULATIONS & SUMMARIES */}
              {activeStage === 3 && (
                <motion.div
                  key="stage-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-indigo-300 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-indigo-400" />
                        Stage 3: Reporting Rules, Calculations & Analysis
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Applies commission structures (tiered, flat, graduated brackets), enforces refund clawbacks, and produces live rep rollups with interactive charts.
                      </p>
                    </div>
                    <span className="self-start sm:self-auto px-2.5 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800/80 rounded text-xs font-mono">
                      Deterministic Calculations
                    </span>
                  </div>

                  {/* Calculations & Rep Rollup View */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-7 bg-slate-900/80 rounded-xl border border-slate-800 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-200">Rep Commission Rollup</p>
                        <span className="text-[10px] text-emerald-400 font-mono">Tiered Plan (8% Base + Boosts)</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="p-2 rounded bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white">Sarah Jenkins</span>
                            <span className="text-[11px] text-slate-400 ml-2">1 Deal ($24.5k)</span>
                          </div>
                          <span className="font-mono font-bold text-emerald-400">$2,160.00 <span className="text-[10px] text-slate-400 font-normal">(8.8% eff.)</span></span>
                        </div>
                        <div className="p-2 rounded bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white">Elena Rostova</span>
                            <span className="text-[11px] text-slate-400 ml-2">1 Deal ($14.5k)</span>
                          </div>
                          <span className="font-mono font-bold text-emerald-400">$1,160.04 <span className="text-[10px] text-slate-400 font-normal">(8.0% eff.)</span></span>
                        </div>
                        <div className="p-2 rounded bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white">Marcus Vance</span>
                            <span className="text-[11px] text-slate-400 ml-2">1 Refund (-$2.4k)</span>
                          </div>
                          <span className="font-mono font-bold text-red-400">-$192.00 <span className="text-[10px] text-slate-400 font-normal">(Clawback)</span></span>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-5 bg-slate-900/80 rounded-xl border border-slate-800 p-3.5 flex flex-col justify-between space-y-2">
                      <div>
                        <p className="text-xs font-bold text-slate-200">Rule Logic Applied</p>
                        <ul className="mt-2 space-y-1.5 text-[11px] text-slate-300">
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>8% Base Rate on Closed Won</span>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>+$200 High-Ticket Bonus &gt;$20k</span>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Full Clawback on Refund rows</span>
                          </li>
                        </ul>
                      </div>
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Total Net Payout</span>
                        <span className="text-sm font-bold text-emerald-400">$3,128.04</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-950/30 border border-indigo-900/50 rounded-xl text-xs text-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <span>📊 Generated complete rep summaries, distribution charts, and mathematical audit logs.</span>
                    <button
                      type="button"
                      onClick={() => handleSelectStage(4)}
                      className="px-3 py-1.5 bg-indigo-900/80 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <span>Step 4: Finished Excel Workbook</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STAGE 4: FINISHED EXCEL WORKBOOK */}
              {activeStage === 4 && (
                <motion.div
                  key="stage-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-emerald-300 flex items-center gap-2">
                        <Download className="w-4 h-4 text-emerald-400" />
                        Stage 4: Finished Multi-Sheet Excel Workbook (.xlsx)
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Exported directly as an executive Excel file with Dark Navy headers (`#1E293B`), frozen panes, summary KPI cards, and rep totals.
                      </p>
                    </div>
                    <span className="self-start sm:self-auto px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800/80 rounded text-xs font-mono">
                      4 Pre-Formatted Worksheets
                    </span>
                  </div>

                  {/* Mock Executive Excel Top Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Gross Sales</p>
                      <p className="text-base sm:text-lg font-bold text-white mt-1">$47,200.50</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Net Eligible Volume</p>
                      <p className="text-base sm:text-lg font-bold text-emerald-400 mt-1">$36,600.50</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Commissions</p>
                      <p className="text-base sm:text-lg font-bold text-teal-300 mt-1">$3,128.04</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Top Performer</p>
                      <p className="text-base sm:text-lg font-bold text-amber-300 mt-1 truncate">Sarah Jenkins</p>
                    </div>
                  </div>

                  {/* Clean Formatted Table Preview */}
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/90">
                    <table className="w-full text-xs font-sans text-left">
                      <thead className="bg-[#1E293B] text-white font-semibold text-[11px]">
                        <tr>
                          <th className="p-2.5">Salesperson</th>
                          <th className="p-2.5 text-center">Deals</th>
                          <th className="p-2.5 text-right">Gross Sales</th>
                          <th className="p-2.5 text-right">Refunds/Clawbacks</th>
                          <th className="p-2.5 text-right">Total Payout</th>
                          <th className="p-2.5 text-center">Effective Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-200">
                        <tr className="bg-slate-900/40">
                          <td className="p-2.5 font-bold text-white">Sarah Jenkins</td>
                          <td className="p-2.5 text-center">1</td>
                          <td className="p-2.5 text-right font-mono">$24,500.00</td>
                          <td className="p-2.5 text-right font-mono text-slate-400">$0.00</td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-400">$2,160.00</td>
                          <td className="p-2.5 text-center font-mono">8.8%</td>
                        </tr>
                        <tr className="bg-slate-800/30">
                          <td className="p-2.5 font-bold text-white">Elena Rostova</td>
                          <td className="p-2.5 text-center">1</td>
                          <td className="p-2.5 text-right font-mono">$14,500.50</td>
                          <td className="p-2.5 text-right font-mono text-slate-400">$0.00</td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-400">$1,160.04</td>
                          <td className="p-2.5 text-center font-mono">8.0%</td>
                        </tr>
                        <tr className="bg-slate-900/40">
                          <td className="p-2.5 font-bold text-white">Marcus Vance</td>
                          <td className="p-2.5 text-center">1</td>
                          <td className="p-2.5 text-right font-mono">$0.00</td>
                          <td className="p-2.5 text-right font-mono text-red-400">($2,400.00)</td>
                          <td className="p-2.5 text-right font-mono font-bold text-red-400">($192.00)</td>
                          <td className="p-2.5 text-center font-mono">8.0%</td>
                        </tr>
                        <tr className="bg-slate-950 font-bold border-t-2 border-b-4 border-slate-700 text-white">
                          <td className="p-2.5">GRAND TOTAL</td>
                          <td className="p-2.5 text-center">3</td>
                          <td className="p-2.5 text-right font-mono">$39,000.50</td>
                          <td className="p-2.5 text-right font-mono text-red-400">($2,400.00)</td>
                          <td className="p-2.5 text-right font-mono text-emerald-400">$3,128.04</td>
                          <td className="p-2.5 text-center font-mono">8.5%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Workbook Tabs Footer */}
                  <div className="flex items-center gap-1.5 pt-1 text-[11px] font-medium text-slate-400 overflow-x-auto">
                    <span className="text-slate-500 mr-1">Worksheet Tabs:</span>
                    <span className="px-2.5 py-1 rounded bg-slate-800 text-white font-semibold">1. Executive Summary</span>
                    <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-300">2. Cleaned Normalized Data</span>
                    <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-300">3. Commission Audit Ledger</span>
                    <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-300">4. Rep & Period Rollups</span>
                  </div>

                  <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-xl text-xs text-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <span>✨ From raw data to finished report in seconds — with zero manual formula maintenance.</span>
                    <button
                      type="button"
                      onClick={onLaunchApp}
                      className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md shadow-emerald-500/20"
                    >
                      <span>Launch App & Try Free</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
