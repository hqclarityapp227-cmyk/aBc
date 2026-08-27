import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileType,
  Sparkles,
  ArrowRight,
  Eye,
  Check,
  AlertTriangle
} from 'lucide-react';
import { ParsedWorkbook, RawSheetData } from '../types';
import { parseFile } from '../engine/fileParser';
import { SAMPLE_DATASETS, SampleDatasetOption } from '../sampleData/sampleDatasets';
import { formatErrorMessage } from '../engine/errors';

interface UploadStepProps {
  workbook: ParsedWorkbook | null;
  onWorkbookLoaded: (wb: ParsedWorkbook) => void;
  onProceedToMapping: () => void;
}

export const UploadStep: React.FC<UploadStepProps> = ({
  workbook,
  onWorkbookLoaded,
  onProceedToMapping,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const validExtensions = ['csv', 'xlsx', 'xls'];
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (!ext || !validExtensions.includes(ext)) {
      setErrorMessage('Unsupported file format. Please upload a CSV or XLSX/XLS file.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    try {
      const parsed = await parseFile(file);
      if (parsed.sheets.length === 0 || parsed.sheets[0].rows.length === 0) {
        throw new Error('The uploaded file appears to be empty or has no readable rows.');
      }
      setSelectedSheetIndex(0);
      onWorkbookLoaded(parsed);
    } catch (err) {
      setErrorMessage(formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const loadSampleDataset = (sample: SampleDatasetOption) => {
    setErrorMessage(null);
    setSelectedSheetIndex(0);
    onWorkbookLoaded(sample.workbook);
  };

  const activeSheet: RawSheetData | undefined = workbook?.sheets[selectedSheetIndex];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner / Explanation */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          1. Upload Your Sales File
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Upload your sales spreadsheet in <span className="font-semibold text-slate-800">CSV</span> or <span className="font-semibold text-slate-800">Excel (.xlsx)</span> format. 
          We will automatically read your columns, clean up dates and numbers, and help you calculate sales commissions in seconds.
        </p>
      </div>

      {/* Upload Drop Zone & Sample Presets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Upload Drop Zone */}
        <div className="lg:col-span-2 space-y-4">
          <div
            id="file-dropzone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all bg-white cursor-pointer ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/60'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              id="input-file-upload"
              accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-slate-600 mb-3">
              <Upload className="w-6 h-6" />
            </div>

            <h3 className="text-base font-semibold text-slate-900">
              Drop your sales spreadsheet here
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              or click here to choose a file from your computer (Excel or CSV)
            </p>

            <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-slate-500 font-mono">
              <span className="flex items-center space-x-1">
                <FileType className="w-3.5 h-3.5 text-blue-600" />
                <span>CSV</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center space-x-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel (.xlsx / .xls)</span>
              </span>
            </div>

            {isLoading && (
              <div className="mt-4 text-xs font-medium text-emerald-600 animate-pulse">
                Reading your file...
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 text-red-800 text-sm">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to read file</p>
                <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Test Datasets Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-slate-800 font-semibold text-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Try with Sample Data</span>
          </div>
          <p className="text-xs text-slate-500">
            Don&apos;t have a file ready? Click any example to see how it works instantly:
          </p>

          <div className="space-y-2.5">
            {SAMPLE_DATASETS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                id={`btn-load-sample-${sample.id}`}
                onClick={() => loadSampleDataset(sample)}
                className="w-full text-left p-3 bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-lg transition group shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 group-hover:text-emerald-800">
                    {sample.title}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-mono">
                    {sample.fileType.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {sample.description}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {sample.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sheet Inspection & Preview Table (When File is Loaded) */}
      {workbook && activeSheet && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  File Loaded Successfully
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Loaded <span className="font-semibold text-slate-800">{workbook.fileName}</span> • Found {activeSheet.totalRowCount} sales rows and {activeSheet.headers.length} columns.
              </p>
            </div>

            {/* Sheet Tabs (if multi-sheet) */}
            {workbook.sheets.length > 1 && (
              <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
                <span className="text-xs text-slate-500 px-2">Worksheet Tabs:</span>
                {workbook.sheets.map((s, idx) => (
                  <button
                    key={s.sheetName}
                    type="button"
                    onClick={() => {
                      setSelectedSheetIndex(idx);
                      onWorkbookLoaded({
                        ...workbook,
                        activeSheetName: s.sheetName,
                      });
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                      selectedSheetIndex === idx
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s.sheetName} ({s.totalRowCount} rows)
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Column Summary Badges */}
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1.5">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Columns found in your file ({activeSheet.headers.length}):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeSheet.headers.map((h, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-xs bg-slate-100 border border-slate-200 text-slate-700 rounded-md font-mono"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* Raw Preview Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500 border-b border-slate-200 flex justify-between items-center">
              <span>Preview of first {Math.min(activeSheet.rows.length, 10)} sales rows</span>
              <span className="text-[11px] text-slate-400">Total {activeSheet.totalRowCount} rows</span>
            </div>
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 border-r border-slate-200 w-12 text-center text-slate-400">#</th>
                    {activeSheet.headers.map((header, idx) => (
                      <th key={idx} className="px-3 py-2 border-r border-slate-200 whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px] text-slate-700">
                  {activeSheet.rows.slice(0, 10).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50">
                      <td className="px-3 py-1.5 border-r border-slate-200 text-center text-slate-400">
                        {rIdx + 1}
                      </td>
                      {activeSheet.headers.map((header, cIdx) => (
                        <td key={cIdx} className="px-3 py-1.5 border-r border-slate-200 whitespace-nowrap max-w-xs truncate">
                          {row[header] !== undefined ? String(row[header]) : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Next Step Action */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              id="btn-proceed-to-mapping"
              onClick={onProceedToMapping}
              className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow-sm transition cursor-pointer"
            >
              <span>Next: Match Columns</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
