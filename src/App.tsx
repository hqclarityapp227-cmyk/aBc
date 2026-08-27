/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { UploadStep } from './components/UploadStep';
import { MappingStep } from './components/MappingStep';
import { RulesStep } from './components/RulesStep';
import { ReviewStep } from './components/ReviewStep';
import { ExportStep } from './components/ExportStep';
import { ProUpgradeModal } from './components/ProUpgradeModal';
import { useProLicense } from './hooks/useProLicense';
import {
  ParsedWorkbook,
  ColumnMapping,
  CommissionRuleSet,
  ProcessingSummary,
  STANDARD_FIELDS,
} from './types';
import { detectColumns, DetectionResult } from './engine/columnDetector';
import { normalizeDataset } from './engine/dataNormalizer';
import { validateRecords } from './engine/dataValidator';
import { calculateAllRecords } from './engine/calculationEngine';
import { generateProcessingSummary } from './engine/reportingEngine';
import { DEFAULT_TIERED_RULESET } from './engine/businessRules';
import { formatErrorMessage } from './engine/errors';

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxStepReached, setMaxStepReached] = useState<number>(1);
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [ruleSet, setRuleSet] = useState<CommissionRuleSet>({ ...DEFAULT_TIERED_RULESET });
  const [summary, setSummary] = useState<ProcessingSummary | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Pro Licensing State & Modal Manager
  const {
    isUnlocked,
    isModalOpen,
    openModal,
    closeModal,
    handleUnlockedSuccess,
  } = useProLicense();

  // Ensure browser document title is set
  useEffect(() => {
    document.title = 'Commission Engine Pro | Sales Commission Calculator';
  }, []);

  // When a workbook is loaded, run auto column detection
  const handleWorkbookLoaded = (wb: ParsedWorkbook) => {
    setWorkbook(wb);
    setErrorBanner(null);

    const activeSheet = wb.sheets.find((s) => s.sheetName === wb.activeSheetName) || wb.sheets[0];
    if (activeSheet) {
      const { mapping: autoMapping, detections: autoDetections } = detectColumns(
        activeSheet.headers,
        activeSheet.rows
      );
      setMapping(autoMapping);
      setDetections(autoDetections);
    }

    setMaxStepReached((prev) => Math.max(prev, 1));
  };

  // Re-run auto detect
  const handleAutoDetect = () => {
    if (!workbook) return;
    const activeSheet = workbook.sheets.find((s) => s.sheetName === workbook.activeSheetName) || workbook.sheets[0];
    if (activeSheet) {
      const { mapping: autoMapping, detections: autoDetections } = detectColumns(
        activeSheet.headers,
        activeSheet.rows
      );
      setMapping(autoMapping);
      setDetections(autoDetections);
    }
  };

  // Clear mappings
  const handleResetMapping = () => {
    const emptyMapping: ColumnMapping = {};
    STANDARD_FIELDS.forEach((f) => {
      emptyMapping[f.key] = '';
    });
    setMapping(emptyMapping);
    setDetections([]);
  };

  // Update single column mapping
  const handleUpdateMapping = (fieldKey: string, columnHeader: string) => {
    setMapping((prev) => ({
      ...prev,
      [fieldKey]: columnHeader,
    }));
  };

  // Execute Core Calculation Engine
  const handleRunEngine = () => {
    if (!workbook) return;
    setErrorBanner(null);

    try {
      const activeSheet = workbook.sheets.find((s) => s.sheetName === workbook.activeSheetName) || workbook.sheets[0];
      if (!activeSheet || activeSheet.rows.length === 0) {
        throw new Error('No data rows found in the selected sheet.');
      }

      // Step 1: Normalize
      const normalizedRecords = normalizeDataset(activeSheet.rows, mapping);

      // Step 2: Validate
      const { issues, issuesByRow } = validateRecords(normalizedRecords);

      // Step 3: Calculate Commissions Deterministically
      const processedRecords = calculateAllRecords(normalizedRecords, ruleSet, issuesByRow);

      // Step 4: Generate Aggregated Summaries & Analytics
      const processingSummary = generateProcessingSummary(processedRecords, ruleSet, issues);

      setSummary(processingSummary);
      setCurrentStep(4);
      setMaxStepReached((prev) => Math.max(prev, 4));
    } catch (err) {
      setErrorBanner(formatErrorMessage(err));
    }
  };

  // Reset entire application session
  const handleReset = () => {
    setWorkbook(null);
    setMapping({});
    setDetections([]);
    setSummary(null);
    setErrorBanner(null);
    setCurrentStep(1);
    setMaxStepReached(1);
  };

  // Active sheet reference
  const activeSheet = workbook?.sheets.find((s) => s.sheetName === workbook.activeSheetName) || workbook?.sheets[0];

  // Extract detected distinct categories, reps, and stages for quick autocomplete
  const { availableCategories, availableReps, availableStages } = useMemo(() => {
    if (!activeSheet) return { availableCategories: [], availableReps: [], availableStages: [] };

    const catSet = new Set<string>();
    const repSet = new Set<string>();
    const stageSet = new Set<string>();

    const catCol = mapping.productCategory;
    const repCol = mapping.salesRep;
    const stageCol = mapping.dealStage;

    activeSheet.rows.forEach((row) => {
      if (catCol && row[catCol]) {
        const val = String(row[catCol]).trim();
        if (val) catSet.add(val);
      }
      if (repCol && row[repCol]) {
        const val = String(row[repCol]).trim();
        if (val) repSet.add(val);
      }
      if (stageCol && row[stageCol]) {
        const val = String(row[stageCol]).trim();
        if (val) stageSet.add(val);
      }
    });

    return {
      availableCategories: Array.from(catSet),
      availableReps: Array.from(repSet),
      availableStages: Array.from(stageSet),
    };
  }, [activeSheet, mapping]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Navbar with Step Progression */}
      <Navbar
        currentStep={currentStep}
        onSelectStep={(step) => setCurrentStep(step)}
        maxStepReached={maxStepReached}
        fileName={workbook?.fileName}
        hasErrors={summary ? summary.errorRows > 0 : false}
        onReset={handleReset}
        isUnlocked={isUnlocked}
        onOpenProModal={() => openModal()}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {errorBanner && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs font-medium">
            <span className="font-bold">Error: </span>
            {errorBanner}
          </div>
        )}

        {/* Step 1: Import & Raw Sheet Inspector (100% Free) */}
        {currentStep === 1 && (
          <UploadStep
            workbook={workbook}
            onWorkbookLoaded={handleWorkbookLoaded}
            onProceedToMapping={() => {
              setCurrentStep(2);
              setMaxStepReached((prev) => Math.max(prev, 2));
            }}
          />
        )}

        {/* Step 2: Column Detection & Field Mapping (100% Free) */}
        {currentStep === 2 && activeSheet && (
          <MappingStep
            sheet={activeSheet}
            mapping={mapping}
            detections={detections}
            onUpdateMapping={handleUpdateMapping}
            onAutoDetect={handleAutoDetect}
            onResetMapping={handleResetMapping}
            onBack={() => setCurrentStep(1)}
            onProceed={() => {
              setCurrentStep(3);
              setMaxStepReached((prev) => Math.max(prev, 3));
            }}
          />
        )}

        {/* Step 3: Commission Rules Configuration (100% Free) */}
        {currentStep === 3 && (
          <RulesStep
            ruleSet={ruleSet}
            onUpdateRuleSet={setRuleSet}
            onBack={() => setCurrentStep(2)}
            onRunEngine={handleRunEngine}
            availableCategories={availableCategories}
            availableReps={availableReps}
            availableStages={availableStages}
          />
        )}

        {/* Step 4: Results Review, Analytics & Issues Quality Log (100% Free on screen) */}
        {currentStep === 4 && summary && (
          <ReviewStep
            summary={summary}
            onBackToRules={() => setCurrentStep(3)}
            onProceedToExport={() => {
              setCurrentStep(5);
              setMaxStepReached((prev) => Math.max(prev, 5));
            }}
            isUnlocked={isUnlocked}
            onRequirePro={(cb) => openModal(cb)}
          />
        )}

        {/* Step 5: Finished Excel Workbook Generation & Download (Requires Pro Pass for downloads) */}
        {currentStep === 5 && summary && (
          <ExportStep
            summary={summary}
            onBackToReview={() => setCurrentStep(4)}
            onReset={handleReset}
            isUnlocked={isUnlocked}
            onRequirePro={(cb) => openModal(cb)}
          />
        )}
      </main>

      {/* Pro Upgrade / License Activation Modal */}
      <ProUpgradeModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onUnlockedSuccess={handleUnlockedSuccess}
      />

      {/* Subtle Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>Sales Commission Calculator • All calculations run directly in your browser</p>
      </footer>
    </div>
  );
}
