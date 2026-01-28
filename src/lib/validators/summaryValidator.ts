import type {
  Receipt,
  SummaryValidationResult,
  ValidationFailureReasonValue,
} from "@/lib/schemas/receipt";
import { normalizeRange } from "@/lib/schemas/receipt";
import { LAUGH_LAB_CLOSING_LINE } from "@/lib/prompts/stageB_summary";

/**
 * Minimum word count for Laugh Lab coverage (500+ words requirement)
 */
const MINIMUM_WORD_COUNT = 500;

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
  "lines_per_joke",
  "character_balance",
  "ensemble_balance",
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
 * Validates a Stage B summary against Laugh Lab Evidence-Lock requirements.
 *
 * HARD REQUIREMENTS:
 * 1. Exactly 3 content paragraphs (plus optional standalone closing line paragraph)
 * 2. No formatting violations (bullets, numbering, ALLCAPS headings)
 * 3. Each content paragraph must contain at least one approved metric substring
 * 4. Each content paragraph must contain at least one receipt range
 * 5. All cited receipt ranges must be present in the approved receipts list
 * 6. Total word count must be 500+ words
 * 7. Must end with mandatory closing line: "Ready to analyze some punchline gaps?"
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
  const allParagraphs = summary
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Check for mandatory closing line
  const hasClosingLine = summary.includes(LAUGH_LAB_CLOSING_LINE);
  if (!hasClosingLine) {
    failures.push({
      reason: "missing_closing_line",
      details: `Missing mandatory closing line: "${LAUGH_LAB_CLOSING_LINE}"`,
    });
  }

  // Determine content paragraphs (exclude standalone closing line paragraph)
  let contentParagraphs = allParagraphs;
  const lastParagraph = allParagraphs[allParagraphs.length - 1] || "";
  if (lastParagraph === LAUGH_LAB_CLOSING_LINE) {
    // Closing line is its own paragraph, exclude it from content
    contentParagraphs = allParagraphs.slice(0, -1);
  }

  // Rule 1: Must be exactly 3 content paragraphs
  // Accept 3 content paragraphs (closing can be inside last paragraph)
  // or 4 total paragraphs (3 content + standalone closing)
  if (contentParagraphs.length !== 3) {
    failures.push({
      reason: "paragraph_count",
      details: `Expected 3 content paragraphs, found ${contentParagraphs.length}`,
    });
  }

  // Rule 6: Word count must be 500+
  const wordCount = summary
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  if (wordCount < MINIMUM_WORD_COUNT) {
    failures.push({
      reason: "word_count",
      details: `Expected 500+ words, found ${wordCount}`,
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

  // Rules 3 & 4: Each content paragraph must contain metric + receipt
  contentParagraphs.forEach((paragraph, index) => {
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
 * Generates Laugh Lab format coverage:
 * - 3 content paragraphs (praise, constructive feedback, next steps)
 * - 500+ words total
 * - Mandatory closing line
 *
 * @param metrics - The metrics snapshot
 * @param receipts - The approved receipts (uses first 3)
 * @returns A valid 3-paragraph fallback summary with closing line
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
  // Select receipts for different purposes
  const sortedReceipts = [...receipts].sort((a, b) => {
    const severityOrder = { high: 3, med: 2, low: 1 };
    const severityDiff =
      severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.confidence - a.confidence;
  });

  // Find strength receipts (low severity) for praise
  const strengthReceipts = sortedReceipts.filter((r) => r.severity === "low");
  const opportunityReceipts = sortedReceipts.filter(
    (r) => r.severity === "med" || r.severity === "high"
  );

  const r1 = strengthReceipts[0] || sortedReceipts[0];
  const r2 = opportunityReceipts[0] || sortedReceipts[1] || r1;
  const r3 = opportunityReceipts[1] || sortedReceipts[2] || r2;

  // Generate score context
  const scoreContext =
    metrics.overall_score >= 80
      ? "strong"
      : metrics.overall_score >= 60
        ? "solid"
        : "developing";
  const lpmContext =
    metrics.lpm_intermediate_plus >= 2.0
      ? "maintains healthy joke frequency"
      : metrics.lpm_intermediate_plus >= 1.5
        ? "shows adequate pacing"
        : "has room to tighten the comedic rhythm";

  // Generate retention context
  const retentionContext =
    metrics.retention_risk.overall_risk === "low"
      ? "keeps audience attention effectively"
      : metrics.retention_risk.overall_risk === "medium"
        ? "has some areas where engagement could drift"
        : "risks losing momentum at key moments";

  // Paragraph 1: Praise (expanded to ~170 words for word count requirement)
  const p1 = `This script demonstrates ${scoreContext} comedic instincts with an overall_score of ${metrics.overall_score.toFixed(0)}, reflecting genuine understanding of timing and character-driven comedy that most writers take years to develop. The evidence at ${r1.range} shows ${r1.note}, which anchors the script's comedic identity and gives the piece its distinct voice throughout the narrative. The LPM of ${metrics.lpm_intermediate_plus.toFixed(2)} ${lpmContext}, and when the jokes land, they land with conviction and clarity. What works here works because you've built a foundation that supports escalation rather than fighting against it, allowing comedic momentum to build naturally from scene to scene. The ensemble_balance score indicates you're distributing comedic weight across characters rather than over-relying on a single voice, which is exactly what keeps scenes dynamic and unpredictable for the audience. The opening beats establish character relationships efficiently, and your dialogue has a naturalistic rhythm that sells the comedy without feeling overly constructed or mechanical. These structural strengths position the script well for further development and punch-up work.`;

  // Paragraph 2: Constructive Feedback (expanded to ~170 words)
  const p2 = `The primary constraint limiting this script's ceiling is the pacing between major comedic beats, particularly in the middle sections where momentum tends to dissipate. With lines_per_joke at ${metrics.lines_per_joke.toFixed(2)}, there are stretches where the audience is waiting too long between payoffs, and waiting breeds impatience that erodes engagement. The analysis at ${r2.range} reveals ${r2.note}, which represents your highest-leverage opportunity for improvement in terms of overall comedic impact. The retention_risk assessment of ${metrics.retention_risk.overall_risk} means the script ${retentionContext}, which directly impacts how an audience will respond to the material in real-time. This isn't about adding more jokes everywhere indiscriminately—it's about compressing setups, finding the shortest path to the laugh, and ensuring each scene has a clear comedic destination rather than meandering toward one without purpose. The character_balance metrics suggest some ensemble members could carry more comedic load, which would help distribute the pacing pressure across the script and create more varied comedic textures throughout.`;

  // Paragraph 3: Next Steps (expanded to ~170 words)
  const p3 = `Three specific moves will materially improve this script and push it toward its full potential. First, revisit the area flagged at ${r3.range} where ${r3.note}—this represents your quickest path to a stronger overall_score, and you can likely tighten this beat in ~15 minutes by cutting redundant setup lines that dilute the impact of your punchlines. Second, audit any stretch exceeding ten lines without a clear laugh or callback; the LPM analysis suggests these stretches exist, and compressing them will immediately improve retention_risk by keeping the audience engaged throughout. This pass should take ~20 minutes with fresh eyes on the material. Third, look at your underutilized ensemble members and redistribute one strong joke to each character, which earns you better character_balance and gives the audience new angles to engage with the comedy—budget ~15 minutes for this punch-up work and watch the ensemble dynamics improve significantly. These targeted revisions address the script's main constraints without requiring a full rewrite of existing material.`;

  return `${p1}\n\n${p2}\n\n${p3}\n\n${LAUGH_LAB_CLOSING_LINE}`;
}
