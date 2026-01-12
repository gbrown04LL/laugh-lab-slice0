import { createHash } from "crypto";
import type {
  PromptAOutput,
  PromptBOutput,
  TierConfig,
  IssueCandidate,
  PeakMoment,
  InferredFormatType,
  TierCompatibilityType,
  IssueLocation,
} from "./types";

// ============================================================================
// Environment flag for stub mode
// ============================================================================

/**
 * When LLM_PROVIDER=stub, use deterministic placeholder generators instead of OpenAI.
 * This is for dev/test only; production must use the real LLM.
 */
export const USE_STUB_PROVIDER = process.env.LLM_PROVIDER === "stub";

// ============================================================================
// System prompts for OpenAI Structured Outputs
// ============================================================================

/**
 * Prompt A system instruction.
 *
 * IMPORTANT: Schema enforcement is handled by OpenAI Structured Outputs (json_schema).
 * This prompt focuses on task guidance only.
 *
 * Prompt A = structure, metrics, and issue identification only.
 * No prose, no human-facing coaching, no fixes.
 */
export const PROMPT_A_SYSTEM = `You are an expert comedy script analyst.

Analyze the provided script and return a structured JSON response.

Your analysis should cover:
1. CLASSIFICATION: Infer the script format (scene, half_hour, hour, feature), count words, estimate pages, and assess tier compatibility.
2. METRICS: Calculate an overall comedy score (0-100), laughs-per-minute for intermediate+ jokes, lines-per-joke ratio, identify peak comedy moments (up to 3), analyze character balance, and assess retention risk.
3. ISSUE CANDIDATES: Identify up to 4 potential issues affecting comedy effectiveness. Each issue needs a unique issue_id, type, location, severity, tags, and evidence (including a quote snippet under 140 chars).

Focus on objective, data-driven analysis. Do not include recommendations or coaching in this response.

Return JSON only. No markdown. No extra keys.`;

/**
 * Prompt B system instruction.
 *
 * IMPORTANT: Schema enforcement is handled by OpenAI Structured Outputs (json_schema).
 * This prompt focuses on task guidance only.
 *
 * Prompt B = human-facing sections (feedback, fixes, punch-ups, revision guidance).
 * MUST NOT introduce new issues beyond those identified in Prompt A.
 */
export const PROMPT_B_SYSTEM = `You are an expert comedy script analyst providing detailed feedback.

Based on the script and the Prompt A analysis results provided, generate human-readable coaching content.

CRITICAL CONSTRAINT: You MUST NOT introduce new issues. Every issue_id you reference MUST match an issue_id from the Prompt A analysis provided in the input. Do not invent or create new issue identifiers.

Similarly, every moment_id in punch_up_suggestions MUST match a moment_id from the peak_moments in Prompt A.

Your response should include:
1. COMEDY METRICS SNAPSHOT: Summarize key metrics as bullet points with optional notes.
2. STRENGTHS TO PRESERVE: List 2-4 things the script does well that should be kept.
3. WHAT'S GETTING IN THE WAY: For each issue from Prompt A, explain why it matters and provide a concrete fix (title, steps, expected result).
4. RECOMMENDED FIXES: Brief fix descriptions keyed to issue_ids.
5. PUNCH-UP SUGGESTIONS: For each peak moment, provide 2-3 alternative options (option_id, comedy device, suggested text).
6. HOW TO REVISE EFFICIENTLY: A revision plan with mode (time_boxed or multi_pass) and steps.

Return JSON only. No markdown. No extra keys.`;

// ============================================================================
// Stub helpers (only reachable when LLM_PROVIDER=stub)
// ============================================================================

function normalizeForHash(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function stableId(prefix: string, index: number, seed: string): string {
  const suffix = seed.slice(0, 8);
  return `${prefix}_${index + 1}_${suffix}`;
}

function countWords(text: string): number {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) return 0;
  return normalized.split(/\s+/).filter(Boolean).length;
}

function estimatePages(wordCount: number): number {
  return Math.max(0.5, Math.round((wordCount / 250) * 10) / 10);
}

function inferFormat(wordCount: number, estimatedPages: number): InferredFormatType {
  if (estimatedPages <= 8 || wordCount < 2000) return "scene";
  if (estimatedPages <= 45) return "half_hour";
  if (estimatedPages <= 75) return "hour";
  return "feature";
}

function tierCompatibility(inferred: InferredFormatType, wordCount: number): TierCompatibilityType {
  const ranges: Record<InferredFormatType, { min: number; max: number }> = {
    scene: { min: 200, max: 6000 },
    half_hour: { min: 2500, max: 15000 },
    hour: { min: 5000, max: 25000 },
    feature: { min: 10000, max: 50000 },
  };
  const r = ranges[inferred];
  if (wordCount < r.min) return "too_short";
  if (wordCount > r.max) return "too_long";
  return "ok";
}

function makeLocation(type: IssueLocation["type"], value: string): IssueLocation {
  return { type, value };
}

function pseudoScore(seedHex: string): number {
  const n = parseInt(seedHex.slice(0, 4), 16);
  return Math.round(((n % 7000) / 7000) * 1000) / 10;
}

function bounded01(seedHex: string, offset: number): number {
  const n = parseInt(seedHex.slice(offset, offset + 4), 16);
  return Math.round(((n % 1000) / 1000) * 1000) / 1000;
}

// ============================================================================
// Stub generators (quarantined behind LLM_PROVIDER=stub)
// ============================================================================

/**
 * Deterministic Prompt A placeholder generator.
 * ONLY reachable when LLM_PROVIDER=stub.
 *
 * @throws Error if called without stub mode enabled
 */
export function runPromptAStub(scriptText: string): PromptAOutput {
  if (!USE_STUB_PROVIDER) {
    throw new Error("runPromptAStub called but LLM_PROVIDER is not 'stub'. This is a code path error.");
  }

  const wordCount = countWords(scriptText);
  const estimatedPages = estimatePages(wordCount);

  const seed = sha256(normalizeForHash(scriptText));
  const inferred = inferFormat(wordCount, estimatedPages);
  const compatibility = tierCompatibility(inferred, wordCount);

  const overallScore = Math.max(0, Math.min(100, pseudoScore(seed)));

  const peakMoments: PeakMoment[] = [
    {
      moment_id: stableId("moment", 0, seed),
      label: "Early hook",
      location: makeLocation("line_range", "L10-L18"),
      reason_tag: "surprise",
    },
    {
      moment_id: stableId("moment", 1, seed),
      label: "Midpoint turn",
      location: makeLocation("line_range", "L120-L140"),
      reason_tag: "escalation",
    },
    {
      moment_id: stableId("moment", 2, seed),
      label: "Ending beat",
      location: makeLocation("line_range", "L260-L275"),
      reason_tag: "button",
    },
  ];

  const issueCandidates: IssueCandidate[] = [
    {
      issue_id: stableId("issue", 0, seed),
      type: "pacing_soft_spot",
      location: makeLocation("line_range", "L85-L110"),
      severity: "moderate",
      tags: ["pacing", "momentum"],
      evidence: {
        quote_snippet: "Snippet withheld in Slice-0 (pacing soft spot).",
        metric_refs: ["lines_per_joke", "retention_risk"],
      },
    },
    {
      issue_id: stableId("issue", 1, seed),
      type: "escalation_repeat",
      location: makeLocation("line_range", "L150-L190"),
      severity: "minor",
      tags: ["escalation", "variety"],
      evidence: {
        quote_snippet: "Snippet withheld in Slice-0 (repeat escalation).",
        metric_refs: ["peak_moments", "retention_risk"],
      },
    },
    {
      issue_id: stableId("issue", 2, seed),
      type: "button_weakness",
      location: makeLocation("line_range", "L265-L275"),
      severity: "major",
      tags: ["ending", "button"],
      evidence: {
        quote_snippet: "Snippet withheld in Slice-0 (ending button weakness).",
        metric_refs: ["overall_score"],
      },
    },
    {
      issue_id: stableId("issue", 3, seed),
      type: "character_underutilization",
      location: makeLocation("scene", "Scene 4"),
      severity: "minor",
      tags: ["character", "balance"],
      evidence: {
        quote_snippet: "Snippet withheld in Slice-0 (character underutilized).",
        metric_refs: ["character_balance"],
      },
    },
  ];

  const maxIssues = 4;
  const finalIssues = issueCandidates.slice(0, maxIssues);

  const lpm = Math.max(0, Math.round((overallScore / 20) * 10) / 10);
  const linesPerJoke = Math.max(1, Math.round((12 - overallScore / 12) * 10) / 10);

  return {
    classification: {
      inferred_format: inferred,
      word_count: wordCount,
      estimated_pages: estimatedPages,
      tier_compatibility: compatibility,
    },
    metrics: {
      overall_score: overallScore,
      lpm_intermediate_plus: lpm,
      lines_per_joke: linesPerJoke,
      peak_moments: peakMoments.slice(0, 3),
      character_balance: {
        ensemble_balance: Math.max(0, Math.min(1, 1 - bounded01(seed, 8) / 2)),
        dominant_character: "CHAR_A",
        characters: [
          { name: "CHAR_A", joke_share: 0.45, line_share: 0.5, underutilized: false },
          { name: "CHAR_B", joke_share: 0.35, line_share: 0.3, underutilized: false },
          { name: "CHAR_C", joke_share: 0.20, line_share: 0.2, underutilized: true },
        ],
      },
      retention_risk: {
        overall_risk: overallScore >= 70 ? "low" : overallScore >= 45 ? "medium" : "high",
        indicators: [
          {
            indicator_id: stableId("indicator", 0, seed),
            type: "gap_cluster",
            location: makeLocation("line_range", "L85-L110"),
            severity: "moderate",
          },
        ],
      },
    },
    issue_candidates: finalIssues,
  };
}

/**
 * Deterministic Prompt B placeholder generator.
 * ONLY reachable when LLM_PROVIDER=stub.
 *
 * @throws Error if called without stub mode enabled
 */
export function runPromptBStub(
  scriptText: string,
  promptA: PromptAOutput,
  tierConfig: TierConfig
): PromptBOutput {
  if (!USE_STUB_PROVIDER) {
    throw new Error("runPromptBStub called but LLM_PROVIDER is not 'stub'. This is a code path error.");
  }

  const issueIds = new Set(promptA.issue_candidates.map((i) => i.issue_id));

  const maxIssues = Math.max(0, Math.min(tierConfig.max_issues, promptA.issue_candidates.length));
  const selectedIssues = promptA.issue_candidates.slice(0, maxIssues);

  // Hard enforcement in generator
  for (const i of selectedIssues) {
    if (!issueIds.has(i.issue_id)) {
      throw new Error(`Prompt B attempted to reference unknown issue_id: ${i.issue_id}`);
    }
  }

  const bullets = [
    `Overall score: ${promptA.metrics.overall_score}/100`,
    `Lines per joke: ${promptA.metrics.lines_per_joke}`,
    `LPM (Intermediate+): ${promptA.metrics.lpm_intermediate_plus}`,
    `Retention risk: ${promptA.metrics.retention_risk.overall_risk}`,
  ];

  const whatsGettingInTheWay = selectedIssues.map((iss, idx) => ({
    issue_id: iss.issue_id,
    why_it_matters: "This creates a local dip in momentum and reduces payoff clarity.",
    concrete_fix: {
      title: `Fix ${idx + 1}: tighten and escalate`,
      steps: [
        "Trim one beat that restates the same idea.",
        "Add one clear escalation turn (new information or higher stakes).",
        "End the beat with a cleaner button that changes the next beat's energy.",
      ],
      expected_result: "Faster pace, clearer progression, stronger payoff density.",
    },
  }));

  const recommendedFixes = selectedIssues.map((iss) => ({
    issue_id: iss.issue_id,
    fix: "Apply the concrete fix steps above; keep the change localized to the tagged location.",
  }));

  const peakMoments = promptA.metrics.peak_moments.slice(0, tierConfig.punch_up_moments);
  const punchUpSuggestions = peakMoments.map((m, midx) => ({
    moment_id: m.moment_id,
    moment_context: `${m.label} (${m.location.value})`,
    options: Array.from({ length: tierConfig.options_per_moment }).map((_, oidx) => ({
      option_id: stableId(`opt_${midx + 1}`, oidx, m.moment_id),
      device: ["misdirection", "contrast", "tag"][oidx % 3],
      text: `Slice-0 placeholder punch-up option ${oidx + 1} for ${m.label}.`,
    })),
  }));

  const revisionMode = tierConfig.revision_guidance_level;
  const revisionSteps =
    revisionMode === "time_boxed"
      ? [
          { step: "Pass 1: Fix the top issues in order.", timebox_minutes: 25 },
          { step: "Pass 2: Punch up the selected peak moments.", timebox_minutes: 20 },
          { step: "Pass 3: Quick read for flow + buttons.", timebox_minutes: 15 },
        ]
      : [
          { step: "Pass A: Structural tightening by issue list.", pass: "A" },
          { step: "Pass B: Punch-up moments pass.", pass: "B" },
          { step: "Pass C: Dialogue/line polish pass.", pass: "C" },
        ];

  return {
    sections: {
      comedy_metrics_snapshot: {
        bullets,
        notes: "Deterministic Slice-0 placeholders (stub mode).",
      },
      strengths_to_preserve: [
        "Clear premise signal early.",
        "At least one strong escalation moment.",
        "Distinct character voices in key beats.",
      ],
      whats_getting_in_the_way: whatsGettingInTheWay,
      recommended_fixes: recommendedFixes,
      punch_up_suggestions: punchUpSuggestions,
      how_to_revise_this_efficiently: {
        revision_plan: {
          mode: revisionMode,
          steps: revisionSteps,
        },
      },
    },
  };
}

// ============================================================================
// Legacy exports (deprecated, for backwards compat only)
// ============================================================================

/**
 * @deprecated Use runPromptAStub with LLM_PROVIDER=stub, or callOpenAIWithSchema for production.
 */
export const runPromptA = runPromptAStub;

/**
 * @deprecated Use runPromptBStub with LLM_PROVIDER=stub, or callOpenAIWithSchema for production.
 */
export const runPromptB = runPromptBStub;
