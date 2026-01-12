import { createHash } from "crypto";
import type {
  PromptAOutput,
  PromptBOutput,
  TierConfig,
  InferredFormatType,
  TierCompatibilityType,
} from "./types";

/**
 * Normalize text for hashing (stable across platforms).
 * NOTE: Do not lower-case; preserve semantics. Keep deterministic.
 */
export function normalizeForHash(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/**
 * Slice-0 Prompt A generator (LLM System Prompt).
 * MUST be structure-only (no prose/coaching).
 */
export const PROMPT_A_SYSTEM = `You are an expert comedy script analyst. Your task is to analyze the provided script and return a single, valid JSON object that strictly adheres to the following Zod schema. Do not include any explanatory text or markdown formatting in your response.

**JSON Schema:**
{
  "classification": {
    "inferred_format": "(scene | half_hour | hour | feature)",
    "word_count": "number",
    "estimated_pages": "number",
    "tier_compatibility": "(ok | too_short | too_long | unsupported_format)"
  },
  "metrics": {
    "overall_score": "number (0-100)",
    "lpm_intermediate_plus": "number",
    "lines_per_joke": "number",
    "peak_moments": [
      {
        "moment_id": "string",
        "label": "string",
        "location": { "type": "(line_range | timecode_range | scene)", "value": "string" },
        "reason_tag": "(setup_payoff | surprise | character | escalation | button | other)"
      }
    ],
    "character_balance": {
      "ensemble_balance": "number (0-1)",
      "dominant_character": "string",
      "characters": [
        { "name": "string", "joke_share": "number (0-1)", "line_share": "number (0-1)", "underutilized": "boolean" }
      ]
    },
    "retention_risk": {
      "overall_risk": "(low | medium | high)",
      "indicators": [
        { "indicator_id": "string", "type": "(gap_cluster | late_soft_end | repeat_escalation | low_surprise_run)", "location": { "type": "(line_range | timecode_range | scene)", "value": "string" }, "severity": "(minor | moderate | major)" }
      ]
    }
  },
  "issue_candidates": [
    {
      "issue_id": "string",
      "type": "(pacing_soft_spot | escalation_repeat | surprise_decay | button_weakness | character_underutilization | other)",
      "location": { "type": "(line_range | timecode_range | scene)", "value": "string" },
      "severity": "(minor | moderate | major)",
      "tags": ["string"],
      "evidence": { "quote_snippet": "string (max 140 chars)", "metric_refs": ["string"] }
    }
  ]
}
`;

/**
 * Slice-0 Prompt B generator (LLM System Prompt).
 * MUST NOT introduce new issues beyond Prompt A.
 */
export const PROMPT_B_SYSTEM = `You are an expert comedy script analyst. Based on the provided script and the JSON output from Prompt A, generate a detailed narrative analysis. Your response must be a single, valid JSON object that strictly adheres to the following Zod schema. Every issue referenced in your output must correspond to an 'issue_id' from the 'issue_candidates' array in the Prompt A output. Do not introduce new issues.

**JSON Schema:**
{
  "sections": {
    "comedy_metrics_snapshot": { "bullets": ["string"], "notes": "string (optional)" },
    "strengths_to_preserve": ["string"],
    "whats_getting_in_the_way": [
      {
        "issue_id": "string (must exist in Prompt A output)",
        "why_it_matters": "string",
        "concrete_fix": { "title": "string", "steps": ["string"], "expected_result": "string" }
      }
    ],
    "recommended_fixes": [
      { "issue_id": "string (must exist in Prompt A output)", "fix": "string" }
    ],
    "punch_up_suggestions": [
      {
        "moment_id": "string (must exist in Prompt A output)",
        "moment_context": "string",
        "options": [{ "option_id": "string", "device": "string", "text": "string" }]
      }
    ],
    "how_to_revise_this_efficiently": {
      "revision_plan": { "mode": "(time_boxed | multi_pass)", "steps": [{ "step": "string", "timebox_minutes": "number (optional)", "pass": "string (optional)" }] }
    }
  }
}
`;
