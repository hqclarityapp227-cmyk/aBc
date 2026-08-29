import React, { useState } from 'react';
import { ChevronDown, Sparkles, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Are my company’s sales and commission numbers kept private?',
      answer:
        'Yes, completely. 100% of the file parsing, anomaly cleaning, commission math, and Excel file generation runs directly in your web browser’s memory. Your sensitive revenue, payroll, and customer records are never uploaded to any remote server or stored in any database.',
    },
    {
      question: 'What spreadsheet and export file formats are supported?',
      answer:
        'You can upload standard CSV files, modern Excel workbooks (.xlsx), and legacy binary spreadsheets (.xls). If your file contains multiple sheets, our importer lets you inspect and choose any worksheet tab, and automatically skips decorative title banners or empty rows.',
    },
    {
      question: 'How does it handle messy dates, European numbers, and refunds?',
      answer:
        'The built-in data normalizer automatically handles European comma decimals (e.g., 1.250,50), international currency symbols (€, £, ¥, CAD), Excel serial dates (e.g., 45488), and accounting negative parentheses (($1,250.00)). Refunds are automatically deducted based on your chosen clawback policy.',
    },
    {
      question: 'What commission calculation models are supported?',
      answer:
        'You can configure Flat Rate plans, Cumulative Volume Tiers, Graduated Marginal Brackets (progressive bracket calculations), Product Category Multipliers, Minimum Deal Thresholds, High-Ticket Volume Bonuses, and Rep-Specific Custom Rate overrides.',
    },
    {
      question: 'Can I test my actual sales files for free before buying?',
      answer:
        'Yes! You can upload unlimited spreadsheets, configure all your commission rules, and inspect the complete calculation ledger, error log, and rep analytics directly on screen for free. The $19/month Pro Pass simply unlocks direct downloads of the styled multi-sheet Executive Excel (.xlsx) deliverable.',
    },
    {
      question: 'How does the $19/month Whop Pro Pass work?',
      answer:
        'When you subscribe on Whop, you receive an instant license key. Click "Have Key?" anywhere in the app to enter your key and unlock immediate Excel downloads across all your projects. You can manage or cancel your subscription at any time with one click in your Whop dashboard.',
    },
  ];

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-24 bg-slate-950 text-slate-100 border-t border-slate-900 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-slate-300 text-base leading-relaxed">
            Everything you need to know about processing, privacy, and licensing.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left font-bold text-slate-100 hover:text-white flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="text-sm sm:text-base">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-emerald-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
