import type {
  Receipt,
  SummaryValidationResult,
  ValidationFailureReasonValue,
} from "@/lib/schemas/receipt";
import { normalizeRange } from "@/lib/schemas/receipt";

/**
 * Approved metric key substrings for validation.
 * Includes both canonical and common variants.
 */
const APPROVED_METRIC_SUBSTRINGS = [
  "overallScore",
  "overall_score",
  "LPM",
  "laughsPerMinute",
  "LPJ",
  "linesPerJoke",
  "CHS",
  "callbackFrequency",
  "characterBalance",
  "retentionCliff",
  "gapPriorityScores",
  "gapPriority",
  "retention_risk",
  "retentionRisk",
];

/**
 * Regex to extract receipt ranges from text.
 * Matches: "[Lines X–Y] →" or "[Line X–Y] →"
 * Accepts EN DASH (–), minus-hyphen (-), or minus sign (−)
 */
const RECEIPT_RANGE_REGEX = /\[Lines?\s+\d+\s*[–−-]\s*\d+\]\s*→/g;

/**
 * Regex to detect formatting violations.
 * Detects: bullets (-), numbering (1.), ALLCAPS headings, section labels
 */
const FORMATTING_VIOLATION_REGEX =
  /^(\s*-\s+|\s*\d+\.\s+|[A-Z\s]{10,}:|PARAGRAPH|SECTION|CARD)/m;

/**
 * Validates a Stage B summary against Evidence-Lock requirements.
 *
 * HARD REQUIREMENTS:
 * 1. Exactly 3 paragraphs (separated by blank lines)
 * 2. No formatting violations (bullets, numbering, ALLCAPS headings)
 * 3. Each paragraph must contain at least one approved metric substring
 * 4. Each paragraph must contain at least one receipt range
 * 5. All cited receipt ranges must be present in the approved receipts list
 *
 * @param summary - The 3-paragraph summary text from Stage B
 * @param receipts - The approved receipts from Stage A
 * @returns Validation result with pass/fail and detailed failure reasons
 */
export function validateSummary(
  summary: string,
  receipts: Receipt[]
): SummaryValidationResult {
  const failures: Array<{
    reason: ValidationFailureReasonValue;
    details?: string;
  }> = [];

  // Split into paragraphs (separated by blank lines)
  const paragraphs = summary
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Rule 1: Must be exactly 3 paragraphs
  if (paragraphs.length !== 3) {
    failures.push({
      reason: "paragraph_count",
      details: `Expected 3 paragraphs, found ${paragraphs.length}`,
    });
  }

  // Rule 2: No formatting violations
  if (FORMATTING_VIOLATION_REGEX.test(summary)) {
    failures.push({
      reason: "formatting_violation",
      details: "Summary contains bullets, numbering, or ALLCAPS headings",
    });
  }

  // Build normalized approved ranges set for validation
  const approvedRanges = new Set(
    receipts.map((r) => normalizeRange(r.range))
  );

  // Extract all cited ranges from the summary
  const citedRanges = Array.from(summary.matchAll(RECEIPT_RANGE_REGEX)).map(
    (match) => normalizeRange(match[0])
  );

  // Rule 5: All cited ranges must be in approved receipts
  for (const citedRange of citedRanges) {
    if (!approvedRanges.has(citedRange)) {
      failures.push({
        reason: "unapproved_receipt_range",
        details: `Cited range "${citedRange}" not found in approved receipts`,
      });
    }
  }

  // Rules 3 & 4: Each paragraph must contain metric + receipt
  paragraphs.forEach((paragraph, index) => {
    const paragraphNum = (index + 1) as 1 | 2 | 3;

    // Check for metric substring
    const hasMetric = APPROVED_METRIC_SUBSTRINGS.some((metricKey) =>
      paragraph.includes(metricKey)
    );

    if (!hasMetric) {
      failures.push({
        reason: `missing_metric_p${paragraphNum}` as ValidationFailureReasonValue,
        details: `Paragraph ${paragraphNum} does not contain an approved metric substring`,
      });
    }

    // Check for receipt range
    const paragraphRanges = Array.from(
      paragraph.matchAll(RECEIPT_RANGE_REGEX)
    );

    if (paragraphRanges.length === 0) {
      failures.push({
        reason: `missing_receipt_p${paragraphNum}` as ValidationFailureReasonValue,
        details: `Paragraph ${paragraphNum} does not contain a receipt range`,
      });
    }
  });

  return {
    valid: failures.length === 0,
    failures,
  };
}

/**
 * Generates a fallback summary using metrics and receipts.
 * Used when Stage B fails validation after retry.
 *
 * @param metrics - The metrics snapshot
 * @param receipts - The approved receipts (uses first 3)
 * @returns A valid 3-paragraph fallback summary
 */
export function generateFallbackSummary(
  metrics: {
    overall_score: number;
    lpm_intermediate_plus: number;
    lines_per_joke: number;
    retention_risk: { overall_risk: string };
  },
  receipts: Receipt[]
): string {
  // Select 3 receipts: highest severity first, then by confidence
  const selectedReceipts = receipts
    .sort((a, b) => {
      const severityOrder = { high: 3, med: 2, low: 1 };
      const severityDiff =
        severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.confidence - a.confidence;
    })
    .slice(0, 3);

  const [r1, r2, r3] = selectedReceipts;

  const p1 = `This script achieves an overall_score of ${metrics.overall_score.toFixed(0)}, establishing a foundation with identifiable comedic moments. The analysis at ${r1.range} reveals ${r1.note}, which provides context for the script's current performance baseline.`;

  const p2 = `The primary constraint affecting retention stems from pacing dynamics, with LPM at ${metrics.lpm_intermediate_plus.toFixed(2)} and lines_per_joke at ${metrics.lines_per_joke.toFixed(2)}. Specifically, ${r2.range} shows ${r2.note}, indicating where audience attention may waver.`;

  const p3 = `For revision, focus on the retention_risk areas flagged as ${metrics.retention_risk.overall_risk} priority. The opportunity at ${r3.range} demonstrates ${r3.note}, offering a high-leverage zone for punch-up work that can meaningfully improve engagement.`;

  return `${p1}\n\n${p2}\n\n${p3}`;
}
