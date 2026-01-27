import { describe, it, expect } from "vitest";
import { validateSummary, generateFallbackSummary } from "./summaryValidator";
import type { Receipt } from "@/lib/schemas/receipt";

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
    severity: "med",
    metric_refs: ["callbackFrequency"],
    confidence: 0.85,
  },
];

describe("validateSummary", () => {
  it("should pass validation for a valid 3-paragraph summary", () => {
    const validSummary = `This script achieves an overall_score of 72, establishing a solid comedic foundation. The analysis at [Lines 45–67] → reveals a significant pacing gap that impacts the setup phase.

The primary constraint affecting audience retention stems from character dynamics, with characterBalance showing uneven distribution. Specifically, [Lines 89–112] → demonstrates how the dominant lead minimizes ensemble opportunities.

For revision, focus on the leverage zones identified in the retention_risk analysis. The opportunity at [Lines 134–156] → offers a high-impact callback moment that can strengthen the act two button sequence.`;

    const result = validateSummary(validSummary, mockReceipts);

    expect(result.valid).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("should fail validation when paragraph count is wrong", () => {
    const twoParaSummary = `This script achieves an overall_score of 72. The analysis at [Lines 45–67] → reveals a pacing gap.

The primary constraint stems from characterBalance issues at [Lines 89–112] → showing uneven distribution.`;

    const result = validateSummary(twoParaSummary, mockReceipts);

    expect(result.valid).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        reason: "paragraph_count",
        details: expect.stringContaining("Expected 3 paragraphs, found 2"),
      })
    );
  });

  it("should fail validation when an unapproved receipt range is cited", () => {
    const invalidRangeSummary = `This script achieves an overall_score of 72. The analysis at [Lines 45–67] → reveals a pacing gap.

The primary constraint stems from characterBalance issues at [Lines 200–220] → showing problems.

For revision, focus on retention_risk at [Lines 134–156] → for high-impact opportunities.`;

    const result = validateSummary(invalidRangeSummary, mockReceipts);

    expect(result.valid).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        reason: "unapproved_receipt_range",
        details: expect.stringContaining("[Lines 200–220] →"),
      })
    );
  });

  it("should fail validation when a paragraph is missing a metric", () => {
    const noMetricSummary = `This script achieves an overall_score of 72. The analysis at [Lines 45–67] → reveals a pacing gap.

The character dynamics show issues at [Lines 89–112] → with uneven distribution patterns.

For revision, focus on opportunities at [Lines 134–156] → for high-impact improvements.`;

    const result = validateSummary(noMetricSummary, mockReceipts);

    expect(result.valid).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        reason: "missing_metric_p2",
        details: expect.stringContaining(
          "does not contain an approved metric substring"
        ),
      })
    );
  });

  it("should fail validation when a paragraph is missing a receipt range", () => {
    const noReceiptSummary = `This script achieves an overall_score of 72. The analysis at [Lines 45–67] → reveals a pacing gap.

The primary constraint stems from characterBalance issues showing uneven distribution patterns.

For revision, focus on retention_risk at [Lines 134–156] → for high-impact opportunities.`;

    const result = validateSummary(noReceiptSummary, mockReceipts);

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
This script achieves an overall_score of 72. The analysis at [Lines 45–67] → reveals a pacing gap.

- The primary constraint stems from characterBalance issues at [Lines 89–112] →
- Shows uneven distribution patterns

For revision, focus on retention_risk at [Lines 134–156] → for opportunities.`;

    const result = validateSummary(formattedSummary, mockReceipts);

    expect(result.valid).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({
        reason: "formatting_violation",
      })
    );
  });

  it("should handle different dash types in receipt ranges", () => {
    const hyphenSummary = `This script achieves an overall_score of 72. The analysis at [Lines 45-67] → reveals a pacing gap.

The primary constraint stems from characterBalance at [Lines 89–112] → showing issues.

For revision, focus on retention_risk at [Lines 134−156] → for opportunities.`;

    const result = validateSummary(hyphenSummary, mockReceipts);

    // Should pass because normalizeRange handles different dash types
    expect(result.valid).toBe(true);
  });

  it("should accept metric variants (LPM, laughsPerMinute, etc.)", () => {
    const variantMetricsSummary = `This script shows LPM at 2.3 with solid pacing. The analysis at [Lines 45–67] → reveals gaps.

The LPJ metric indicates characterBalance issues at [Lines 89–112] → with distribution problems.

For revision, focus on gapPriority zones at [Lines 134–156] → for leverage opportunities.`;

    const result = validateSummary(variantMetricsSummary, mockReceipts);

    expect(result.valid).toBe(true);
    expect(result.failures).toHaveLength(0);
  });
});

describe("generateFallbackSummary", () => {
  it("should generate a valid 3-paragraph fallback summary", () => {
    const metrics = {
      overall_score: 72,
      lpm_intermediate_plus: 2.3,
      lines_per_joke: 8.5,
      retention_risk: { overall_risk: "medium" },
    };

    const fallback = generateFallbackSummary(metrics, mockReceipts);

    // Should have exactly 3 paragraphs
    const paragraphs = fallback.split("\n\n").filter((p) => p.trim().length > 0);
    expect(paragraphs).toHaveLength(3);

    // Should pass validation
    const result = validateSummary(fallback, mockReceipts);
    expect(result.valid).toBe(true);
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

  it("should prioritize high severity receipts in fallback", () => {
    const metrics = {
      overall_score: 72,
      lpm_intermediate_plus: 2.3,
      lines_per_joke: 8.5,
      retention_risk: { overall_risk: "medium" },
    };

    const fallback = generateFallbackSummary(metrics, mockReceipts);

    // The first receipt (r01) has high severity and should be included
    expect(fallback).toContain("[Lines 45–67] →");
  });
});
