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
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InteractiveWorkflowDemoProps {
  onLaunchApp: () => void;
}

export const InteractiveWorkflowDemo: React.FC<InteractiveWorkflowDemoProps> = ({
  onLaunchApp,
}) => {
  const [activeStage, setActiveStage] = useState<1 | 2 | 3>(1);
  const [autoPlay, setAutoPlay] = useState<boolean>(true);

  // Auto cycle stages every 6 seconds unless user manually interacts
  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setActiveStage((prev) => (prev === 3 ? 1 : ((prev + 1) as 1 | 2 | 3)));
    }, 6000);
    return () => clearInterval(interval);
  }, [autoPlay]);

  const handleSelectStage = (stage: 1 | 2 | 3) => {
    setAutoPlay(false);
    setActiveStage(stage);
  };

  return (
    <section id="workflow-demo" className="py-20 bg-slate-900 text-slate-100 border-t border-slate-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Product Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            From raw spreadsheet chaos to executive deliverables
          </h2>
          <p className="mt-4 text-slate-300 text-base leading-relaxed">
            See how Definitely Not Spreadsheets takes unformatted CRM exports, cleans every data anomaly, executes multi-tiered rules, and produces presentation-ready Excel workbooks.
          </p>
        </div>

        {/* 3-Stage Progress Nav Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 max-w-3xl mx-auto mb-8 bg-slate-950/80 p-2 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => handleSelectStage(1)}
            className={`w-full sm:w-1/3 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeStage === 1
                ? 'bg-red-950/80 text-red-300 border border-red-800 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-red-900/60 text-red-300 flex items-center justify-center text-[10px] font-bold">1</div>
            <span>1. Raw Sales Mess</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectStage(2)}
            className={`w-full sm:w-1/3 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeStage === 2
                ? 'bg-blue-950/80 text-blue-300 border border-blue-800 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-blue-900/60 text-blue-300 flex items-center justify-center text-[10px] font-bold">2</div>
            <span>2. Intelligent Processing</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectStage(3)}
            className={`w-full sm:w-1/3 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeStage === 3
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-emerald-900/60 text-emerald-300 flex items-center justify-center text-[10px] font-bold">3</div>
            <span>3. Executive Deliverable</span>
          </button>
        </div>

        {/* Live Simulation Display Card */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden min-h-[460px] flex flex-col">
          {/* Mock Window Top Bar */}
          <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-xs text-slate-400">
                {activeStage === 1 && 'sales_export_q3_raw_mess.csv (Input)'}
                {activeStage === 2 && 'Commission Engine • Deterministic Normalization & Rules'}
                {activeStage === 3 && 'Executive_Commission_Summary_Q3.xlsx (Finished Output)'}
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
                  <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
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
          <div className="p-6 flex-1 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {/* STAGE 1: RAW MESSY SPREADSHEET */}
              {activeStage === 1 && (
                <motion.div
                  key="stage-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-red-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        Common Real-World Spreadsheet Messes
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Typical sales exports arrive with mixed date formats, accounting parentheses, missing values, and messy numbers that break VLOOKUP formulas.
                      </p>
                    </div>
                    <span className="hidden sm:inline-block px-2.5 py-1 bg-red-950 text-red-300 border border-red-800 rounded text-xs font-mono">
                      4 Anomaly Patterns Detected
                    </span>
                  </div>

                  {/* Messy Table Visualization */}
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
                    <table className="w-full text-xs font-mono text-left">
                      <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="p-2.5 border-b border-slate-700">Txn Date</th>
                          <th className="p-2.5 border-b border-slate-700">Sales Rep</th>
                          <th className="p-2.5 border-b border-slate-700">Deal Category</th>
                          <th className="p-2.5 border-b border-slate-700 text-right">Raw Sales Amount</th>
                          <th className="p-2.5 border-b border-slate-700">Stage</th>
                          <th className="p-2.5 border-b border-slate-700">Issue Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        <tr className="hover:bg-slate-800/40">
                          <td className="p-2.5 text-slate-400">45488 (Excel Serial)</td>
                          <td className="p-2.5 font-bold text-white">Sarah Jenkins</td>
                          <td className="p-2.5">Enterprise Cloud</td>
                          <td className="p-2.5 text-right font-medium text-emerald-400">$24,500.00</td>
                          <td className="p-2.5"><span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded text-[10px]">Closed Won</span></td>
                          <td className="p-2.5 text-amber-400">Excel serial date format</td>
                        </tr>
                        <tr className="hover:bg-slate-800/40 bg-red-950/20">
                          <td className="p-2.5 text-slate-400">07/16/2024</td>
                          <td className="p-2.5 text-red-400 font-bold italic">[Missing Rep]</td>
                          <td className="p-2.5">Consulting Pro</td>
                          <td className="p-2.5 text-right font-medium">$8,200.00</td>
                          <td className="p-2.5"><span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded text-[10px]">Closed Won</span></td>
                          <td className="p-2.5 text-red-400 font-semibold">Missing Rep (Uncredited)</td>
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
                          <td className="p-2.5 text-right font-medium text-blue-300">14.500,50 EUR</td>
                          <td className="p-2.5"><span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded text-[10px]">Closed Won</span></td>
                          <td className="p-2.5 text-blue-300">European Comma Decimal & Symbol</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-xs text-red-200 flex items-center justify-between">
                    <span>💡 In manual Excel workflows, these 4 rows cause `#VALUE!`, missing commission credits, or unhandled refund liabilities.</span>
                    <button
                      type="button"
                      onClick={() => handleSelectStage(2)}
                      className="px-3 py-1 bg-red-900/80 hover:bg-red-800 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>See Processing</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STAGE 2: INTELLIGENT PROCESSING & RULES ENGINE */}
              {activeStage === 2 && (
                <motion.div
                  key="stage-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-blue-300 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-blue-400" />
                        Deterministic Data Cleaning & Commission Engine
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Our zero-dependency engine sanitizes values, verifies transaction eligibility, applies tiered commission rules, and clawbacks refunds.
                      </p>
                    </div>
                    <span className="hidden sm:inline-block px-2.5 py-1 bg-blue-950 text-blue-300 border border-blue-800 rounded text-xs font-mono">
                      100% Deterministic Math
                    </span>
                  </div>

                  {/* Engine Processing Flow Visualization */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Data Sanitizer</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Converts `45488` $\rightarrow$ `2024-07-15`, `($2,400.00)` $\rightarrow$ `-$2,400.00`, and `14.500,50 EUR` $\rightarrow$ `$14,500.50`.
                      </p>
                      <span className="inline-block text-[10px] font-mono text-emerald-400/90 bg-emerald-950/60 px-2 py-0.5 rounded">
                        Zero data loss
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold">
                        <Layers className="w-4 h-4" />
                        <span>Tiered Rules Engine</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Calculates 8% base rate on $24,500 = $1,960, plus $200 High-Ticket bonus over $20k threshold = $2,160 total.
                      </p>
                      <span className="inline-block text-[10px] font-mono text-blue-400/90 bg-blue-950/60 px-2 py-0.5 rounded">
                        Formula audit trail
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Clawback & Anomaly Guard</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Deducts -$192 commission for refunded deal, and flags missing rep row in review queue without crashing calculations.
                      </p>
                      <span className="inline-block text-[10px] font-mono text-amber-400/90 bg-amber-950/60 px-2 py-0.5 rounded">
                        Full financial integrity
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-950/30 border border-blue-900/50 rounded-xl text-xs text-blue-200 flex items-center justify-between">
                    <span>⚡ Processed 4 complex records with 100% mathematical reproducibility in 4 milliseconds.</span>
                    <button
                      type="button"
                      onClick={() => handleSelectStage(3)}
                      className="px-3 py-1 bg-blue-900/80 hover:bg-blue-800 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>See Executive Output</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STAGE 3: EXECUTIVE MULTI-TAB DELIVERABLE */}
              {activeStage === 3 && (
                <motion.div
                  key="stage-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-emerald-300 flex items-center gap-2">
                        <Download className="w-4 h-4 text-emerald-400" />
                        Executive Multi-Sheet Excel Deliverable (.xlsx)
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Styled with Dark Navy headers (`#1E293B`), Segoe UI font, frozen panes, KPI metric cards, and rep totals.
                      </p>
                    </div>
                    <span className="hidden sm:inline-block px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-xs font-mono">
                      4 Formatted Worksheets
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

                  <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-xl text-xs text-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <span>✨ Complete deliverable includes: Executive Summary, Cleaned Data, Commission Calculation Ledger, and Rep Rollups.</span>
                    <button
                      type="button"
                      onClick={onLaunchApp}
                      className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Try with Your Data Free</span>
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
