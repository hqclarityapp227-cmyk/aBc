import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Key,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { WHOP_CHECKOUT_URL } from '../ProUpgradeModal';

interface LandingNavbarProps {
  onLaunchApp: () => void;
  onOpenProModal: () => void;
  isUnlocked: boolean;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onLaunchApp,
  onOpenProModal,
  isUnlocked,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md py-3'
          : 'bg-slate-950/80 backdrop-blur-sm border-b border-slate-900/60 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
                Definitely Not Spreadsheets
              </span>
              <span className="text-[11px] text-emerald-400 font-medium tracking-wide block">
                Sales Commission Engine
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <button
              onClick={() => scrollToSection('workflow-demo')}
              className="hover:text-emerald-400 transition cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-emerald-400 transition cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="hover:text-emerald-400 transition cursor-pointer"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="hover:text-emerald-400 transition cursor-pointer"
            >
              FAQ
            </button>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isUnlocked ? (
              <button
                type="button"
                onClick={onOpenProModal}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-700/80 transition cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pro Active</span>
              </button>
            ) : (
              <button
                type="button"
                id="landing-btn-have-key"
                onClick={onOpenProModal}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700/80 transition cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>Have Key?</span>
              </button>
            )}

            <button
              type="button"
              id="landing-btn-nav-try-free"
              onClick={onLaunchApp}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-bold rounded-lg shadow-sm shadow-emerald-900/30 transition hover:translate-y-[-1px] cursor-pointer"
            >
              <span>Try it free</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              type="button"
              onClick={onLaunchApp}
              className="px-3 py-1.5 bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg"
            >
              Try Free
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-5 space-y-3">
          <button
            onClick={() => scrollToSection('workflow-demo')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-300 hover:text-emerald-400"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-300 hover:text-emerald-400"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('pricing')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-300 hover:text-emerald-400"
          >
            Pricing
          </button>
          <button
            onClick={() => scrollToSection('faq')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-300 hover:text-emerald-400"
          >
            FAQ
          </button>
          <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenProModal();
              }}
              className="w-full py-2 text-center text-xs font-medium text-slate-300 bg-slate-800 rounded-lg border border-slate-700"
            >
              Have a License Key?
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onLaunchApp();
              }}
              className="w-full py-2.5 bg-emerald-500 text-slate-950 font-bold text-sm rounded-lg flex items-center justify-center space-x-1"
            >
              <span>Launch App (Free to Try)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
