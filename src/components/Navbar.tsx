import React from 'react';
import {
  FileSpreadsheet,
  Layers,
  Sliders,
  BarChart3,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { WHOP_CHECKOUT_URL, getWhopCheckoutUrl } from '../utils/whopAffiliate';

interface NavbarProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  maxStepReached: number;
  fileName?: string;
  hasErrors?: boolean;
  onReset: () => void;
  isUnlocked?: boolean;
  onOpenProModal?: () => void;
  onNavigateHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStep,
  onSelectStep,
  maxStepReached,
  fileName,
  hasErrors,
  onReset,
  isUnlocked,
  onOpenProModal,
  onNavigateHome,
}) => {
  const steps = [
    { id: 1, label: '1. Upload File', icon: FileSpreadsheet },
    { id: 2, label: '2. Match Columns', icon: Layers },
    { id: 3, label: '3. Set Commission Rates', icon: Sliders },
    { id: 4, label: '4. View Results', icon: BarChart3 },
    { id: 5, label: '5. Download Excel', icon: Download },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & App Title */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={onNavigateHome}
            title="Definitely Not Spreadsheets - Back to Home"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-inner font-bold group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  Definitely Not Spreadsheets
                </span>
                <span className="px-2 py-0.5 text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
                  Instant & Private
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sales commission calculator & audit-ready Excel reports
              </p>
            </div>
          </div>

          {/* Active File, Pro Button & Reset */}
          <div className="flex items-center space-x-3">
            {onNavigateHome && (
              <button
                type="button"
                id="btn-nav-back-home"
                onClick={onNavigateHome}
                className="hidden lg:flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition cursor-pointer"
                title="Return to Landing Page"
              >
                <span>← Home</span>
              </button>
            )}

            {/* Upgrade to Pro / Pro Status CTA */}
            {isUnlocked ? (
              <button
                type="button"
                id="btn-nav-pro-active"
                onClick={onOpenProModal}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-700/80 transition cursor-pointer"
                title="Pro Pass Active - Click to view pass details"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>PRO Active</span>
              </button>
            ) : (
              <div className="flex items-center space-x-1.5">
                <a
                  id="btn-nav-upgrade-whop-link"
                  href={getWhopCheckoutUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 text-xs font-extrabold rounded-lg shadow-sm transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                  <span>Upgrade to Pro</span>
                  <ExternalLink className="w-3 h-3 text-slate-950" />
                </a>

                <button
                  type="button"
                  id="btn-nav-enter-key"
                  onClick={onOpenProModal}
                  className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition cursor-pointer"
                  title="Already a member? Enter license key"
                >
                  <span>Have Key?</span>
                </button>
              </div>
            )}

            {fileName && (
              <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-md text-xs">
                <span className="text-slate-400">Active File:</span>
                <span className="font-mono font-medium text-emerald-400 truncate max-w-[180px]" title={fileName}>
                  {fileName}
                </span>
                {hasErrors && (
                  <span title="Contains flagged issues" className="flex items-center text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            )}

            {fileName && (
              <button
                type="button"
                id="btn-reset-session"
                onClick={onReset}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-md border border-slate-700 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Step Navigation Bar */}
        <div className="flex items-center space-x-1 overflow-x-auto py-2.5 border-t border-slate-800/80 scrollbar-none">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = maxStepReached > step.id;
            const isAccessible = step.id <= maxStepReached;

            return (
              <button
                key={step.id}
                type="button"
                id={`nav-step-${step.id}`}
                disabled={!isAccessible}
                onClick={() => onSelectStep(step.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isCompleted
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    : isAccessible
                    ? 'text-slate-400 hover:bg-slate-800'
                    : 'text-slate-600 cursor-not-allowed opacity-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{step.label}</span>
                {isCompleted && !isActive && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
