import { describe, it, expect } from "vitest";
import { validateSummary, generateFallbackSummary } from "./summaryValidator";
import type { Receipt } from "@/lib/schemas/receipt";

/**
 * Laugh Lab closing line constant
 */
const LAUGH_LAB_CLOSING_LINE = "Ready to analyze some punchline gaps?";

// Mock receipts for testing
const mockReceipts: Receipt[] = [
  {
    id: "r01",
    range: "[Lines 45–67] →",
    note: "gap of 22 lines creates retention risk in act one setup",
    tags: ["gap", "pacing", "retention"],
    severity: "high",
    metric_refs: ["retention_risk", "lpm_intermediate_plus"],
    confidence: 0.92,
  },
  {
    id: "r02",
    range: "[Lines 89–112] →",
    note: "character balance shows dominant lead with minimal ensemble distribution",
    tags: ["character", "balance", "ensemble"],
    severity: "med",
    metric_refs: ["characterBalance"],
    confidence: 0.88,
  },
  {
    id: "r03",
    range: "[Lines 134–156] →",
    note: "callback opportunity missed in act two button sequence",
    tags: ["callback", "opportunity", "leverage"],
    severity: "low",
    metric_refs: ["callbackFrequency"],
    confidence: 0.85,
  },
];

// Helper to generate 500+ word test summaries
function generateValidTestSummary(
  options: {
    includeClosingLine?: boolean;
    receipts?: Receipt[];
  } = {}
): string {
  const { includeClosingLine = true, receipts = mockReceipts } = options;
  const [r1, r2, r3] = receipts;

  // Each paragraph ~180 words to ensure we exceed 500 total words
  const p1 = `This script demonstrates solid comedic instincts with an overall_score of 72, reflecting genuine understanding of timing and character-driven comedy throughout the entire piece. The evidence at ${r1.range} reveals ${r1.note}, which anchors the script's comedic identity and gives the piece its distinct voice throughout every scene. The LPM of 2.30 maintains healthy joke frequency, and when the jokes land, they land with conviction and clarity that suggests real craft. What works here works because you've built a foundation that supports escalation rather than fighting against it, allowing moments to build naturally. The ensemble_balance score indicates you're distributing comedic weight across characters rather than over-relying on a single voice, which is exactly what keeps scenes dynamic, unpredictable, and engaging for the audience. The pacing in the opening act establishes rhythm effectively, and the character introductions earn their laughs through specificity rather than broad strokes. Your dialogue has a naturalistic quality that sells the comedy without feeling constructed or forced. These structural strengths position the material well for production.`;

  const p2 = `The primary constraint limiting this script's ceiling is the pacing between major comedic beats, particularly in the middle section where momentum tends to stall and the energy dissipates noticeably. With lines_per_joke at 8.50, there are stretches where the audience is waiting too long between payoffs, and waiting breeds impatience in comedy that can undermine even strong material. The analysis at ${r2.range} reveals ${r2.note}, which represents your highest-leverage opportunity for improvement in terms of ensemble dynamics and overall comedic impact. The retention_risk assessment of medium means the script has some areas where engagement could drift if not addressed through targeted revisions. This isn't about adding more jokes everywhere indiscriminately—it's about compressing setups, finding the shortest path to the laugh, and ensuring each scene has a clear comedic destination rather than meandering toward one without purpose. The character_balance metrics suggest some ensemble members could carry significantly more comedic load, which would help distribute the pacing pressure across the script more evenly and create varied textures throughout the piece.`;

  const p3 = `Three specific moves will materially improve this script and push it toward production readiness with minimal additional work required. First, revisit the area flagged at ${r3.range} where ${r3.note}—this represents your quickest path to a stronger overall_score, and you can likely tighten this beat in ~15 minutes by cutting redundant setup lines that delay the payoff unnecessarily and dilute the comedic impact. Second, audit any stretch exceeding ten lines without a clear laugh or callback; the LPM analysis suggests these stretches exist in multiple places, and compressing them will immediately improve retention_risk metrics by keeping the audience engaged throughout the entire piece. This pass should take ~20 minutes with fresh eyes on the page. Third, look at your underutilized ensemble members and redistribute one strong joke to each character, which earns you better character_balance and gives the audience new angles to engage with the comedy—budget ~15 minutes for this punch-up work and watch the ensemble dynamics improve significantly as the comedy becomes more distributed and varied.`;

  const content = `${p1}\n\n${p2}\n\n${p3}`;
  return includeClosingLine ? `${content}\n\n${LAUGH_LAB_CLOSING_LINE}` : content;
}

describe("validateSummary", () => {
  it("should pass validation for a valid 3-paragraph summary with closing line", () => {
    const validSummary = generateValidTestSummary();
    const result = validateSummary(validSummary, mockReceipts);

    expect(result.valid).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("should fail validation when closing line is missing", () => {
    const noClosingSummary = generateValidTestSummary({ includeClosingLine: false });
    const result = validateSummary(noClosingSummary, mockReceipts);

    expect(result.valid).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        reason: "missing_closing_line",
      })
    );
  });

  it("should fail validation when word count is below 500", () => {
    const shortSummary = `This script achieves an overall_score of 72. The analysis at [Lines 45–67] → reveals gaps.

The primary constraint stems from characterBalance at [Lines 89–112] → with issues.

Focus on retention_risk at [Lines 134–156] → for improvements.

${LAUGH_LAB_CLOSING_LINE}`;

    const result = validateSummary(shortSummary, mockReceipts);

    expect(result.valid).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        reason: "word_count",
        details: expect.stringContaining("Expected 500+ words"),
      })
    );
  });

  it("should fail validation when paragraph count is wrong", () => {
    // Two paragraphs + closing line = not enough content paragraphs
    const twoParaSummary = `This script demonstrates solid comedic instincts with an overall_score of 72, reflecting genuine understanding of timing and character-driven comedy throughout the entire piece. The evidence at [Lines 45–67] → reveals significant pacing gaps that create retention risk in the act one setup, which anchors the script's comedic identity and gives the piece its distinct voice. The LPM maintains healthy joke frequency, and when the jokes land, they land with conviction and clarity. What works here works because you've built a foundation that supports escalation rather than fighting against it. The ensemble_balance score indicates you're distributing comedic weight across characters rather than over-relying on a single voice, which is exactly what keeps scenes dynamic and unpredictable. The pacing in the opening act establishes rhythm effectively, and the character introductions earn their laughs through specificity rather than broad strokes. This is fundamentally good work that deserves careful attention and thoughtful revision.

The primary constraint stems from characterBalance issues at [Lines 89–112] → showing uneven distribution patterns across the ensemble cast which limits comedic potential significantly.

${LAUGH_LAB_CLOSING_LINE}`;

    const result = validateSummary(twoParaSummary, mockReceipts);

    expect(result.valid).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        reason: "paragraph_count",
        details: expect.stringContaining("Expected 3 content paragraphs"),
      })
    );
  });

  it("should fail validation when an unapproved receipt range is cited", () => {
    const invalidRangeSummary = generateValidTestSummary();
    // Replace one valid range with an invalid one
    const modified = invalidRangeSummary.replace("[Lines 89–112] →", "[Lines 200–220] →");

    const result = validateSummary(modified, mockReceipts);

    expect(result.valid).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        reason: "unapproved_receipt_range",
        details: expect.stringContaining("[Lines 200–220] →"),
      })
    );
  });

  it("should fail validation when a paragraph is missing a metric", () => {
    const validSummary = generateValidTestSummary();
    // Remove metrics from paragraph 2 by replacing with generic text
    const noMetricP2 = validSummary.replace(
      /lines_per_joke|retention_risk|character_balance/gi,
      "the analysis"
    );

    const result = validateSummary(noMetricP2, mockReceipts);

    expect(result.valid).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        reason: "missing_metric_p2",
        details: expect.stringContaining("does not contain an approved metric substring"),
      })
    );
  });

  it("should fail validation when a paragraph is missing a receipt range", () => {
    const validSummary = generateValidTestSummary();
    // Remove receipt from paragraph 2
    const noReceiptP2 = validSummary.replace("[Lines 89–112] →", "in the middle section");

    const result = validateSummary(noReceiptP2, mockReceipts);

    expect(result.valid).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        reason: "missing_receipt_p2",
        details: expect.stringContaining("does not contain a receipt range"),
      })
    );
  });

  it("should fail validation when formatting violations are present", () => {
    const formattedSummary = `PARAGRAPH 1: OVERVIEW
This script achieves an overall_score of 72, reflecting genuine understanding of timing and character-driven comedy throughout. The evidence at [Lines 45–67] → reveals significant pacing gaps that create retention risk.

- The primary constraint stems from characterBalance issues at [Lines 89–112] →
- Shows uneven distribution patterns across the ensemble cast

For revision, focus on retention_risk at [Lines 134–156] → for opportunities to improve.

${LAUGH_LAB_CLOSING_LINE}`;

    const result = validateSummary(formattedSummary, mockReceipts);

    expect(result.valid).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        reason: "formatting_violation",
      })
    );
  });

  it("should handle different dash types in receipt ranges", () => {
    // Create a version with different dash types that all normalize to the same
    const hyphenReceipts: Receipt[] = [
      { ...mockReceipts[0], range: "[Lines 45-67] →" }, // hyphen-minus
      { ...mockReceipts[1], range: "[Lines 89–112] →" }, // en-dash (original)
      { ...mockReceipts[2], range: "[Lines 134−156] →" }, // minus sign
    ];

    const hyphenSummary = generateValidTestSummary({ receipts: hyphenReceipts });
    const result = validateSummary(hyphenSummary, mockReceipts);

    // Should pass because normalizeRange handles different dash types
    expect(result.valid).toBe(true);
  });

  it("should accept metric variants (LPM, laughsPerMinute, lines_per_joke, etc.)", () => {
    const validSummary = generateValidTestSummary();
    const result = validateSummary(validSummary, mockReceipts);

    expect(result.valid).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("should allow closing line as part of last paragraph", () => {
    // Create summary where closing line is attached to paragraph 3
    const summaryWithAttachedClosing = generateValidTestSummary({ includeClosingLine: false }) +
      ` ${LAUGH_LAB_CLOSING_LINE}`;

    const result = validateSummary(summaryWithAttachedClosing, mockReceipts);

    // Should pass - closing line can be attached to last paragraph
    expect(result.valid).toBe(true);
  });
});

describe("generateFallbackSummary", () => {
  it("should generate a valid fallback summary with closing line", () => {
    const metrics = {
      overall_score: 72,
      lpm_intermediate_plus: 2.3,
      lines_per_joke: 8.5,
      retention_risk: { overall_risk: "medium" },
    };

    const fallback = generateFallbackSummary(metrics, mockReceipts);

    // Should have 3 content paragraphs + closing line paragraph
    const paragraphs = fallback.split("\n\n").filter((p) => p.trim().length > 0);
    expect(paragraphs).toHaveLength(4);

    // Last paragraph should be the closing line
    expect(paragraphs[3]).toBe(LAUGH_LAB_CLOSING_LINE);

    // Should pass validation
    const result = validateSummary(fallback, mockReceipts);
    expect(result.valid).toBe(true);
  });

  it("should generate 500+ words in fallback", () => {
    const metrics = {
      overall_score: 72,
      lpm_intermediate_plus: 2.3,
      lines_per_joke: 8.5,
      retention_risk: { overall_risk: "medium" },
    };

    const fallback = generateFallbackSummary(metrics, mockReceipts);
    const wordCount = fallback.split(/\s+/).filter((w) => w.length > 0).length;

    expect(wordCount).toBeGreaterThanOrEqual(500);
  });

  it("should include metrics in the fallback summary", () => {
    const metrics = {
      overall_score: 72,
      lpm_intermediate_plus: 2.3,
      lines_per_joke: 8.5,
      retention_risk: { overall_risk: "high" },
    };

    const fallback = generateFallbackSummary(metrics, mockReceipts);

    expect(fallback).toContain("overall_score");
    expect(fallback).toContain("72");
    expect(fallback).toContain("LPM");
    expect(fallback).toContain("2.3");
    expect(fallback).toContain("retention_risk");
    expect(fallback).toContain("high");
  });

  it("should cite exactly 3 receipt ranges in the fallback", () => {
    const metrics = {
      overall_score: 72,
      lpm_intermediate_plus: 2.3,
      lines_per_joke: 8.5,
      retention_risk: { overall_risk: "medium" },
    };

    const fallback = generateFallbackSummary(metrics, mockReceipts);

    const rangeMatches = fallback.match(/\[Lines?\s+\d+\s*[–−-]\s*\d+\]\s*→/g);
    expect(rangeMatches).toHaveLength(3);
  });

  it("should include mandatory closing line in fallback", () => {
    const metrics = {
      overall_score: 72,
      lpm_intermediate_plus: 2.3,
      lines_per_joke: 8.5,
      retention_risk: { overall_risk: "medium" },
    };

    const fallback = generateFallbackSummary(metrics, mockReceipts);

    expect(fallback).toContain(LAUGH_LAB_CLOSING_LINE);
  });

  it("should use appropriate receipts based on severity", () => {
    const metrics = {
      overall_score: 72,
      lpm_intermediate_plus: 2.3,
      lines_per_joke: 8.5,
      retention_risk: { overall_risk: "medium" },
    };

    const fallback = generateFallbackSummary(metrics, mockReceipts);

    // Should include all three receipt ranges
    expect(fallback).toContain("[Lines 45–67] →");
    expect(fallback).toContain("[Lines 89–112] →");
    expect(fallback).toContain("[Lines 134–156] →");
  });
});
