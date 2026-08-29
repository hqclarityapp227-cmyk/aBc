import React, { useState } from 'react';
import {
  Sparkles,
  ExternalLink,
  Key,
  CheckCircle2,
  Lock,
  X,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import {
  validateLicenseWithServer,
  persistValidatedLicense,
  STORAGE_KEY_PRO_UNLOCKED,
  STORAGE_KEY_LICENSE,
} from '../engine/licenseValidator';
import {
  WHOP_CHECKOUT_URL,
  getWhopCheckoutUrl,
} from '../utils/whopAffiliate';

export { STORAGE_KEY_PRO_UNLOCKED, STORAGE_KEY_LICENSE, WHOP_CHECKOUT_URL, getWhopCheckoutUrl };

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockedSuccess?: () => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  onUnlockedSuccess,
}) => {
  const [inputKey, setInputKey] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  if (!isOpen) return null;

  const handleActivateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputKey.trim();

    if (!trimmed) {
      setErrorMsg('Please enter your Whop License Key to unlock.');
      return;
    }

    try {
      setIsValidating(true);
      setErrorMsg(null);

      // Send request to Netlify Serverless Function (which validates with Whop API)
      const validation = await validateLicenseWithServer(trimmed);

      if (!validation.isValid) {
        setErrorMsg(validation.error || 'Invalid or expired License Key. Please check your Whop account.');
        setIsValidating(false);
        return;
      }

      // Save strictly validated license state in browser localStorage
      persistValidatedLicense(validation.formattedKey || trimmed);

      setErrorMsg(null);
      setSuccessMsg(true);

      setTimeout(() => {
        onClose();
        if (onUnlockedSuccess) {
          onUnlockedSuccess();
        }
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error validating license key. Please check your connection and try again.');
    } finally {
      setIsValidating(false);
    }
  };


  const handleOpenWhopCheckout = () => {
    window.open(getWhopCheckoutUrl(), '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id="modal-pro-upgrade"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 relative">
          <button
            type="button"
            id="btn-close-pro-modal"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1.5">
            <Sparkles className="w-4 h-4" />
            <span>Commission Engine Pro Pass</span>
          </div>

          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Unlock Full Excel Downloads
          </h2>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Uploading, column matching, calculating, and previewing on screen is <strong>100% free</strong>. An active Pro pass is required to download finished multi-sheet Excel workbooks.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Option 1: Subscribe on Whop */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 space-y-3.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded-full">
                  Choice 1 • New Membership
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Get Instant Pro Access
                </h3>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-slate-900">$19</div>
                <div className="text-[11px] text-slate-500 font-medium">/ month</div>
              </div>
            </div>

            <ul className="text-xs text-slate-700 space-y-2">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Unlimited formatted <strong>.xlsx Excel</strong> & CSV workbooks</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All 6 formatted tabs (Summary, Rep Rollups, Audit Ledger, Issues)</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant license key delivered immediately upon checkout</span>
              </li>
            </ul>

            <button
              type="button"
              id="btn-whop-subscribe-link"
              onClick={handleOpenWhopCheckout}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Subscribe on Whop ($19/mo)</span>
              <ExternalLink className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-center text-slate-500">
              Opens secure Whop checkout in a new browser tab. Cancel anytime with 1 click.
            </p>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
              OR Choice 2 • Existing Member
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* Option 2: Enter Whop License Key */}
          <form onSubmit={handleActivateKey} className="space-y-3">
            <div>
              <label
                htmlFor="input-license-key"
                className="block text-xs font-bold text-slate-800 mb-1"
              >
                Enter Your Whop License Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  id="input-license-key"
                  type="text"
                  value={inputKey}
                  onChange={(e) => {
                    setInputKey(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Paste your Whop license key here..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-emerald-800 text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>License Key Verified! Unlocking your download...</span>
              </div>
            )}

            <button
              type="submit"
              id="btn-activate-license-key"
              disabled={successMsg || isValidating}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span>Verifying with Whop API...</span>
                </>
              ) : successMsg ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>License Unlocked!</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Unlock Direct Excel Downloads</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </>
              )}
            </button>

            <p className="text-[10px] text-slate-500 text-center">
              Your unlocked status will be saved in your browser so you stay unlocked.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
