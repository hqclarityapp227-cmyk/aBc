import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  Layers,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Percent,
  Check,
  Zap,
  Calendar,
  Filter,
  Users,
  AlertOctagon,
  HelpCircle,
} from 'lucide-react';
import {
  CommissionRuleSet,
  CommissionTier,
  CategoryMultiplier,
  RepSpecificRule,
  CommissionModelType,
  RefundPolicyType,
  ReportingPeriodGranularity,
} from '../types';
import { PRESET_RULESETS } from '../engine/businessRules';

interface RulesStepProps {
  ruleSet: CommissionRuleSet;
  onUpdateRuleSet: (updated: CommissionRuleSet) => void;
  onBack: () => void;
  onRunEngine: () => void;
  availableCategories?: string[];
  availableReps?: string[];
  availableStages?: string[];
}

export const RulesStep: React.FC<RulesStepProps> = ({
  ruleSet,
  onUpdateRuleSet,
  onBack,
  onRunEngine,
  availableCategories = [],
  availableReps = [],
  availableStages = [],
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(ruleSet.id);
  const [newStageInput, setNewStageInput] = useState('');
  const [newCategoryExcludeInput, setNewCategoryExcludeInput] = useState('');
  const [activeTab, setActiveTab] = useState<'model_and_tiers' | 'qualification_and_period' | 'reps_and_categories'>('model_and_tiers');

  const handleApplyPreset = (preset: CommissionRuleSet) => {
    setSelectedPresetId(preset.id);
    onUpdateRuleSet({ ...preset });
  };

  // Tier helpers
  const handleAddTier = () => {
    const lastTier = ruleSet.tiers[ruleSet.tiers.length - 1];
    const newMin = lastTier ? (lastTier.maxAmount || 20000) : 0;
    const newMax = newMin + 10000;
    const newTier: CommissionTier = {
      id: `tier-${Date.now()}`,
      minAmount: newMin,
      maxAmount: newMax,
      rate: 0.12,
      label: `Tier ${ruleSet.tiers.length + 1} ($${newMin.toLocaleString()} - $${newMax.toLocaleString()}): 12%`,
    };
    onUpdateRuleSet({
      ...ruleSet,
      tiers: [...ruleSet.tiers, newTier],
    });
  };

  const handleUpdateTier = (index: number, updated: Partial<CommissionTier>) => {
    const updatedTiers = [...ruleSet.tiers];
    updatedTiers[index] = { ...updatedTiers[index], ...updated };
    const t = updatedTiers[index];
    t.label = `Tier ${index + 1} ($${t.minAmount.toLocaleString()} - ${t.maxAmount ? `$${t.maxAmount.toLocaleString()}` : 'Unlimited'}): ${(t.rate * 100).toFixed(1)}%`;

    onUpdateRuleSet({
      ...ruleSet,
      tiers: updatedTiers,
    });
  };

  const handleRemoveTier = (index: number) => {
    onUpdateRuleSet({
      ...ruleSet,
      tiers: ruleSet.tiers.filter((_, idx) => idx !== index),
    });
  };

  // Category Multiplier helpers
  const handleAddCategory = () => {
    const newCat: CategoryMultiplier = {
      category: 'New Category',
      multiplier: 1.1,
      bonusFlatAmount: 0,
      isExcluded: false,
    };
    onUpdateRuleSet({
      ...ruleSet,
      categoryMultipliers: [...ruleSet.categoryMultipliers, newCat],
    });
  };

  const handleUpdateCategory = (index: number, updated: Partial<CategoryMultiplier>) => {
    const updatedCats = [...ruleSet.categoryMultipliers];
    updatedCats[index] = { ...updatedCats[index], ...updated };
    onUpdateRuleSet({
      ...ruleSet,
      categoryMultipliers: updatedCats,
    });
  };

  const handleRemoveCategory = (index: number) => {
    onUpdateRuleSet({
      ...ruleSet,
      categoryMultipliers: ruleSet.categoryMultipliers.filter((_, idx) => idx !== index),
    });
  };

  // Rep Override helpers
  const handleAddRepOverride = () => {
    const newRep: RepSpecificRule = {
      salesRep: availableReps[0] || 'Sales Rep Name',
      baseRateOverride: 0.10,
      fixedBonusTarget: 25000,
      fixedBonusAmount: 500,
      quotaTarget: 50000,
    };
    onUpdateRuleSet({
      ...ruleSet,
      repOverrides: [...(ruleSet.repOverrides || []), newRep],
    });
  };

  const handleUpdateRepOverride = (index: number, updated: Partial<RepSpecificRule>) => {
    const updatedReps = [...(ruleSet.repOverrides || [])];
    updatedReps[index] = { ...updatedReps[index], ...updated };
    onUpdateRuleSet({
      ...ruleSet,
      repOverrides: updatedReps,
    });
  };

  const handleRemoveRepOverride = (index: number) => {
    onUpdateRuleSet({
      ...ruleSet,
      repOverrides: (ruleSet.repOverrides || []).filter((_, idx) => idx !== index),
    });
  };

  // Stage filters helpers
  const handleAddStage = (stageName: string) => {
    const clean = stageName.trim();
    if (clean && !ruleSet.dealStageFilter.includes(clean)) {
      onUpdateRuleSet({
        ...ruleSet,
        dealStageFilter: [...ruleSet.dealStageFilter, clean],
      });
      setNewStageInput('');
    }
  };

  const handleRemoveStage = (stageName: string) => {
    onUpdateRuleSet({
      ...ruleSet,
      dealStageFilter: ruleSet.dealStageFilter.filter((s) => s !== stageName),
    });
  };

  // Category exclusion helpers
  const handleAddExcludedCategory = (catName: string) => {
    const clean = catName.trim();
    if (clean && !ruleSet.excludedCategories.includes(clean)) {
      onUpdateRuleSet({
        ...ruleSet,
        excludedCategories: [...ruleSet.excludedCategories, clean],
      });
      setNewCategoryExcludeInput('');
    }
  };

  const handleRemoveExcludedCategory = (catName: string) => {
    onUpdateRuleSet({
      ...ruleSet,
      excludedCategories: ruleSet.excludedCategories.filter((c) => c !== catName),
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              3. Set Your Commission Rates
            </h1>
          </div>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Choose how your sales team earns commission. Pick a standard flat percentage or tiered rates where bigger deals earn higher percentages.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Plan Preset:</span>
          </span>
          <div className="flex flex-wrap bg-slate-100 p-1 rounded-lg gap-1">
            {PRESET_RULESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                id={`btn-preset-${preset.id}`}
                onClick={() => handleApplyPreset(preset)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer ${
                  selectedPresetId === preset.id
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {preset.name.split(' (')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('model_and_tiers')}
          className={`pb-3 text-xs font-semibold flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === 'model_and_tiers'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Rates & Tier Levels</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('qualification_and_period')}
          className={`pb-3 text-xs font-semibold flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === 'qualification_and_period'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Deal Filters & Dates</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reps_and_categories')}
          className={`pb-3 text-xs font-semibold flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === 'reps_and_categories'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Special Rep & Product Rates</span>
        </button>
      </div>

      {/* Tab 1: Commission Model & Tier Brackets */}
      {activeTab === 'model_and_tiers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Model Type & Base Configuration */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">How to Calculate</h3>
              </div>

              {/* Model Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Commission Plan Type
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: 'tiered_cumulative', title: 'Tiered by Deal Size (Standard)', desc: 'The entire sale amount gets the rate for its tier' },
                    { id: 'tiered_marginal', title: 'Split into Tiers (Like Tax Brackets)', desc: 'Portions of the deal earn higher rates as amount increases' },
                    { id: 'flat', title: 'Single Flat Rate', desc: 'Same percentage on all sales' },
                    { id: 'category_based', title: 'Product Category Rates', desc: 'Different payout rates depending on the product sold' },
                  ].map((m) => (
                    <label
                      key={m.id}
                      className={`flex items-start space-x-2 p-2 rounded-lg border cursor-pointer transition ${
                        ruleSet.modelType === m.id
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-medium'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="modelType"
                        checked={ruleSet.modelType === m.id}
                        onChange={() =>
                          onUpdateRuleSet({
                            ...ruleSet,
                            modelType: m.id as CommissionModelType,
                          })
                        }
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-semibold block">{m.title}</span>
                        <span className="text-[11px] text-slate-500 block leading-tight">{m.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Basis Toggle: Gross vs Net */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pay Commission Based On
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateRuleSet({ ...ruleSet, applyTo: 'net' })}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition cursor-pointer ${
                      ruleSet.applyTo === 'net'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold ring-1 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Net Sale (After Discounts)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateRuleSet({ ...ruleSet, applyTo: 'gross' })}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition cursor-pointer ${
                      ruleSet.applyTo === 'gross'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold ring-1 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Gross Sale (Before Discounts)
                  </button>
                </div>
              </div>

              {/* Default Base Rate */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Standard Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={Math.round(ruleSet.defaultBaseRate * 1000) / 10}
                    onChange={(e) => {
                      const rate = parseFloat(e.target.value) / 100;
                      if (!isNaN(rate) && rate >= 0) {
                        onUpdateRuleSet({ ...ruleSet, defaultBaseRate: rate });
                      }
                    }}
                    className="w-full pl-3 pr-8 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>
            </div>

            {/* High Ticket Accelerator */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">Big Deal Bonus (Optional)</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-1">For Sales Above ($):</span>
                  <input
                    type="number"
                    step="500"
                    min="0"
                    value={ruleSet.highTicketThreshold}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      onUpdateRuleSet({ ...ruleSet, highTicketThreshold: val });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-1">Add Extra Cash Bonus ($):</span>
                  <input
                    type="number"
                    step="25"
                    min="0"
                    value={ruleSet.highTicketBonus}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      onUpdateRuleSet({ ...ruleSet, highTicketBonus: val });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right 2 Spans: Tier Brackets Editor */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Tier Levels ({ruleSet.tiers.length})
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {ruleSet.modelType === 'tiered_marginal'
                      ? 'Split model: each portion of the sale earns the rate for that tier level.'
                      : 'Tiered model: the full deal amount qualifies for the rate in its tier.'}
                  </p>
                </div>

                <button
                  type="button"
                  id="btn-add-tier"
                  onClick={handleAddTier}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tier Level</span>
                </button>
              </div>

              {ruleSet.tiers.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs text-slate-500">
                  No tiers active. Standard flat rate ({((ruleSet.defaultBaseRate || 0) * 100).toFixed(1)}%) will be used for all sales.
                </div>
              ) : (
                <div className="space-y-3">
                  {ruleSet.tiers.map((tier, idx) => (
                    <div
                      key={tier.id}
                      className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <span className="font-bold text-slate-800 w-16 shrink-0">
                        Tier {idx + 1}:
                      </span>

                      {/* Min Amount */}
                      <div className="flex items-center space-x-1">
                        <span className="text-slate-400 font-mono">$</span>
                        <input
                          type="number"
                          step="500"
                          min="0"
                          value={tier.minAmount}
                          onChange={(e) =>
                            handleUpdateTier(idx, { minAmount: parseFloat(e.target.value) || 0 })
                          }
                          className="w-24 px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                          placeholder="Min $"
                        />
                      </div>

                      <span className="text-slate-400 font-medium">to</span>

                      {/* Max Amount */}
                      <div className="flex items-center space-x-1">
                        <span className="text-slate-400 font-mono">$</span>
                        <input
                          type="text"
                          value={tier.maxAmount === null ? '∞' : tier.maxAmount}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            if (val === '∞' || val === '' || val.toLowerCase() === 'unlimited') {
                              handleUpdateTier(idx, { maxAmount: null });
                            } else {
                              const parsed = parseFloat(val);
                              if (!isNaN(parsed)) {
                                handleUpdateTier(idx, { maxAmount: parsed });
                              }
                            }
                          }}
                          className="w-24 px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                          placeholder="Max / ∞"
                        />
                      </div>

                      {/* Rate % */}
                      <div className="flex items-center space-x-1.5 ml-auto">
                        <span className="text-slate-500 font-medium">Rate:</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          value={Math.round(tier.rate * 1000) / 10}
                          onChange={(e) => {
                            const r = parseFloat(e.target.value) / 100;
                            if (!isNaN(r)) handleUpdateTier(idx, { rate: r });
                          }}
                          className="w-16 px-2 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs text-right font-bold text-emerald-700"
                        />
                        <span className="text-slate-500 font-mono">%</span>
                      </div>

                      {/* Delete Tier */}
                      <button
                        type="button"
                        onClick={() => handleRemoveTier(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                        title="Remove tier level"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Qualification, Exclusions, Refunds & Reporting Periods */}
      {activeTab === 'qualification_and_period' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Qualification & Deal Stages */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Filter className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Which Deals Qualify</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Included Deal Statuses
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Only sales marked with these statuses earn commission. (Leave empty to count all sales).
              </p>

              <div className="flex flex-wrap gap-1.5 mb-2">
                {ruleSet.dealStageFilter.map((stage) => (
                  <span
                    key={stage}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-md text-xs font-medium"
                  >
                    <span>{stage}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStage(stage)}
                      className="text-indigo-400 hover:text-indigo-700 font-bold cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStageInput}
                  onChange={(e) => setNewStageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddStage(newStageInput);
                    }
                  }}
                  placeholder="e.g. Closed Won, Paid..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                />
                <button
                  type="button"
                  onClick={() => handleAddStage(newStageInput)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Add Status
                </button>
              </div>

              {availableStages.length > 0 && (
                <div className="mt-2 text-[11px] text-slate-500">
                  <span>Found in your file: </span>
                  {availableStages.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleAddStage(s)}
                      className="underline mr-2 text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      +{s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Minimum Deal Value */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Sale Amount to Earn Commission ($)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="10"
                  min="0"
                  value={ruleSet.minimumDealThreshold}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0) {
                      onUpdateRuleSet({ ...ruleSet, minimumDealThreshold: val });
                    }
                  }}
                  className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
                />
                <span className="text-slate-400 absolute left-3 top-2 text-xs font-mono">$</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Sales smaller than this dollar amount will receive $0 commission.
              </p>
            </div>

            {/* Excluded Product Categories */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Excluded Categories
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Items in these categories (like Shipping, Taxes, or Pass-Through fees) will not earn commission.
              </p>

              <div className="flex flex-wrap gap-1.5 mb-2">
                {ruleSet.excludedCategories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-medium"
                  >
                    <span>{cat}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExcludedCategory(cat)}
                      className="text-rose-400 hover:text-rose-700 font-bold cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryExcludeInput}
                  onChange={(e) => setNewCategoryExcludeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddExcludedCategory(newCategoryExcludeInput);
                    }
                  }}
                  placeholder="e.g. Shipping, Tax..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                />
                <button
                  type="button"
                  onClick={() => handleAddExcludedCategory(newCategoryExcludeInput)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Exclude
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Reporting Period & Refund Policy */}
          <div className="space-y-6">
            {/* Reporting Period Config */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Dates & Payroll Periods</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Group Summaries By
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'monthly', label: 'Monthly' },
                    { id: 'quarterly', label: 'Quarterly' },
                    { id: 'annual', label: 'Annual' },
                    { id: 'all_dates', label: 'All Dates (Full File)' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() =>
                        onUpdateRuleSet({
                          ...ruleSet,
                          reportingPeriod: {
                            ...(ruleSet.reportingPeriod || { enforcePeriodExclusion: false }),
                            granularity: g.id as ReportingPeriodGranularity,
                          },
                        })
                      }
                      className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition cursor-pointer ${
                        (ruleSet.reportingPeriod?.granularity || 'all_dates') === g.id
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold ring-1 ring-emerald-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range Filter */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  Only Pay for Dates (Optional)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">Start Date:</span>
                    <input
                      type="date"
                      value={ruleSet.reportingPeriod?.customStartDate || ''}
                      onChange={(e) =>
                        onUpdateRuleSet({
                          ...ruleSet,
                          reportingPeriod: {
                            ...(ruleSet.reportingPeriod || { granularity: 'monthly', enforcePeriodExclusion: false }),
                            customStartDate: e.target.value || undefined,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">End Date:</span>
                    <input
                      type="date"
                      value={ruleSet.reportingPeriod?.customEndDate || ''}
                      onChange={(e) =>
                        onUpdateRuleSet({
                          ...ruleSet,
                          reportingPeriod: {
                            ...(ruleSet.reportingPeriod || { granularity: 'monthly', enforcePeriodExclusion: false }),
                            customEndDate: e.target.value || undefined,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 font-mono"
                    />
                  </div>
                </div>

                <label className="flex items-start space-x-2 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ruleSet.reportingPeriod?.enforcePeriodExclusion || false}
                    onChange={(e) =>
                      onUpdateRuleSet({
                        ...ruleSet,
                        reportingPeriod: {
                          ...(ruleSet.reportingPeriod || { granularity: 'monthly' }),
                          enforcePeriodExclusion: e.target.checked,
                        },
                      })
                    }
                    className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800">
                      Ignore sales outside this date range
                    </span>
                    <p className="text-[11px] text-slate-500">
                      When checked, transactions before the start date or after the end date will not earn commission.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Refund & Cancellation Policy */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">Refunds & Returns</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  How to handle refunded orders
                </label>
                <div className="space-y-1.5">
                  {[
                    {
                      id: 'full_clawback',
                      title: 'Deduct Commission (Standard)',
                      desc: 'Deducts commission from the rep proportionally on refunded sales.',
                    },
                    {
                      id: 'flat_penalty',
                      title: 'Flat Fee Penalty',
                      desc: 'Deducts a fixed fee for each returned order.',
                    },
                    {
                      id: 'no_deduction',
                      title: 'No Deductions',
                      desc: 'Ignore refunds (does not take back commission on returned orders).',
                    },
                  ].map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-start space-x-2 p-2 rounded-lg border cursor-pointer transition ${
                        ruleSet.refundPolicy === p.id
                          ? 'bg-rose-50 border-rose-300 text-rose-950 font-medium'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="refundPolicy"
                        checked={ruleSet.refundPolicy === p.id}
                        onChange={() =>
                          onUpdateRuleSet({
                            ...ruleSet,
                            refundPolicy: p.id as RefundPolicyType,
                          })
                        }
                        className="mt-0.5 text-rose-600 focus:ring-rose-500"
                      />
                      <div>
                        <span className="text-xs font-semibold block">{p.title}</span>
                        <span className="text-[11px] text-slate-500 block leading-tight">{p.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {ruleSet.refundPolicy === 'flat_penalty' && (
                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-1">
                    Penalty Fee per Refund ($):
                  </span>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    value={ruleSet.refundFlatPenalty || 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      onUpdateRuleSet({ ...ruleSet, refundFlatPenalty: val });
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 font-mono"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Sales Reps & Category Adjustments */}
      {activeTab === 'reps_and_categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Rep Rules & Quota Targets */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Custom Rates per Sales Rep ({ruleSet.repOverrides?.length || 0})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Give specific salespeople their own commission percentage or monthly sales quota.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddRepOverride}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Rep Rate</span>
              </button>
            </div>

            {(!ruleSet.repOverrides || ruleSet.repOverrides.length === 0) ? (
              <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs text-slate-500">
                No custom rep rates set. Standard rates apply to everyone equally.
              </div>
            ) : (
              <div className="space-y-3">
                {ruleSet.repOverrides.map((rep, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={rep.salesRep}
                        onChange={(e) => handleUpdateRepOverride(idx, { salesRep: e.target.value })}
                        placeholder="Rep Name (e.g. Sarah Connor)"
                        className="px-2.5 py-1 bg-white border border-slate-300 rounded font-bold text-slate-800 text-xs w-48"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveRepOverride(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                        title="Remove rep rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Custom Rate (%):</span>
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="100"
                            value={rep.baseRateOverride !== undefined ? Math.round(rep.baseRateOverride * 1000) / 10 : ''}
                            onChange={(e) => {
                              const val = e.target.value ? parseFloat(e.target.value) / 100 : undefined;
                              handleUpdateRepOverride(idx, { baseRateOverride: val });
                            }}
                            placeholder="Optional %"
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono text-xs"
                          />
                          <span className="text-slate-400 font-mono">%</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block">Sales Target ($):</span>
                        <div className="flex items-center space-x-1">
                          <span className="text-slate-400 font-mono">$</span>
                          <input
                            type="number"
                            step="1000"
                            min="0"
                            value={rep.quotaTarget || ''}
                            onChange={(e) => {
                              const val = e.target.value ? parseFloat(e.target.value) : undefined;
                              handleUpdateRepOverride(idx, { quotaTarget: val });
                            }}
                            placeholder="e.g. 20000"
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Category Multipliers & Bonuses */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Category Boosts & Bonuses ({ruleSet.categoryMultipliers.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pay higher commission or bonus cash on specific products or services.
                </p>
              </div>

              <button
                type="button"
                id="btn-add-category-rule"
                onClick={handleAddCategory}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category Boost</span>
              </button>
            </div>

            {ruleSet.categoryMultipliers.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs text-slate-500">
                No category boosts configured. Standard rates apply to all items.
              </div>
            ) : (
              <div className="space-y-2.5">
                {ruleSet.categoryMultipliers.map((cat, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <input
                      type="text"
                      value={cat.category}
                      onChange={(e) => handleUpdateCategory(idx, { category: e.target.value })}
                      placeholder="Category Name"
                      className="w-36 px-2.5 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-800 text-xs"
                    />

                    <div className="flex items-center space-x-1">
                      <span className="text-slate-500">Rate Boost:</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        max="5"
                        value={cat.multiplier}
                        onChange={(e) => {
                          const m = parseFloat(e.target.value) || 1.0;
                          handleUpdateCategory(idx, { multiplier: m });
                        }}
                        className="w-16 px-2 py-1 bg-white border border-slate-300 rounded font-mono text-xs text-center"
                      />
                      <span className="text-slate-400 font-mono">x</span>
                    </div>

                    <div className="flex items-center space-x-1 ml-auto">
                      <span className="text-slate-500">Extra Cash:</span>
                      <span className="text-slate-400 font-mono">+$</span>
                      <input
                        type="number"
                        step="10"
                        min="0"
                        value={cat.bonusFlatAmount || 0}
                        onChange={(e) => {
                          const b = parseFloat(e.target.value) || 0;
                          handleUpdateCategory(idx, { bonusFlatAmount: b });
                        }}
                        className="w-16 px-2 py-1 bg-white border border-slate-300 rounded font-mono text-xs text-right"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                      title="Remove category boost"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation & Run Calculation Button */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          id="btn-back-to-mapping"
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Match Columns</span>
        </button>

        <button
          type="button"
          id="btn-run-calculation-engine"
          onClick={onRunEngine}
          className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Calculate Commissions</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};
