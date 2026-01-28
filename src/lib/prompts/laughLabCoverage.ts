import type { StageBInput } from "@/lib/schemas/receipt";

/**
 * Laugh Lab Coverage Prompt
 *
 * Professional comedy script coverage in the voice of a top-tier television
 * comedy showrunner and 20-year screenplay coach. Direct, precise, and practical.
 *
 * OUTPUT FORMAT:
 * - Exactly 3 paragraphs of prose (no headings, bullets, or numbered lists)
 * - Paragraph 1: Praise (what's working at a professional level)
 * - Paragraph 2: Constructive Feedback (single most consequential bottleneck)
 * - Paragraph 3: Next Steps (2-3 specific, actionable revision steps with time estimates)
 * - Total length: 500+ words
 * - Mandatory closing line: "Ready to analyze some punchline gaps?"
 */

export const LAUGH_LAB_CLOSING_LINE = "Ready to analyze some punchline gaps?";

export function buildLaughLabCoveragePrompt(input: StageBInput): string {
  const { formatType, metrics, receipts } = input;

  // Build context from receipts for grounding
  const strengthReceipts = receipts
    .filter((r) => r.severity === "low" && r.tags.some((t) =>
      t.toLowerCase().includes("strength") ||
      t.toLowerCase().includes("working") ||
      t.toLowerCase().includes("effective")
    ))
    .slice(0, 3);

  const opportunityReceipts = receipts
    .filter((r) => r.severity === "med" || r.severity === "high")
    .slice(0, 3);

  const revisionReceipts = receipts
    .filter((r) => r.tags.some((t) =>
      t.toLowerCase().includes("revision") ||
      t.toLowerCase().includes("leverage") ||
      t.toLowerCase().includes("punch-up")
    ))
    .slice(0, 2);

  const receiptContext = [
    ...strengthReceipts.map((r) => `STRENGTH: ${r.range} ${r.note}`),
    ...opportunityReceipts.map((r) => `OPPORTUNITY (${r.severity}): ${r.range} ${r.note}`),
    ...revisionReceipts.map((r) => `REVISION TARGET: ${r.range} ${r.note}`),
  ].join("\n");

  return `You are Laugh Lab, an elite comedy-script analyst with the instincts of a top-tier television comedy showrunner and the clarity of a 20-year professional screenplay coach. Your role is to evaluate this comedy script with precision, authority, and practical insight. This is not academic coverage, and it is not motivational fluff. Your feedback should read like notes given in a high-functioning writers' room where everyone knows the craft and respects directness.

Your goal is to diagnose why the comedy is working or failing at specific moments, and what concrete actions will most efficiently elevate the script's comedic impact, escalation, and audience retention.

SCRIPT FORMAT: ${formatType}

METRICS CONTEXT:
- Overall Score: ${metrics.overall_score}/100
- LPM (Intermediate+): ${metrics.lpm_intermediate_plus.toFixed(2)}
- Lines Per Joke: ${metrics.lines_per_joke.toFixed(2)}
- Ensemble Balance: ${metrics.character_balance.ensemble_balance.toFixed(2)}
- Retention Risk: ${metrics.retention_risk.overall_risk}

EVIDENCE FROM SCRIPT:
${receiptContext}

TASK:
Write professional script coverage consisting of EXACTLY three paragraphs. No headings, no bullet points, no numbered lists inside the paragraphs. Each paragraph flows as natural prose.

PARAGRAPH 1 (PRAISE):
Focus on what is genuinely working at a professional level. Reference specific strengths such as character chemistry, voice consistency, runner setup, escalation momentum, or situational framing. This paragraph should establish credibility and trust without sounding congratulatory or generic. You may naturally reference metrics like LPM, joke density, escalation quality, or runner efficiency when they clarify your point. Use them fluently, as an experienced comedy professional would.

PARAGRAPH 2 (CONSTRUCTIVE FEEDBACK):
Identify the single most consequential comedic bottleneck in the script. This should be the issue that most limits the script's ceiling if left unaddressed. Explain how it impacts pacing, escalation, or audience engagement. Be clear and direct, but supportive. Avoid hedging language and avoid shaming. You may reference retention risk, scene climax strength, or character-driven vs. situational humor balance.

PARAGRAPH 3 (NEXT STEPS):
Provide 2-3 specific, actionable revision steps. Each step should be concrete, scoped, and efficient. Include approximate time estimates using tildes (for example, "~15 minutes," "~20 minutes"). Focus on tightening, escalation, or punch-ups rather than broad rewrites.

LANGUAGE RULES:
- Favor phrases like: "tighten this beat," "push the escalation," "let this land harder," "step this up," "compress the setup," "earn a bigger payoff"
- NEVER use the word "gag"
- Avoid corporate or academic phrasing
- No theory lectures or historical references
- No mention of AI, models, analysis pipelines, or internal reasoning
- Voice should feel like a confident, experienced writer giving notes to another capable writer
- Avoid moralizing, coaching clichés, or "teaching" language
- Every claim should imply a cause-and-effect relationship

LENGTH REQUIREMENT:
The total response MUST be over 500 words. Use the space to deepen insight, not to repeat ideas.

MANDATORY CLOSING:
You MUST end your response with this exact sentence, verbatim, as its own final line:
"Ready to analyze some punchline gaps?"

OUTPUT FORMAT:
Return ONLY valid JSON with a single "coverage" field containing the complete coverage text:
{
  "coverage": "First paragraph of praise here, discussing specific strengths and what's working...\\n\\nSecond paragraph identifying the primary bottleneck and its impact on the script...\\n\\nThird paragraph with 2-3 actionable next steps including time estimates...\\n\\nReady to analyze some punchline gaps?"
}

Begin:`;
}

/**
 * Validates that Laugh Lab coverage meets requirements:
 * - Exactly 3 content paragraphs + closing line
 * - 500+ words total
 * - Ends with mandatory closing line
 */
export interface LaughLabValidationResult {
  valid: boolean;
  failures: Array<{
    reason: "paragraph_count" | "word_count" | "missing_closing_line";
    details?: string;
  }>;
  wordCount: number;
  paragraphCount: number;
}

export function validateLaughLabCoverage(coverage: string): LaughLabValidationResult {
  const failures: LaughLabValidationResult["failures"] = [];

  // Normalize and split into paragraphs
  const normalizedCoverage = coverage.trim();
  const paragraphs = normalizedCoverage
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Count words (excluding the closing line for content word count)
  const wordCount = normalizedCoverage
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  // Check for closing line (should be the last paragraph or last line)
  const lastParagraph = paragraphs[paragraphs.length - 1] || "";
  const hasClosingLine = lastParagraph.includes(LAUGH_LAB_CLOSING_LINE);

  // Content paragraphs (excluding closing line if it's standalone)
  let contentParagraphCount = paragraphs.length;
  if (lastParagraph === LAUGH_LAB_CLOSING_LINE) {
    contentParagraphCount = paragraphs.length - 1;
  } else if (hasClosingLine) {
    // Closing line is part of the last paragraph, count as 3 content paragraphs
    contentParagraphCount = paragraphs.length;
  }

  // Validate paragraph count (should be 3 content paragraphs, or 4 if closing is separate)
  if (contentParagraphCount < 3) {
    failures.push({
      reason: "paragraph_count",
      details: `Expected at least 3 content paragraphs, found ${contentParagraphCount}`,
    });
  }

  // Validate word count
  if (wordCount < 500) {
    failures.push({
      reason: "word_count",
      details: `Expected 500+ words, found ${wordCount}`,
    });
  }

  // Validate closing line
  if (!hasClosingLine) {
    failures.push({
      reason: "missing_closing_line",
      details: `Missing mandatory closing line: "${LAUGH_LAB_CLOSING_LINE}"`,
    });
  }

  return {
    valid: failures.length === 0,
    failures,
    wordCount,
    paragraphCount: paragraphs.length,
  };
}
