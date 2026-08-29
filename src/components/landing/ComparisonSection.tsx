import React from 'react';
import { XCircle, CheckCircle2, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export const ComparisonSection: React.FC = () => {
  const comparisons = [
    {
      feature: 'Workflow Approach',
      manual: 'Rebuilding formulas, manual cell formatting, and repeated monthly data scrubbing',
      automated: 'Automated end-to-end pipeline: raw data in → finished multi-sheet report out',
    },
    {
      feature: 'Inconsistent Data Formats',
      manual: 'Manual search-and-replace for ($1,250), comma decimals, and Excel serial dates',
      automated: 'Automatically normalizes 12+ currencies, date styles, and decimal formats in milliseconds',
    },
    {
      feature: 'Rule & Commission Calculation',
      manual: 'Complex nested IFS and fragile VLOOKUP formulas prone to reference breaks',
      automated: 'Configurable engine supporting tiered, flat, graduated brackets, and custom overrides',
    },
    {
      feature: 'Anomaly & Issue Detection',
      manual: 'Silent calculation errors, uncredited reps, and hidden duplicates easily slip through',
      automated: 'Automated issue isolation with complete row-level audit flags and zero data loss',
    },
    {
      feature: 'Refunds & Clawback Deductions',
      manual: 'Easy to forget or manually miscalculate negative return adjustments',
      automated: 'Enforces strict, auditable refund deduction and penalty policies automatically',
    },
    {
      feature: 'Final Deliverable Output',
      manual: 'Unformatted, plain raw sheet requiring manual styling and pivot table setups',
      automated: 'Executive multi-sheet .xlsx with KPI summary cards, navy headers, and rep rollups',
    },
  ];

  return (
    <section className="py-24 bg-slate-950 text-slate-100 border-t border-slate-900 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Core Difference</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Excel isn’t the problem. Doing the same manual reporting work over and over is.
          </h2>
          <p className="mt-4 text-slate-300 text-base sm:text-lg leading-relaxed">
            Stop repeating the exact same manual cleanup, formula wiring, and chart building every single pay period.
          </p>
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-slate-800 bg-slate-900/90 text-sm font-bold">
            <div className="md:col-span-4 p-4 text-slate-400">Reporting Step</div>
            <div className="md:col-span-4 p-4 text-red-400 border-t md:border-t-0 md:border-l border-slate-800 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-red-500" />
              <span>Manual Excel Routine</span>
            </div>
            <div className="md:col-span-4 p-4 text-emerald-400 border-t md:border-t-0 md:border-l border-slate-800 bg-emerald-950/20 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Definitely Not Spreadsheets</span>
            </div>
          </div>

          <div className="divide-y divide-slate-800 text-xs sm:text-sm">
            {comparisons.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 hover:bg-slate-800/30 transition-colors"
              >
                <div className="md:col-span-4 p-4 font-semibold text-slate-200 flex items-center">
                  {row.feature}
                </div>
                <div className="md:col-span-4 p-4 text-slate-400 border-t md:border-t-0 md:border-l border-slate-800/60 flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500/70 shrink-0 mt-0.5" />
                  <span>{row.manual}</span>
                </div>
                <div className="md:col-span-4 p-4 text-emerald-300 font-medium border-t md:border-t-0 md:border-l border-slate-800/60 bg-emerald-950/10 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{row.automated}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
