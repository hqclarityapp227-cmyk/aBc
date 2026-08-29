import React from 'react';
import { XCircle, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export const ComparisonSection: React.FC = () => {
  const comparisons = [
    {
      feature: 'Processing Speed',
      manual: '3 to 5 hours of manual formula linking & SUMIFS',
      automated: 'Under 5 seconds for complete calculation & export',
    },
    {
      feature: 'Handling Messy Formats',
      manual: 'Manual find-and-replace for ($100), commas & serial dates',
      automated: 'Auto-sanitizes 12+ currencies, commas & dates',
    },
    {
      feature: 'Clawbacks & Returns',
      manual: 'Easy to forget or double-deduct from reps',
      automated: 'Enforces strict, audited refund deduction policies',
    },
    {
      feature: 'Formula Fragility',
      manual: 'Accidental row deletions break entire workbook VLOOKUPs',
      automated: '100% deterministic code engine with zero broken refs',
    },
    {
      feature: 'Data Privacy',
      manual: 'Uploading payroll files to untrusted cloud databases',
      automated: '100% in-browser execution; zero server data storage',
    },
    {
      feature: 'Final Deliverable',
      manual: 'Plain unformatted raw grid requiring manual styling',
      automated: 'Executive multi-tab .xlsx with KPI cards & navy headers',
    },
  ];

  return (
    <section className="py-24 bg-slate-950 text-slate-100 border-t border-slate-900 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Why Switch</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Stop building commission spreadsheets from scratch
          </h2>
          <p className="mt-4 text-slate-300 text-base leading-relaxed">
            See how Definitely Not Spreadsheets compares to manual Excel formula templates.
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
            <div className="md:col-span-4 p-4 text-slate-400">Workflow Capability</div>
            <div className="md:col-span-4 p-4 text-red-400 border-t md:border-t-0 md:border-l border-slate-800 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-red-500" />
              <span>Manual Excel Formulas</span>
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
