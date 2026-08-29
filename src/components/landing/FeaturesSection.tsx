import React from 'react';
import {
  Sparkles,
  Sliders,
  ShieldCheck,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  Layers,
  TrendingUp,
  RotateCcw,
  Zap,
  Clock,
  Eye,
} from 'lucide-react';
import { motion } from 'motion/react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Clock,
      title: 'Save 4+ Hours Every Pay Period',
      description:
        'Eliminate manual Excel copy-pasting, multi-level nested IFS, and broken lookup formulas. Drop your raw CSV or XLSX and get finished commission calculations in seconds.',
      badge: 'Time Saver',
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    },
    {
      icon: Sliders,
      title: 'Any Commission Structure Supported',
      description:
        'Effortlessly run Flat Rates, Cumulative Volume Tiers, Graduated Marginal Brackets, Product Category Multipliers, and Rep-Specific Custom Rate overrides.',
      badge: 'Multi-Plan Engine',
      badgeColor: 'bg-blue-950 text-blue-300 border-blue-800',
    },
    {
      icon: Layers,
      title: 'Automated Data Sanitizer',
      description:
        'Handles real-world messy exports: European comma decimals (1.250,50), Excel serial dates (45488), accounting negatives ($1,250.00), zero-width characters, and non-breaking spaces.',
      badge: 'Self-Cleaning',
      badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800',
    },
    {
      icon: RotateCcw,
      title: 'Refund & Clawback Intelligence',
      description:
        'Choose exact clawback policies: Full Clawback, Flat Penalty per refund, or No Deduction. Automatically deducts returns from the responsible rep without corrupting grand totals.',
      badge: 'Financial Accuracy',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
    },
    {
      icon: Lock,
      title: '100% In-Browser Confidentiality',
      description:
        'Your sensitive revenue numbers and payroll figures never touch external servers or databases. All parsing, validation, and Excel creation executes 100% in your local browser.',
      badge: 'Air-Tight Privacy',
      badgeColor: 'bg-teal-950 text-teal-300 border-teal-800',
    },
    {
      icon: FileSpreadsheet,
      title: 'C-Suite Executive Excel Reports',
      description:
        'Generates beautiful multi-worksheet .xlsx files with Dark Navy headers (#1E293B), Segoe UI typography, frozen panes, KPI summary blocks, and rep performance rollups.',
      badge: 'Deliverable Ready',
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
            <span>Built For Sales Ops & Finance</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Everything you need to automate commission payroll
          </h2>
          <p className="mt-4 text-slate-300 text-base leading-relaxed">
            Engineered specifically to solve the headaches of sales commission processing with total mathematical precision.
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
                  <span>Audited & deterministic</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
