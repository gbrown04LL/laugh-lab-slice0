import { z } from "zod";
import { MetricsSchema } from "@/lib/types";

// ============================================================================
// Evidence-Lock Pipeline Schemas
// ============================================================================

/**
 * Format types for scripts.
 * If not provided or "auto", Stage A should infer from script_text.
 */
export const FormatType = z.enum(["sitcom", "sketch", "standup", "feature"]);
export type FormatTypeValue = z.infer<typeof FormatType>;

/**
 * Receipt severity levels
 */
export const ReceiptSeverity = z.enum(["low", "med", "high"]);
export type ReceiptSeverityValue = z.infer<typeof ReceiptSeverity>;

/**
 * Receipt ID pattern: "r01" through "r15"
 */
export const ReceiptIdSchema = z
  .string()
  .regex(/^r(0[1-9]|1[0-5])$/, "Receipt ID must be r01 through r15");

/**
 * Receipt range pattern: "[Lines X–Y] →" or "[Line X–Y] →"
 * Accepts EN DASH (–), minus-hyphen (-), or minus sign (−)
 */
export const ReceiptRangeSchema = z
  .string()
  .regex(
    /^\[Lines?\s+\d+\s*[–−-]\s*\d+\]\s*→$/,
    'Range must match format "[Lines X–Y] →"'
  );

/**
 * Individual receipt from Stage A extraction
 */
export const ReceiptSchema = z.object({
  /** Unique receipt ID: "r01" through "r15" */
  id: ReceiptIdSchema,

  /** Exact format: "[Lines X–Y] →" (prefer EN DASH) */
  range: ReceiptRangeSchema,

  /** Optional quote, <=20 words (prefer no quotes) */
  quote: z
    .string()
    .optional()
    .refine(
      (q) => !q || q.split(/\s+/).length <= 20,
      "Quote must be <=20 words"
    ),

  /** Plain English note, 8-20 words, no adjectives */
  note: z
    .string()
    .min(1)
    .refine(
      (n) => {
        const words = n.split(/\s+/).filter(Boolean);
        return words.length >= 8 && words.length <= 20;
      },
      "Note must be 8-20 words"
    ),

  /** Category tags */
  tags: z.array(z.string()).min(1),

  /** Severity level */
  severity: ReceiptSeverity,

  /** Metric references */
  metric_refs: z.array(z.string()),

  /** Confidence score 0-1 */
  confidence: z.number().min(0).max(1),
});

export type Receipt = z.infer<typeof ReceiptSchema>;

// ============================================================================
// Stage A Output Schema
// ============================================================================

/**
 * Input for Stage A processing
 */
export const StageAInputSchema = z.object({
  script_text: z.string().min(1),
  jokesByLine: z.array(z.number()).optional(),
  characters: z.array(z.string()).optional(),
  metrics_snapshot: MetricsSchema,
});

export type StageAInput = z.infer<typeof StageAInputSchema>;

/**
 * Output from Stage A (Receipt Extraction)
 */
export const StageAOutputSchema = z.object({
  /** Script format type */
  formatType: FormatType,

  /** Pass-through from metrics_snapshot (do not recompute) */
  metrics: MetricsSchema,

  /** 10-15 receipts with strict schema */
  receipts: z
    .array(ReceiptSchema)
    .min(10, "Must have at least 10 receipts")
    .max(15, "Must have at most 15 receipts"),
});

export type StageAOutput = z.infer<typeof StageAOutputSchema>;

// ============================================================================
// Stage B Output Schema
// ============================================================================

/**
 * Input for Stage B processing
 */
export const StageBInputSchema = z.object({
  formatType: FormatType,
  metrics: MetricsSchema,
  receipts: z.array(ReceiptSchema),
});

export type StageBInput = z.infer<typeof StageBInputSchema>;

/**
 * Output from Stage B (Executive Summary)
 * EXACTLY 3 paragraphs of prose, each citing at least one metric and receipt
 */
export const StageBOutputSchema = z.object({
  /** The 3-paragraph summary text */
  summary: z.string().min(1),
});

export type StageBOutput = z.infer<typeof StageBOutputSchema>;

// ============================================================================
// Validation Result Schema
// ============================================================================

export const ValidationFailureReason = z.enum([
  "paragraph_count",
  "missing_metric_p1",
  "missing_metric_p2",
  "missing_metric_p3",
  "missing_receipt_p1",
  "missing_receipt_p2",
  "missing_receipt_p3",
  "unapproved_receipt_range",
  "formatting_violation",
]);

export type ValidationFailureReasonValue = z.infer<
  typeof ValidationFailureReason
>;

export const SummaryValidationResultSchema = z.object({
  valid: z.boolean(),
  failures: z.array(
    z.object({
      reason: ValidationFailureReason,
      details: z.string().optional(),
    })
  ),
});

export type SummaryValidationResult = z.infer<
  typeof SummaryValidationResultSchema
>;

// ============================================================================
// Evidence-Lock Pipeline Result
// ============================================================================

export const EvidenceLockResultSchema = z.object({
  stageA: StageAOutputSchema,
  stageB: StageBOutputSchema,
  validation: SummaryValidationResultSchema,
  retryCount: z.number().int().min(0).max(1),
  usedFallback: z.boolean(),
});

export type EvidenceLockResult = z.infer<typeof EvidenceLockResultSchema>;

// ============================================================================
// Receipt Tag Categories
// ============================================================================

/**
 * Standard receipt tag categories for grouping in UI
 */
export const RECEIPT_TAG_CATEGORIES = {
  POSITIVE: ["strength", "working", "effective", "strong", "callback-hit"],
  CONSTRAINT: ["gap", "pacing", "soft-spot", "constraint"],
  CHARACTER: [
    "character",
    "ensemble",
    "underutilized",
    "balance",
    "distribution",
  ],
  REVISION: ["punch-up", "revision", "leverage", "roi", "opportunity"],
  CALLBACK: ["callback", "callback-miss", "callback-chain"],
} as const;

/**
 * Helper to categorize a receipt based on its tags
 */
export function categorizeReceipt(
  receipt: Receipt
): "working" | "opportunity" {
  const hasPositive = receipt.tags.some((tag) =>
    RECEIPT_TAG_CATEGORIES.POSITIVE.some((p) =>
      tag.toLowerCase().includes(p.toLowerCase())
    )
  );

  if (hasPositive && receipt.severity === "low") {
    return "working";
  }

  return "opportunity";
}

/**
 * Helper to normalize dashes in ranges for comparison
 */
export function normalizeRange(range: string): string {
  // Normalize all dash types to EN DASH for comparison
  return range.replace(/[−-]/g, "–");
}
