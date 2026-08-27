import { CommissionRuleSet } from '../types';

export const DEFAULT_TIERED_RULESET: CommissionRuleSet = {
  id: 'standard_tiered',
  name: 'Tiered Commission (5% - 12%)',
  description: 'Higher sales get higher commission rates, plus a bonus on large sales.',
  modelType: 'tiered_cumulative',
  defaultBaseRate: 0.06, // 6% base
  applyTo: 'net',
  minimumDealThreshold: 50,
  includeRefunds: true,
  refundPolicy: 'full_clawback',
  refundFlatPenalty: 0,
  highTicketThreshold: 5000,
  highTicketBonus: 100,
  tiers: [
    { id: 'tier-1', minAmount: 0, maxAmount: 1000, rate: 0.05, label: '$0 to $1,000: 5%' },
    { id: 'tier-2', minAmount: 1000, maxAmount: 5000, rate: 0.08, label: '$1,000 to $5,000: 8%' },
    { id: 'tier-3', minAmount: 5000, maxAmount: 15000, rate: 0.10, label: '$5,000 to $15,000: 10%' },
    { id: 'tier-4', minAmount: 15000, maxAmount: null, rate: 0.12, label: '$15,000+: 12%' },
  ],
  categoryMultipliers: [
    { category: 'Software', multiplier: 1.2, bonusFlatAmount: 0 },
    { category: 'Services', multiplier: 1.0, bonusFlatAmount: 25 },
    { category: 'Hardware', multiplier: 0.8, bonusFlatAmount: 0 },
    { category: 'Consulting', multiplier: 1.15, bonusFlatAmount: 50 },
    { category: 'Enterprise', multiplier: 1.25, bonusFlatAmount: 100 },
  ],
  repOverrides: [],
  dealStageFilter: ['Closed Won', 'Paid', 'Completed', 'Won', 'Active', 'Settled'],
  excludedCategories: ['Pass-Through', 'Tax', 'Shipping'],
  reportingPeriod: {
    granularity: 'monthly',
    enforcePeriodExclusion: false,
  },
};

export const MARGINAL_TIERED_RULESET: CommissionRuleSet = {
  id: 'marginal_graduated',
  name: 'Graduated Tiers (Split by Bracket)',
  description: 'Each portion of a sale is calculated at its tier rate (like income tax brackets).',
  modelType: 'tiered_marginal',
  defaultBaseRate: 0.05,
  applyTo: 'net',
  minimumDealThreshold: 0,
  includeRefunds: true,
  refundPolicy: 'full_clawback',
  refundFlatPenalty: 0,
  highTicketThreshold: 12000,
  highTicketBonus: 200,
  tiers: [
    { id: 'm-tier-1', minAmount: 0, maxAmount: 2500, rate: 0.04, label: 'First $2,500 @ 4%' },
    { id: 'm-tier-2', minAmount: 2500, maxAmount: 7500, rate: 0.07, label: '$2,500 - $7,500 @ 7%' },
    { id: 'm-tier-3', minAmount: 7500, maxAmount: 20000, rate: 0.10, label: '$7,500 - $20,000 @ 10%' },
    { id: 'm-tier-4', minAmount: 20000, maxAmount: null, rate: 0.14, label: 'Above $20,000 @ 14%' },
  ],
  categoryMultipliers: [
    { category: 'Software', multiplier: 1.1, bonusFlatAmount: 0 },
    { category: 'Services', multiplier: 1.0, bonusFlatAmount: 0 },
    { category: 'Hardware', multiplier: 0.85, bonusFlatAmount: 0 },
  ],
  repOverrides: [],
  dealStageFilter: ['Closed Won', 'Paid', 'Completed', 'Won', 'Active'],
  excludedCategories: ['Support Contract', 'Pass-Through'],
  reportingPeriod: {
    granularity: 'monthly',
    enforcePeriodExclusion: false,
  },
};

export const FLAT_RATE_RULESET: CommissionRuleSet = {
  id: 'flat_standard',
  name: 'Simple Flat Rate (8%)',
  description: 'Same 8% commission on every sale for all reps and products.',
  modelType: 'flat',
  defaultBaseRate: 0.08,
  applyTo: 'gross',
  minimumDealThreshold: 0,
  includeRefunds: true,
  refundPolicy: 'full_clawback',
  refundFlatPenalty: 0,
  highTicketThreshold: 10000,
  highTicketBonus: 200,
  tiers: [],
  categoryMultipliers: [],
  repOverrides: [],
  dealStageFilter: [],
  excludedCategories: [],
  reportingPeriod: {
    granularity: 'all_dates',
    enforcePeriodExclusion: false,
  },
};

export const SAAS_RECURRING_RULESET: CommissionRuleSet = {
  id: 'saas_recurring',
  name: 'Product & Subscription Plan',
  description: '10% base rate with higher bonus payouts on annual and enterprise plans.',
  modelType: 'category_based',
  defaultBaseRate: 0.10,
  applyTo: 'net',
  minimumDealThreshold: 100,
  includeRefunds: true,
  refundPolicy: 'full_clawback',
  refundFlatPenalty: 0,
  highTicketThreshold: 8000,
  highTicketBonus: 250,
  tiers: [
    { id: 'saas-1', minAmount: 0, maxAmount: 3000, rate: 0.08, label: 'Starter (< $3,000): 8%' },
    { id: 'saas-2', minAmount: 3000, maxAmount: 10000, rate: 0.12, label: 'Growth ($3,000 - $10,000): 12%' },
    { id: 'saas-3', minAmount: 10000, maxAmount: null, rate: 0.15, label: 'Enterprise ($10,000+): 15%' },
  ],
  categoryMultipliers: [
    { category: 'Annual Plan', multiplier: 1.3, bonusFlatAmount: 75 },
    { category: 'Enterprise Plan', multiplier: 1.25, bonusFlatAmount: 150 },
    { category: 'Monthly Plan', multiplier: 0.9, bonusFlatAmount: 0 },
    { category: 'Add-On', multiplier: 1.1, bonusFlatAmount: 10 },
  ],
  repOverrides: [],
  dealStageFilter: ['Closed Won', 'Paid', 'Completed', 'Active'],
  excludedCategories: ['Refund', 'Free Trial'],
  reportingPeriod: {
    granularity: 'quarterly',
    enforcePeriodExclusion: false,
  },
};

export const PRESET_RULESETS: CommissionRuleSet[] = [
  DEFAULT_TIERED_RULESET,
  MARGINAL_TIERED_RULESET,
  FLAT_RATE_RULESET,
  SAAS_RECURRING_RULESET,
];

