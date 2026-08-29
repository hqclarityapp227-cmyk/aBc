import React from 'react';
import {
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { WHOP_CHECKOUT_URL, getWhopCheckoutUrl } from '../../utils/whopAffiliate';

interface LandingFooterProps {
  onLaunchApp: () => void;
  onOpenProModal: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onLaunchApp,
  onOpenProModal,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 relative">
      {/* Bottom CTA Banner */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -translate-y-12">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ready to automate your sales & commission reporting?
            </h3>
            <p className="text-sm text-slate-300 max-w-xl">
              Turn raw sales data into a finished, structured Excel report in seconds. 100% in-browser privacy.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              type="button"
              id="cta-btn-try-free"
              onClick={onLaunchApp}
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/60 transition hover:scale-105 flex items-center space-x-2 cursor-pointer"
            >
              <span>Try it free now</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>

            <button
              type="button"
              id="cta-btn-have-key"
              onClick={onOpenProModal}
              className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
            >
              Have a Key?
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={scrollToTop}>
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                <FileSpreadsheet className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-base text-white tracking-tight">
                Definitely Not Spreadsheets
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              The automated workflow that takes messy raw sales exports, normalizes inconsistent data, applies reporting rules, and generates finished executive Excel workbooks.
            </p>
            <div className="flex items-center space-x-1 text-xs text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
              <span>100% In-Browser Privacy Guarantee</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Product</p>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={onLaunchApp} className="hover:text-emerald-400 transition cursor-pointer">
                  Launch Web App
                </button>
              </li>
              <li>
                <a href="#workflow-demo" className="hover:text-emerald-400 transition">
                  Interactive Demo
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-emerald-400 transition">
                  Core Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-emerald-400 transition">
                  Pricing ($19/mo)
                </a>
              </li>
            </ul>
          </div>

          {/* Membership & Whop */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Membership</p>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href={getWhopCheckoutUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition flex items-center gap-1"
                >
                  <span>Whop Pro Membership</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <button onClick={onOpenProModal} className="hover:text-emerald-400 transition cursor-pointer">
                  Enter License Key
                </button>
              </li>
              <li>
                <a href="#faq" className="hover:text-emerald-400 transition">
                  FAQ & Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Definitely Not Spreadsheets. All calculations run strictly in your local browser.</p>
          <div className="flex items-center space-x-4">
            <span>Client-Side Architecture</span>
            <span>•</span>
            <span>Zero Remote Storage</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
