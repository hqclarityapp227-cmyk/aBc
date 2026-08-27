import React from 'react';
import {
  X,
  Calculator,
  FileText,
  AlertTriangle,
  CheckCircle,
  Hash,
  User,
  Calendar,
  Layers,
  ShieldCheck,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import { ProcessedRecord } from '../types';

interface RowTraceModalProps {
  record: ProcessedRecord | null;
  onClose: () => void;
}

export const RowTraceModal: React.FC<RowTraceModalProps> = ({ record, onClose }) => {
  if (!record) return null;

  const { normalized, calculation, issues, status, rowIndex } = record;
  const qual = calculation.qualification;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-mono text-xs font-bold">
              #{rowIndex}
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center space-x-2">
                <span>Transaction Trace: {normalized.transactionId || `Row #${rowIndex}`}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${
                    status === 'valid'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : status === 'has_warnings'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {status.replace('_', ' ')}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Deterministic source audit, qualification result, and mathematical calculation trace
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-trace-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Qualification Status Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
              qual?.isQualified
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : qual?.isRefund
                ? 'bg-rose-50 border-rose-200 text-rose-950'
                : 'bg-slate-100 border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-start space-x-2.5">
              {qual?.isQualified ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Ban className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs">
                    Qualification Status: {qual?.status.toUpperCase() || 'EVALUATED'}
                  </span>
                  {qual?.isRefund && (
                    <span className="px-1.5 py-0.2 bg-rose-200 text-rose-800 text-[10px] font-bold rounded">
                      Refund / Return
                    </span>
                  )}
                </div>
                <p className="text-[11px] mt-0.5">
                  {qual?.reasons && qual.reasons.length > 0
                    ? qual.reasons.join(' • ')
                    : qual?.isQualified
                    ? 'Qualified for standard commission payout.'
                    : 'Non-qualifying deal.'}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-500 uppercase block">Rule Preset</span>
              <span className="font-semibold text-xs text-slate-800">{calculation.ruleApplied}</span>
            </div>
          </div>

          {/* Validation Issues Alert (if any) */}
          {issues.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Flagged Quality Alerts ({issues.length})</span>
              </h3>
              <div className="space-y-2">
                {issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border flex items-start space-x-3 ${
                      issue.severity === 'error'
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {issue.severity === 'error' ? (
                        <span className="px-1.5 py-0.5 bg-rose-200 text-rose-800 text-[10px] font-bold rounded">
                          ERROR
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 text-[10px] font-bold rounded">
                          WARN
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-xs">{issue.message}</p>
                      {issue.suggestedFix && (
                        <p className="text-[11px] opacity-90 mt-0.5">
                          Remedy: {issue.suggestedFix}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mathematical Calculation Breakdown */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center space-x-1.5 text-sm">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>Calculation & Commission Math Audit</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Commission Base</span>
                <p className="text-sm font-bold font-mono text-slate-900">
                  ${calculation.commissionBase.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Effective Rate</span>
                <p className="text-sm font-bold font-mono text-emerald-700">
                  {(calculation.effectiveRate * 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Base Commission</span>
                <p className="text-sm font-bold font-mono text-slate-900">
                  ${calculation.baseCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Total Payout</span>
                <p className="text-sm font-bold font-mono text-emerald-600">
                  ${calculation.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Marginal Tiers Breakdown Table if present */}
            {calculation.trace.marginalTiersBreakdown && calculation.trace.marginalTiersBreakdown.length > 0 && (
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 text-xs flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Graduated Marginal Tier Breakdown:</span>
                </span>
                <table className="w-full text-[11px] font-mono border-collapse">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-1 px-2 text-left">Bracket Span</th>
                      <th className="py-1 px-2 text-right">Taxable Portion</th>
                      <th className="py-1 px-2 text-right">Bracket Rate</th>
                      <th className="py-1 px-2 text-right">Earned Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calculation.trace.marginalTiersBreakdown.map((t, i) => (
                      <tr key={i}>
                        <td className="py-1 px-2 text-slate-700">{t.tierLabel}</td>
                        <td className="py-1 px-2 text-right font-medium">${t.taxableAmount.toFixed(2)}</td>
                        <td className="py-1 px-2 text-right text-emerald-700 font-bold">{(t.rate * 100).toFixed(1)}%</td>
                        <td className="py-1 px-2 text-right font-bold text-slate-900">${t.tierCommission.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Formula Narrative */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1 font-mono text-[11px]">
              <span className="font-bold text-slate-800 font-sans">Formula Breakdown:</span>
              <p className="text-slate-700 bg-slate-100 p-2 rounded break-words font-mono">
                {calculation.trace.formulaDescription}
              </p>
            </div>
          </div>

          {/* Normalized vs Original Data Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Normalized Record Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Normalized Record Values</span>
              </h4>
              <dl className="space-y-1.5 text-[11px] divide-y divide-slate-100">
                <div className="flex justify-between pt-1">
                  <dt className="text-slate-500">Sales Representative:</dt>
                  <dd className="font-semibold text-slate-800">{normalized.salesRep || 'Unassigned'}</dd>
                </div>
                <div className="flex justify-between pt-1">
                  <dt className="text-slate-500">Deal Stage:</dt>
                  <dd className="font-medium text-slate-800">{normalized.dealStage || '-'}</dd>
                </div>
                <div className="flex justify-between pt-1">
                  <dt className="text-slate-500">Date (ISO):</dt>
                  <dd className="font-mono text-slate-800">{normalized.date || 'N/A'}</dd>
                </div>
                <div className="flex justify-between pt-1">
                  <dt className="text-slate-500">Customer:</dt>
                  <dd className="text-slate-800">{normalized.customer || '-'}</dd>
                </div>
                <div className="flex justify-between pt-1">
                  <dt className="text-slate-500">Product Category:</dt>
                  <dd className="font-medium text-slate-800">{normalized.productCategory}</dd>
                </div>
                <div className="flex justify-between pt-1">
                  <dt className="text-slate-500">Gross Sale Amount:</dt>
                  <dd className="font-mono font-semibold text-slate-800">${normalized.grossAmount.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between pt-1">
                  <dt className="text-slate-500">Discount Amount:</dt>
                  <dd className="font-mono text-slate-800">${normalized.discountAmount.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between pt-1">
                  <dt className="text-slate-500">Net Sale Amount:</dt>
                  <dd className="font-mono font-bold text-emerald-700">${normalized.netAmount.toFixed(2)}</dd>
                </div>
              </dl>
            </div>

            {/* Original Row Data Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Original File Row Data (Row #{rowIndex})</span>
              </h4>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 overflow-x-auto max-h-48">
                <table className="w-full text-[11px] font-mono">
                  <tbody>
                    {Object.entries(normalized.originalData).map(([col, val]) => (
                      <tr key={col} className="border-b border-slate-100 last:border-0">
                        <td className="py-1 pr-2 text-slate-500 font-semibold">{col}:</td>
                        <td className="py-1 text-slate-800 truncate max-w-[180px]">{String(val)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Close Trace
          </button>
        </div>
      </div>
    </div>
  );
};
