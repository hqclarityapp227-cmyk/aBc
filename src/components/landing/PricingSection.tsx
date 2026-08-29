import React from 'react';
import {
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Download,
  Key,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'motion/react';
import { WHOP_CHECKOUT_URL } from '../ProUpgradeModal';

interface PricingSectionProps {
  onLaunchApp: () => void;
  onOpenProModal: () => void;
  isUnlocked: boolean;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  onLaunchApp,
  onOpenProModal,
  isUnlocked,
}) => {
  return (
    <section id="pricing" className="py-24 bg-slate-900 text-slate-100 border-t border-slate-800 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simple, Transparent Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Free to test. Upgrade for executive Excel exports.
          </h2>
          <p className="mt-4 text-slate-300 text-base leading-relaxed">
            Test all calculations and preview results with your real spreadsheet data for free. Unlock direct multi-tab Excel downloads whenever you are ready.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Free Tier Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="p-8 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">
                  Test & Preview
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-900 text-slate-300 border border-slate-700">
                  Free Forever
                </span>
              </div>

              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-extrabold text-white tracking-tight">$0</span>
                <span className="ml-2 text-sm text-slate-400 font-medium">/ forever</span>
              </div>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Full access to upload sales data, clean anomalies, configure commission plans, and inspect complete on-screen calculations.
              </p>

              <div className="mt-8 space-y-3.5 text-xs text-slate-300">
                <div className="flex items-start">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mr-2.5 mt-0.5" />
                  <span>Unlimited spreadsheet uploads (CSV, XLSX, XLS)</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mr-2.5 mt-0.5" />
                  <span>Automated column detection & data normalizer</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mr-2.5 mt-0.5" />
                  <span>All commission structures (Flat, Tiered, Graduated)</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mr-2.5 mt-0.5" />
                  <span>Interactive on-screen quality review & error log</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mr-2.5 mt-0.5" />
                  <span>Interactive rep analytics & summary breakdown</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mr-2.5 mt-0.5" />
                  <span>100% Client-side privacy (no data stored)</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-900">
              <button
                type="button"
                id="pricing-btn-free-try"
                onClick={onLaunchApp}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl border border-slate-700 transition cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>Launch Free Tool</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </motion.div>

          {/* Pro Pass Card ($19/mo) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/80 relative flex flex-col justify-between shadow-2xl shadow-emerald-950/40"
          >
            {/* Top Popular Badge */}
            <div className="absolute -top-3.5 right-6 px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-[11px] font-extrabold rounded-full shadow-md">
              EXECUTIVE DELIVERABLE PASS
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider">
                  Pro License
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Instant Activation
                </span>
              </div>

              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-extrabold text-white tracking-tight">$19</span>
                <span className="ml-2 text-sm text-slate-300 font-medium">/ month</span>
              </div>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Directly export beautifully styled multi-worksheet Excel deliverables for executives, finance teams, and payroll.
              </p>

              <div className="mt-8 space-y-3.5 text-xs text-slate-200">
                <div className="flex items-start font-semibold text-white">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mr-2.5 mt-0.5" />
                  <span>Everything in Free, plus:</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mr-2.5 mt-0.5" />
                  <span>Direct Executive Excel (.xlsx) downloads</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mr-2.5 mt-0.5" />
                  <span>Multi-sheet workbooks with Executive KPI Summary cards</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mr-2.5 mt-0.5" />
                  <span>Salesperson rollups with double-underline totals</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mr-2.5 mt-0.5" />
                  <span>Full row-level calculation audit trail & formula log</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mr-2.5 mt-0.5" />
                  <span>Instant license key activation via Whop • Cancel anytime</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-2.5">
              {isUnlocked ? (
                <div className="w-full py-3 bg-emerald-950 text-emerald-300 font-bold text-xs sm:text-sm rounded-xl border border-emerald-700 flex items-center justify-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Pro Pass Active on This Device</span>
                </div>
              ) : (
                <>
                  <a
                    id="pricing-btn-whop-checkout"
                    href={WHOP_CHECKOUT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/40 transition hover:scale-[1.02] flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Get Pro Pass ($19/mo on Whop)</span>
                    <ExternalLink className="w-4 h-4 text-slate-950" />
                  </a>

                  <button
                    type="button"
                    id="pricing-btn-activate-key"
                    onClick={onOpenProModal}
                    className="w-full py-2 text-center text-xs text-slate-400 hover:text-white font-medium transition cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <Key className="w-3 h-3 text-slate-400" />
                    <span>Already have a license key? Click here to activate</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
