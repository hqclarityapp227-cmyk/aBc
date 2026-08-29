import React from 'react';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Layers,
  BarChart3,
  Download,
  Check,
} from 'lucide-react';
import { motion } from 'motion/react';

interface HeroSectionProps {
  onLaunchApp: () => void;
  onScrollToDemo: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onLaunchApp,
  onScrollToDemo,
}) => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-slate-950 text-white">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[360px] bg-emerald-500/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 right-10 w-[320px] h-[320px] bg-teal-500/10 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute top-20 left-10 w-[260px] h-[260px] bg-blue-500/5 blur-[90px] pointer-events-none rounded-full" />

      {/* Subtle Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Top Feature Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide mb-6 shadow-sm shadow-emerald-950/50"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Automated Sales & Commission Reporting Workflow</span>
        </motion.div>

        {/* Primary Hero Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.14]"
        >
          From raw sales data to a finished Excel report in{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300">
            seconds.
          </span>
        </motion.h1>

        {/* Subtitle / Core Supporting Message */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
        >
          Upload your CSV or XLSX. Automatically clean and structure the data, apply your reporting rules, calculate results, identify issues, and generate summaries and charts — ready to export to Excel.
        </motion.p>

        {/* Core Philosophy Callout */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
          className="mt-4 inline-block px-4 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 text-xs sm:text-sm font-medium italic"
        >
          “Excel isn’t the problem. Doing the same manual reporting work in Excel over and over is.”
        </motion.div>

        {/* Primary & Secondary Call to Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5"
        >
          <button
            type="button"
            id="hero-btn-try-free"
            onClick={onLaunchApp}
            className="w-full sm:w-auto px-7 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-base font-bold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 hover:scale-[1.02] flex items-center justify-center space-x-2 cursor-pointer group"
          >
            <span>Try it free</span>
            <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            type="button"
            id="hero-btn-demo"
            onClick={onScrollToDemo}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-base font-semibold rounded-xl border border-slate-700/80 transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>See Workflow Demonstration</span>
          </button>
        </motion.div>

        {/* Trust Guarantees */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400"
        >
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Free to test with your actual spreadsheets</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>100% In-Browser Privacy (Zero server storage)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Instant calculation • No account required</span>
          </div>
        </motion.div>

        {/* Raw Data In -> Finished Report Out 4-Stage Banner */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-14 p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-sm"
        >
          <div className="text-center mb-4 flex items-center justify-center space-x-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
              THE WORKFLOW ENGINE
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-300 font-semibold">
              Raw Data In → Finished Report Out
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-red-950 text-red-400 border border-red-800/60 shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-red-400 font-semibold tracking-wider">1. Input</p>
                <p className="text-xs font-bold text-slate-200 mt-0.5">Messy Raw CSV / XLSX</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">Any date/number formats, currencies & CRM exports</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-blue-950 text-blue-400 border border-blue-800/60 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-blue-400 font-semibold tracking-wider">2. Process</p>
                <p className="text-xs font-bold text-slate-200 mt-0.5">Normalize & Clean</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">Auto-detects columns, fixes formats & flags issues</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/60 shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-indigo-400 font-semibold tracking-wider">3. Analyze</p>
                <p className="text-xs font-bold text-slate-200 mt-0.5">Rules, Math & Charts</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">Tiered plans, clawbacks & rep performance charts</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/60 shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-emerald-400 font-semibold tracking-wider">4. Output</p>
                <p className="text-xs font-bold text-slate-200 mt-0.5">Finished Excel Report</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">Multi-tab workbook with KPI cards & audit ledger</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
