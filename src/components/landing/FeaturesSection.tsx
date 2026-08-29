import React from 'react';
import {
  Sliders,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  Layers,
  BarChart3,
  RotateCcw,
  Zap,
  Clock,
  SearchCheck,
  Calculator,
  FileDown,
} from 'lucide-react';
import { motion } from 'motion/react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Clock,
      title: 'Eliminate Repetitive Reporting Work',
      description:
        'Turn hours of manual formula linking, lookup fixes, and recurring monthly reconciliation into a streamlined, automated workflow that finishes in seconds.',
      badge: 'End-to-End Workflow',
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    },
    {
      icon: Layers,
      title: 'Normalize Inconsistent Data Formats',
      description:
        'Handles every real-world export quirk: 12+ currency formats, comma decimals (1.250,50), Excel serial dates (45488), accounting negatives (($1,250)), and non-breaking spaces.',
      badge: 'Data Normalization',
      badgeColor: 'bg-teal-950 text-teal-300 border-teal-800',
    },
    {
      icon: Calculator,
      title: 'Calculations & Reporting Rules',
      description:
        'Execute multi-tiered structures effortlessly: Flat Rates, Cumulative Volume Tiers, Graduated Marginal Brackets, Category Multipliers, and Rep-Specific Custom Rate overrides.',
      badge: 'Rule Engine',
      badgeColor: 'bg-blue-950 text-blue-300 border-blue-800',
    },
    {
      icon: SearchCheck,
      title: 'Identify Issues & Duplicate Deals',
      description:
        'Automatically isolates data anomalies, missing rep attributions, duplicate transaction IDs, and unparseable rows into an audit review log with zero row dropping.',
      badge: 'Issue Detection',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
    },
    {
      icon: BarChart3,
      title: 'Structured Summaries & Visual Charts',
      description:
        'Generate instant salesperson performance rollups, tier progression charts, category volume breakdowns, and executive KPI summaries directly in your dashboard.',
      badge: 'Analysis & Summaries',
      badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800',
    },
    {
      icon: FileSpreadsheet,
      title: 'Finished Multi-Sheet Excel Workbook',
      description:
        'Export a presentation-ready .xlsx workbook with Dark Navy headers (#1E293B), Segoe UI typography, frozen panes, KPI summary blocks, and an auditable formula ledger.',
      badge: 'Finished Excel Out',
      badgeColor: 'bg-purple-950 text-purple-300 border-purple-800',
    },
  ];

  return (
    <section id="features" className="py-24 bg-slate-950 text-slate-100 border-t border-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Complete Reporting Automation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            More than just data cleaning — a complete reporting engine
          </h2>
          <p className="mt-4 text-slate-300 text-base leading-relaxed">
            From normalizing raw export files to applying your exact business rules, detecting anomalies, generating charts, and producing finished executive Excel workbooks.
          </p>
        </div>

        {/* 6 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-emerald-950/20 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700/60 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${feat.badgeColor}`}>
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center text-xs text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
                  <span>Raw data in → finished report out</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
