import React from 'react';
import {
  FileSpreadsheet,
  Layers,
  Sliders,
  Download,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';

interface HowItWorksSectionProps {
  onLaunchApp: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onLaunchApp }) => {
  const steps = [
    {
      step: '01',
      icon: FileSpreadsheet,
      title: 'Drop Any Sales Export',
      description:
        'Upload your raw CSV, XLSX, or XLS file. The parser skips blank rows, strips decorative title banners, and inspects all sheets automatically.',
      highlight: 'Supports CSV, XLSX & XLS',
    },
    {
      step: '02',
      icon: Layers,
      title: 'Auto-Match Columns',
      description:
        'Intelligent column detection matches Date, Sales Rep, Amount, Stage, and Category columns even with messy or non-standard headers.',
      highlight: 'Fuzzy header recognition',
    },
    {
      step: '03',
      icon: Sliders,
      title: 'Configure Your Plan',
      description:
        'Set your Flat, Cumulative Tiered, or Graduated Marginal rates. Add category multipliers, minimum deal thresholds, and refund clawback policies.',
      highlight: 'Flexible multi-tier models',
    },
    {
      step: '04',
      icon: Download,
      title: 'Audit & Download Excel',
      description:
        'Review on-screen quality flags, inspect rep rollups, and download the finished executive multi-tab Excel workbook formatted for leadership.',
      highlight: 'Audit-ready .xlsx file',
    },
  ];

  return (
    <section className="py-24 bg-slate-900 text-slate-100 border-t border-slate-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fast 4-Step Process</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How it works
          </h2>
          <p className="mt-4 text-slate-300 text-base leading-relaxed">
            Four simple steps from messy raw data to polished executive reports with zero manual formula upkeep.
          </p>
        </div>

        {/* 4 Steps Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between relative group"
              >
                <div>
                  {/* Step Number & Icon */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-2xl font-black font-mono text-slate-700 group-hover:text-emerald-500/50 transition-colors">
                      {item.step}
                    </span>
                    <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 border border-slate-800 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-900 flex items-center text-[11px] font-mono text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  <span>{item.highlight}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Action */}
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={onLaunchApp}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/50 transition hover:scale-105 cursor-pointer"
          >
            <span>Start Processing Free</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      </div>
    </section>
  );
};
