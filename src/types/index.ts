export type FieldType = 'string' | 'number' | 'date' | 'currency' | 'email';

export interface StandardFieldDefinition {
  key: string;
  label: string;
  description: string;
  type: FieldType;
  required: boolean;
  aliases: string[];
}

export const STANDARD_FIELDS: StandardFieldDefinition[] = [
  {
    key: 'transactionId',
    label: 'Transaction / Order ID',
    description: 'Unique identifier for the sale or transaction',
    type: 'string',
    required: true,
    aliases: [
      'order_id', 'order id', 'order #', 'order number', 'order_no', 'order no', 'order num',
      'invoice_id', 'invoice #', 'invoice no', 'invoice number', 'invoice_num', 'invoice',
      'trans_id', 'transaction_id', 'transaction #', 'transaction id', 'txn_id', 'txn id', 'txn #',
      'id', 'deal_id', 'deal #', 'deal id', 'deal number', 'reference', 'ref', 'ref_id', 'ref #',
      'po_number', 'po #', 'po num', 'purchase_order', 'record_id'
    ]
  },
  {
    key: 'date',
    label: 'Sale Date',
    description: 'Date when the transaction or invoice was generated',
    type: 'date',
    required: true,
    aliases: [
      'date', 'sale_date', 'sale date', 'order_date', 'order date', 'transaction_date', 'transaction date',
      'invoice_date', 'invoice date', 'timestamp', 'created_at', 'created date', 'closed_date', 'close_date',
      'close date', 'txn_date', 'txn date', 'date of sale', 'sold date', 'posting_date', 'posting date',
      'booking_date', 'booking date', 'deal_date', 'deal date', 'payment_date', 'billing_date'
    ]
  },
  {
    key: 'salesRep',
    label: 'Sales Representative',
    description: 'Name or ID of the rep who made the sale',
    type: 'string',
    required: true,
    aliases: [
      'sales_rep', 'sales rep', 'rep', 'rep_name', 'rep name', 'salesperson', 'sales person',
      'sales_person', 'agent', 'agent_name', 'account_exec', 'account executive', 'ae', 'ae_name',
      'owner', 'deal_owner', 'deal owner', 'sold_by', 'sold by', 'employee', 'employee_name',
      'representative', 'rep id', 'rep_id', 'closer', 'seller', 'sales_consultant', 'account manager'
    ]
  },
  {
    key: 'customer',
    label: 'Customer / Client Name',
    description: 'Name of the account, client, or customer',
    type: 'string',
    required: false,
    aliases: [
      'customer', 'customer_name', 'customer name', 'client', 'client_name', 'client name',
      'account', 'account_name', 'account name', 'buyer', 'buyer_name', 'company', 'company_name',
      'organization', 'org_name', 'purchaser', 'bill_to_name', 'sold_to_name', 'client company'
    ]
  },
  {
    key: 'grossAmount',
    label: 'Gross Sale Amount ($)',
    description: 'Total revenue or order value before discounts/refunds',
    type: 'currency',
    required: true,
    aliases: [
      'gross_amount', 'gross amount', 'amount', 'total', 'revenue', 'sale_amount', 'sale amount',
      'subtotal', 'gross_sales', 'gross sales', 'order_total', 'order total', 'gross_revenue',
      'price', 'value', 'gross ($)', 'total ($)', 'sale value', 'invoice total', 'invoice_amount',
      'deal size', 'booking amount', 'total sale', 'sales amount', 'gross', 'sales', 'sales ($)'
    ]
  },
  {
    key: 'discountAmount',
    label: 'Discount Amount ($)',
    description: 'Discounts or adjustments deducted from gross sale',
    type: 'currency',
    required: false,
    aliases: [
      'discount', 'discount_amount', 'discount amount', 'promo', 'rebate', 'discount_total',
      'deduction', 'discount ($)', 'coupon', 'concession', 'credit', 'allowance', 'price adjustment',
      'discounts', 'markdown'
    ]
  },
  {
    key: 'productCategory',
    label: 'Product / Service Category',
    description: 'Type or classification of product/service sold',
    type: 'string',
    required: false,
    aliases: [
      'category', 'product_category', 'product category', 'product_type', 'product type', 'type',
      'service', 'department', 'line_of_business', 'lob', 'product_line', 'product line', 'product',
      'item_category', 'sku_category', 'solution', 'offering', 'plan', 'segment', 'item_type'
    ]
  },
  {
    key: 'dealStage',
    label: 'Deal / Payment Status',
    description: 'Status of the deal (e.g., Closed Won, Paid, Refunded, Pending)',
    type: 'string',
    required: false,
    aliases: [
      'status', 'deal_status', 'deal status', 'payment_status', 'payment status', 'stage',
      'deal_stage', 'deal stage', 'state', 'order_status', 'pipeline_stage', 'opportunity_stage',
      'disposition', 'invoice_status'
    ]
  },
  {
    key: 'customRate',
    label: 'Custom Commission Rate (%)',
    description: 'Optional overriding commission percentage for this specific transaction',
    type: 'number',
    required: false,
    aliases: [
      'custom_rate', 'custom rate', 'override_rate', 'override rate', 'commission_rate',
      'commission rate', 'rep_rate', 'rep rate', 'rate_pct', 'commission %', 'rate %', 'split %',
      'custom commission', 'commission rate (%)', 'payout %', 'comm_pct', 'comm rate'
    ]
  },
  {
    key: 'notes',
    label: 'Notes / Remarks',
    description: 'Internal notes or details',
    type: 'string',
    required: false,
    aliases: [
      'notes', 'comments', 'description', 'remarks', 'memo', 'note', 'details', 'reason', 'comment'
    ]
  }
];

export interface ColumnMapping {
  [standardFieldKey: string]: string; // Maps standard field key -> original column name in file
}

export interface RawSheetData {
  sheetName: string;
  headers: string[];
  rows: Record<string, unknown>[];
  totalRowCount: number;
}

export interface ParsedWorkbook {
  fileName: string;
  fileSize: number;
  fileType: 'csv' | 'xlsx';
  sheets: RawSheetData[];
  activeSheetName: string;
  uploadedAt: string;
}

export interface NormalizedRecord {
  rowIndex: number;
  originalData: Record<string, unknown>;
  rawValues: Record<string, string>;
  transactionId: string;
  isTransactionIdGenerated?: boolean;
  date: string; // ISO date string YYYY-MM-DD
  rawDate: string;
  isDateValid: boolean;
  dateParseError?: string;
  salesRep: string;
  isSalesRepMissing: boolean;
  customer: string;
  grossAmount: number;
  rawGrossAmount: string;
  isGrossAmountValid: boolean;
  grossParseError?: string;
  discountAmount: number;
  rawDiscountAmount: string;
  isDiscountValid: boolean;
  netAmount: number;
  productCategory: string;
  dealStage: string;
  customRate?: number; // e.g. 0.08 for 8%
  rawCustomRate?: string;
  isCustomRateValid?: boolean;
  notes: string;
  isDuplicateRow?: boolean;
  isDuplicateTxnId?: boolean;
}

export type IssueSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  id: string;
  rowIndex: number;
  transactionId?: string;
  salesRep?: string;
  field: string;
  severity: IssueSeverity;
  code: string;
  message: string;
  suggestedFix?: string;
  originalValue?: unknown;
}

export interface CommissionTier {
  id: string;
  minAmount: number;
  maxAmount: number | null; // null = unlimited
  rate: number; // e.g. 0.08 for 8%
  label: string;
}

export interface CategoryMultiplier {
  category: string;
  multiplier: number; // e.g. 1.2 = 20% boost, 0.8 = 20% discount
  bonusFlatAmount?: number; // e.g. +$50 for special category
  isExcluded?: boolean; // if true, transactions in this category are excluded from commission
}

export interface RepSpecificRule {
  salesRep: string;
  baseRateOverride?: number; // e.g. 0.12 instead of standard base
  fixedBonusTarget?: number; // target sales to earn bonus
  fixedBonusAmount?: number;
  quotaTarget?: number; // quota dollar target for attainment calculations
}

export type CommissionModelType = 'flat' | 'tiered_cumulative' | 'tiered_marginal' | 'category_based';

export type RefundPolicyType = 'full_clawback' | 'no_deduction' | 'flat_penalty';

export type ReportingPeriodGranularity = 'all_dates' | 'monthly' | 'quarterly' | 'annual' | 'custom_range';

export interface ReportingPeriodConfig {
  granularity: ReportingPeriodGranularity;
  customStartDate?: string; // YYYY-MM-DD
  customEndDate?: string; // YYYY-MM-DD
  enforcePeriodExclusion: boolean; // if true, transactions outside period are disqualified
}

export interface CommissionRuleSet {
  id: string;
  name: string;
  description: string;
  modelType: CommissionModelType;
  defaultBaseRate: number; // e.g. 0.05 for 5%
  applyTo: 'gross' | 'net'; // Calculate on gross or net sales
  minimumDealThreshold: number; // Deals below this generate 0 commission
  includeRefunds: boolean; // If true, negative deals deduct commission
  refundPolicy: RefundPolicyType;
  refundFlatPenalty?: number; // Flat fee deduction if refundPolicy is flat_penalty
  highTicketThreshold: number; // Deals above this get flat bonus
  highTicketBonus: number; // Flat bonus amount in $
  tiers: CommissionTier[];
  categoryMultipliers: CategoryMultiplier[];
  repOverrides: RepSpecificRule[];
  dealStageFilter: string[]; // e.g. ['Closed Won', 'Paid', 'Completed'] - empty array means include all
  excludedCategories: string[]; // e.g. ['Pass-Through', 'Support', 'Tax']
  reportingPeriod: ReportingPeriodConfig;
}

export interface MarginalTierBracket {
  tierLabel: string;
  minAmount: number;
  maxAmount: number | null;
  rate: number;
  eligiblePortion: number;
  commission: number;
}

export interface CalculationTrace {
  commissionBase: number;
  appliedBaseRate: number;
  baseCommission: number;
  tierApplied?: string;
  marginalBrackets?: MarginalTierBracket[];
  categoryMultiplierApplied?: number;
  categoryBonus: number;
  highTicketBonus: number;
  repBonus: number;
  refundAdjustment: number;
  formulaDescription: string;
  ruleSetId: string;
  ruleSetName: string;
  modelType: CommissionModelType;
}

export interface QualificationResult {
  isQualified: boolean;
  status: 'qualified' | 'excluded' | 'warning' | 'error';
  reasons: string[];
  periodKey: string;
  isWithinActivePeriod: boolean;
}

export interface ProcessedRecord {
  rowIndex: number;
  sourceReference: {
    rowIndex: number;
    transactionId: string;
    date: string;
    salesRep: string;
    customer: string;
    productCategory: string;
    dealStage: string;
    rawValues: Record<string, string>;
    originalData: Record<string, unknown>;
  };
  normalized: NormalizedRecord;
  isValid: boolean;
  qualification: QualificationResult;
  status: 'valid' | 'has_warnings' | 'invalid' | 'excluded';
  issues: ValidationIssue[];
  calculation: {
    commissionBase: number;
    appliedBaseRate: number;
    effectiveRate: number;
    baseCommission: number;
    categoryBonus: number;
    highTicketBonus: number;
    repBonus: number;
    refundAdjustment: number;
    totalCommission: number;
    ruleSetId: string;
    ruleSetName: string;
    modelType: CommissionModelType;
    formulaDescription: string;
    trace: CalculationTrace;
  };
}

export interface PeriodRepBreakdown {
  salesRep: string;
  grossSales: number;
  netSales: number;
  commission: number;
  dealCount: number;
}

export interface PeriodSummary {
  periodKey: string; // e.g. "2024-07", "2024-08", "2024-Q3"
  periodLabel: string; // e.g. "July 2024", "Q3 2024"
  startDate: string;
  endDate: string;
  totalDeals: number;
  qualifiedDeals: number;
  excludedDeals: number;
  refundDeals: number;
  totalGrossSales: number;
  totalNetSales: number;
  totalDiscounts: number;
  totalCommission: number;
  effectiveCommissionRate: number;
  repBreakdowns: PeriodRepBreakdown[];
}

export interface RepPeriodBreakdown {
  periodKey: string;
  grossSales: number;
  netSales: number;
  commission: number;
  dealCount: number;
}

export interface RepSummary {
  salesRep: string;
  dealCount: number;
  validDeals: number;
  qualifiedDeals: number;
  excludedDeals: number;
  refundDeals: number;
  totalGrossSales: number;
  totalNetSales: number;
  totalDiscounts: number;
  totalBaseCommission: number;
  totalBonuses: number;
  totalRefundAdjustments: number;
  totalCommission: number;
  effectiveCommissionRate: number;
  averageDealSize: number;
  highestDeal: number;
  flaggedIssuesCount: number;
  quotaTarget?: number;
  quotaAttainmentPct?: number;
  periodBreakdowns: RepPeriodBreakdown[];
}

export interface CategorySummary {
  category: string;
  dealCount: number;
  totalSales: number;
  totalCommission: number;
  percentOfTotalSales: number;
}

export interface ProcessingSummary {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  excludedRows: number;
  qualifiedRows: number;
  totalRawGrossSales: number;
  totalGrossSales: number; // Qualifying gross sales
  totalQualifyingGrossSales: number;
  totalQualifyingNetSales: number;
  totalNetSales: number; // Qualifying net sales
  totalDiscounts: number;
  totalCommissionPaid: number;
  totalBaseCommission: number;
  totalBonuses: number;
  totalRefundClawbacks: number;
  averageCommissionRate: number;
  totalReps: number;
  totalCategories: number;
  totalPeriods: number;
  topPerformingRep: { name: string; sales: number; commission: number };
  dateRange: { start: string; end: string };
  reportingPeriodConfig: ReportingPeriodConfig;
  repSummaries: RepSummary[];
  periodSummaries: PeriodSummary[];
  categorySummaries: CategorySummary[];
  allIssues: ValidationIssue[];
  processedRecords: ProcessedRecord[];
  processedAt: string;
  ruleSetUsed: CommissionRuleSet;
  checksum: string; // Hash / signature for deterministic auditing
}

export interface ExportOptions {
  includeSummarySheet: boolean;
  includeCleanedDataSheet: boolean;
  includeCommissionResultsSheet: boolean;
  includeIssuesSheet: boolean;
  includeSalespersonSummarySheet: boolean;
  includePeriodSummarySheet: boolean;
  dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
  currencySymbol: string;
}
