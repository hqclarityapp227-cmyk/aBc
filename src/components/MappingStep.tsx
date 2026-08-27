import React from 'react';
import {
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Wand2,
  RefreshCw,
  Info
} from 'lucide-react';
import {
  ColumnMapping,
  RawSheetData,
  STANDARD_FIELDS,
  StandardFieldDefinition
} from '../types';
import { DetectionResult, validateMappingCompleteness } from '../engine/columnDetector';

interface MappingStepProps {
  sheet: RawSheetData;
  mapping: ColumnMapping;
  detections: DetectionResult[];
  onUpdateMapping: (fieldKey: string, columnHeader: string) => void;
  onAutoDetect: () => void;
  onResetMapping: () => void;
  onBack: () => void;
  onProceed: () => void;
}

export const MappingStep: React.FC<MappingStepProps> = ({
  sheet,
  mapping,
  detections,
  onUpdateMapping,
  onAutoDetect,
  onResetMapping,
  onBack,
  onProceed,
}) => {
  const { isComplete, missingFields } = validateMappingCompleteness(mapping, STANDARD_FIELDS);

  // Helper to get sample non-empty values from a column
  const getSampleValues = (colHeader: string | undefined): string[] => {
    if (!colHeader || !sheet.rows) return [];
    const samples: string[] = [];
    for (const row of sheet.rows) {
      const val = row[colHeader];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        samples.push(String(val).trim());
        if (samples.length >= 3) break;
      }
    }
    return samples;
  };

  const getDetection = (key: string): DetectionResult | undefined => {
    return detections.find((d) => d.standardKey === key);
  };

  const mappedCount = Object.values(mapping).filter((v) => typeof v === 'string' && v.trim() !== '').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              2. Match Your Columns
            </h1>
          </div>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Match the column names from your file (like Rep Name, Sale Amount, and Date) so we know which numbers to calculate. We&apos;ve automatically matched what we could.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            id="btn-auto-detect-columns"
            onClick={onAutoDetect}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Auto-Match Columns</span>
          </button>
          <button
            type="button"
            id="btn-reset-mappings"
            onClick={onResetMapping}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Clear Choices</span>
          </button>
        </div>
      </div>

      {/* Mapping Status Bar */}
      <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
        isComplete
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-center space-x-2.5">
          {isComplete ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <div>
            <span className="font-bold">
              {isComplete
                ? 'Great! All required columns are matched.'
                : `Please match ${missingFields.length} missing required column(s): ${missingFields.map((f) => f.label).join(', ')}`}
            </span>
            <p className="text-[11px] opacity-90 mt-0.5">
              {mappedCount} of {STANDARD_FIELDS.length} fields connected from &quot;{sheet.sheetName}&quot;.
            </p>
          </div>
        </div>

        <span className="font-mono font-medium px-2.5 py-1 bg-white/80 rounded border border-current/20">
          {mappedCount}/{STANDARD_FIELDS.length} Matched
        </span>
      </div>

      {/* Mapping Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3 w-1/4">Commission Field</th>
                <th className="px-4 py-3 w-1/3">Column In Your File</th>
                <th className="px-4 py-3 w-1/6">Auto-Match Status</th>
                <th className="px-4 py-3 w-1/4">Sample Preview from File</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {STANDARD_FIELDS.map((field: StandardFieldDefinition) => {
                const currentSelectedCol = mapping[field.key] || '';
                const detection = getDetection(field.key);
                const sampleValues = getSampleValues(currentSelectedCol);
                const isFieldMapped = currentSelectedCol.trim() !== '';

                return (
                  <tr
                    key={field.key}
                    className={`hover:bg-slate-50/80 transition ${
                      field.required && !isFieldMapped ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    {/* Standard Field Info */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          {field.label}
                        </span>
                        {field.required ? (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded border border-rose-200">
                            Required
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-500 rounded">
                            Optional
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {field.description}
                      </p>
                    </td>

                    {/* Column Select Dropdown */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="space-y-1">
                        <select
                          id={`select-mapping-${field.key}`}
                          value={currentSelectedCol}
                          onChange={(e) => onUpdateMapping(field.key, e.target.value)}
                          className={`w-full px-3 py-2 text-xs rounded-lg border font-mono transition bg-white ${
                            isFieldMapped
                              ? 'border-emerald-500 ring-1 ring-emerald-500/20 text-slate-900 font-medium'
                              : field.required
                              ? 'border-amber-400 bg-amber-50/20 text-slate-600'
                              : 'border-slate-300 text-slate-500'
                          }`}
                        >
                          <option value="">-- None / Skip --</option>
                          {sheet.headers.map((header) => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                        {field.required && !isFieldMapped && (
                          <p className="text-[11px] text-amber-600 flex items-center space-x-1">
                            <Info className="w-3 h-3 shrink-0" />
                            <span>Select which column has this information to continue.</span>
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Confidence Badge */}
                    <td className="px-4 py-3.5 align-top">
                      {isFieldMapped && detection && detection.matchedColumn === currentSelectedCol ? (
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                              detection.confidence >= 0.9
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {Math.round(detection.confidence * 100)}% Match
                          </span>
                          <p className="text-[10px] text-slate-500">{detection.reason}</p>
                        </div>
                      ) : isFieldMapped ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          Selected by you
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Not selected</span>
                      )}
                    </td>

                    {/* Sample Values Preview */}
                    <td className="px-4 py-3.5 align-top">
                      {sampleValues.length > 0 ? (
                        <div className="space-y-1">
                          {sampleValues.map((sample, sIdx) => (
                            <div
                              key={sIdx}
                              className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 truncate max-w-xs"
                              title={sample}
                            >
                              {sample}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          {isFieldMapped ? 'No sample values found' : 'Choose a column above'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          id="btn-back-to-upload"
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Upload</span>
        </button>

        <button
          type="button"
          id="btn-proceed-to-rules"
          disabled={!isComplete}
          onClick={onProceed}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-medium transition shadow-sm ${
            isComplete
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>Next: Set Commission Rates</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
