import { NormalizedRecord, ValidationIssue } from '../types';

export function validateRecords(records: NormalizedRecord[]): {
  issues: ValidationIssue[];
  issuesByRow: Map<number, ValidationIssue[]>;
} {
  const issues: ValidationIssue[] = [];
  const issuesByRow = new Map<number, ValidationIssue[]>();

  const addIssue = (issue: ValidationIssue) => {
    issues.push(issue);
    const existing = issuesByRow.get(issue.rowIndex) || [];
    existing.push(issue);
    issuesByRow.set(issue.rowIndex, existing);
  };

  // Map to track duplicate transaction IDs: ID -> first seen rowIndex
  const seenTxnIds = new Map<string, number>();

  records.forEach((record) => {
    const {
      rowIndex,
      transactionId,
      isTransactionIdGenerated,
      salesRep,
      isSalesRepMissing,
      date,
      rawDate,
      isDateValid,
      dateParseError,
      grossAmount,
      rawGrossAmount,
      isGrossAmountValid,
      grossParseError,
      discountAmount,
      rawDiscountAmount,
      isDiscountValid,
      customRate,
      rawCustomRate,
      isCustomRateValid,
      dealStage,
      isDuplicateRow,
    } = record;

    // Check 1: Missing or placeholder Sales Rep
    if (isSalesRepMissing) {
      addIssue({
        id: `err_rep_${rowIndex}`,
        rowIndex,
        transactionId,
        salesRep: 'Unassigned',
        field: 'salesRep',
        severity: 'error',
        code: 'MISSING_SALES_REP',
        message: 'Sales representative name is missing or unassigned.',
        suggestedFix: 'Assign a valid sales representative to attribute this commission payout.',
        originalValue: record.rawValues.salesRep || salesRep || '(blank)',
      });
    }

    // Check 2: Transaction / Order ID missing or generated
    if (isTransactionIdGenerated) {
      addIssue({
        id: `warn_missing_txnid_${rowIndex}`,
        rowIndex,
        transactionId,
        salesRep,
        field: 'transactionId',
        severity: 'warning',
        code: 'MISSING_TRANSACTION_ID',
        message: `Order/Transaction ID was blank. Generated reference ID "${transactionId}".`,
        suggestedFix: 'Provide an explicit order or invoice number in the source data.',
        originalValue: record.rawValues.transactionId || '(blank)',
      });
    } else if (transactionId) {
      // Check 3: Duplicate Transaction ID
      if (seenTxnIds.has(transactionId)) {
        const prevRow = seenTxnIds.get(transactionId)!;
        record.isDuplicateTxnId = true;
        addIssue({
          id: `warn_dup_txnid_${rowIndex}`,
          rowIndex,
          transactionId,
          salesRep,
          field: 'transactionId',
          severity: 'warning',
          code: 'DUPLICATE_TRANSACTION_ID',
          message: `Transaction ID "${transactionId}" is also present on row ${prevRow}.`,
          suggestedFix: 'Verify whether this is a split deal or duplicate entry in the export.',
          originalValue: transactionId,
        });
      } else {
        seenTxnIds.set(transactionId, rowIndex);
      }
    }

    // Check 4: Exact Duplicate Row
    if (isDuplicateRow) {
      addIssue({
        id: `warn_dup_row_${rowIndex}`,
        rowIndex,
        transactionId,
        salesRep,
        field: 'all',
        severity: 'warning',
        code: 'EXACT_DUPLICATE_ROW',
        message: 'This row has identical values across all columns as a previous row in the file.',
        suggestedFix: 'Review export for duplicate records exported multiple times.',
        originalValue: record.originalData,
      });
    }

    // Check 5: Date parsing & calendar validation
    if (!isDateValid) {
      addIssue({
        id: `err_date_unparseable_${rowIndex}`,
        rowIndex,
        transactionId,
        salesRep,
        field: 'date',
        severity: 'error',
        code: 'UNPARSEABLE_DATE',
        message: dateParseError || `Date "${rawDate}" could not be parsed into a valid calendar date.`,
        suggestedFix: 'Provide date in standard format (YYYY-MM-DD, MM/DD/YYYY, or DD/MM/YYYY).',
        originalValue: rawDate || '(blank)',
      });
    } else if (date) {
      // Date out of bounds check
      const parsedYear = parseInt(date.slice(0, 4), 10);
      if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2040) {
        addIssue({
          id: `warn_date_range_${rowIndex}`,
          rowIndex,
          transactionId,
          salesRep,
          field: 'date',
          severity: 'warning',
          code: 'OUT_OF_BOUNDS_DATE',
          message: `Transaction date year (${parsedYear}) is outside expected operating range (2000–2040).`,
          suggestedFix: 'Verify date formatting (e.g. 2-digit year vs 4-digit year).',
          originalValue: date,
        });
      }
    }

    // Check 6: Gross Sale Amount parsing & validation
    if (!isGrossAmountValid) {
      addIssue({
        id: `err_gross_unparseable_${rowIndex}`,
        rowIndex,
        transactionId,
        salesRep,
        field: 'grossAmount',
        severity: 'error',
        code: 'UNPARSEABLE_GROSS_AMOUNT',
        message: grossParseError || `Gross amount "${rawGrossAmount}" could not be parsed as a numeric currency value.`,
        suggestedFix: 'Ensure gross amount is a clean number or currency string (e.g. $1,250.00).',
        originalValue: rawGrossAmount,
      });
    } else if (grossAmount < 0) {
      // Return / Refund / Chargeback
      addIssue({
        id: `warn_neg_refund_${rowIndex}`,
        rowIndex,
        transactionId,
        salesRep,
        field: 'grossAmount',
        severity: 'warning',
        code: 'NEGATIVE_AMOUNT_REFUND',
        message: `Negative sale amount ($${grossAmount.toFixed(2)}). Detected as return or refund.`,
        suggestedFix: 'Commission rules will apply refund deduction policy to representative payout.',
        originalValue: grossAmount,
      });
    } else if (grossAmount === 0) {
      addIssue({
        id: `info_zero_amount_${rowIndex}`,
        rowIndex,
        transactionId,
        salesRep,
        field: 'grossAmount',
        severity: 'info',
        code: 'ZERO_AMOUNT_DEAL',
        message: 'Gross sale amount is $0.00 (Zero revenue deal).',
        suggestedFix: 'Complimentary trial, sample order, or zero-dollar contract.',
        originalValue: grossAmount,
      });
    } else if (grossAmount > 1000000) {
      // Extreme Outlier Check
      addIssue({
        id: `info_large_deal_${rowIndex}`,
        rowIndex,
        transactionId,
        salesRep,
        field: 'grossAmount',
        severity: 'info',
        code: 'HIGH_VALUE_DEAL',
        message: `High-value transaction ($${grossAmount.toLocaleString()}).`,
        suggestedFix: 'Verify large enterprise deal size against invoice.',
        originalValue: grossAmount,
      });
    }

    // Check 7: Discount Amount validation
    if (!isDiscountValid) {
      addIssue({
        id: `warn_disc_unparseable_${rowIndex}`,
        rowIndex,
        transactionId,
        salesRep,
        field: 'discountAmount',
        severity: 'warning',
        code: 'UNPARSEABLE_DISCOUNT_AMOUNT',
        message: `Discount amount "${rawDiscountAmount}" could not be parsed as a number. Treated as $0.00.`,
        suggestedFix: 'Verify discount column values in original file.',
        originalValue: rawDiscountAmount,
      });
    } else if (grossAmount > 0 && discountAmount > grossAmount) {
      addIssue({
        id: `warn_disc_exceeds_${rowIndex}`,
        rowIndex,
        transactionId,
        salesRep,
        field: 'discountAmount',
        severity: 'warning',
        code: 'DISCOUNT_EXCEEDS_GROSS',
        message: `Discount ($${discountAmount.toFixed(2)}) exceeds gross amount ($${grossAmount.toFixed(2)}), resulting in negative net sales (-$${Math.abs(record.netAmount).toFixed(2)}).`,
        suggestedFix: 'Check if discount was entered as total invoice rather than markdown.',
        originalValue: discountAmount,
      });
    }

    // Check 8: Custom Rate validation
    if (isCustomRateValid === false) {
      addIssue({
        id: `warn_rate_unparseable_${rowIndex}`,
        rowIndex,
        transactionId,
        salesRep,
        field: 'customRate',
        severity: 'warning',
        code: 'UNPARSEABLE_CUSTOM_RATE',
        message: `Custom commission rate "${rawCustomRate}" is unparseable. Falling back to plan rule rate.`,
        suggestedFix: 'Specify rate as percentage (e.g. 8%) or decimal (0.08).',
        originalValue: rawCustomRate,
      });
    } else if (customRate !== undefined) {
      if (customRate < 0 || customRate > 0.6) {
        addIssue({
          id: `warn_rate_range_${rowIndex}`,
          rowIndex,
          transactionId,
          salesRep,
          field: 'customRate',
          severity: 'warning',
          code: 'ANOMALOUS_CUSTOM_RATE',
          message: `Custom commission rate (${(customRate * 100).toFixed(1)}%) is unusually high or negative (>60% or <0%).`,
          suggestedFix: 'Verify rate decimal point (e.g. 0.08 vs 8.0).',
          originalValue: customRate,
        });
      }
    }

    // Check 9: Deal Stage Verification
    const stageLower = (dealStage || '').toLowerCase();
    if (
      stageLower.includes('lost') ||
      stageLower.includes('cancel') ||
      stageLower.includes('decline') ||
      stageLower.includes('void') ||
      stageLower.includes('draft')
    ) {
      addIssue({
        id: `info_stage_nonwon_${rowIndex}`,
        rowIndex,
        transactionId,
        salesRep,
        field: 'dealStage',
        severity: 'info',
        code: 'NON_WON_STAGE',
        message: `Deal stage is "${dealStage}". Verify whether non-won deals should be included in commission.`,
        suggestedFix: 'Use the Deal Stage filter in rules to exclude non-won deals if needed.',
        originalValue: dealStage,
      });
    }
  });

  return { issues, issuesByRow };
}
