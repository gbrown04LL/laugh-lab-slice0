import type { StageAInput } from "@/lib/schemas/receipt";

/**
 * Stage A: Receipt Extraction Prompt
 *
 * Extracts 10-15 structured receipts from the script analysis.
 * Receipts are evidence-locked observations that will be cited in Stage B.
 *
 * CRITICAL:
 * - Output MUST be valid JSON only, no prose
 * - Pass through metrics_snapshot unchanged (do not recompute)
 * - Extract exactly 10-15 receipts following the deterministic mix
 */
export function buildStageAPrompt(input: StageAInput): string {
  const { script_text, jokesByLine, characters, metrics_snapshot } = input;

  return `You are a comedy script analyzer. Extract structured receipts from this script analysis.

INPUT DATA:
Script Text:
${script_text}

${jokesByLine ? `Jokes by Line: ${JSON.stringify(jokesByLine)}` : ""}
${characters ? `Characters: ${JSON.stringify(characters)}` : ""}

Metrics Snapshot (PASS THROUGH UNCHANGED):
${JSON.stringify(metrics_snapshot, null, 2)}

TASK:
Extract exactly 10-15 receipts following this deterministic mix:
- 2-3 tone/engine observations
- 3-4 constraint observations (largest gaps in pacing/retention)
- 2-3 character distribution observations
- 1-2 callback observations (actual callbacks or clearly missed opportunities)
- 2-3 revision-leverage observations (highest ROI punch-up zones)

Priority order for selection:
1. gapPriorityScores (from retention_risk indicators)
2. retentionCliff markers
3. LPM/LPJ deviations from target
4. Character imbalance (from character_balance)
5. Callback chains or missed callback opportunities

RECEIPT SCHEMA:
Each receipt must have:
- id: "r01" through "r15"
- range: EXACT format "[Lines X–Y] →" (use EN DASH –, not hyphen)
- quote: optional, <=20 words (prefer NO quotes)
- note: 8-20 words, plain English, no adjectives, factual observation only
- tags: string[] (e.g., ["gap", "pacing"], ["character", "underutilized"])
- severity: "low" | "med" | "high"
- metric_refs: string[] (reference metric keys like "lpm_intermediate_plus", "retention_risk")
- confidence: number between 0 and 1

OUTPUT FORMAT:
Return ONLY valid JSON matching this schema:
{
  "formatType": "sitcom" | "sketch" | "standup" | "feature",
  "metrics": <PASS_THROUGH_UNCHANGED>,
  "receipts": [
    {
      "id": "r01",
      "range": "[Lines 45–67] →",
      "note": "gap of 22 lines creates retention risk in act one setup",
      "tags": ["gap", "pacing", "retention"],
      "severity": "high",
      "metric_refs": ["retention_risk", "lpm_intermediate_plus"],
      "confidence": 0.92
    }
    // ... 9-14 more receipts
  ]
}

CRITICAL RULES:
1. Output ONLY the JSON object, no markdown code blocks, no prose
2. Do NOT recompute metrics - pass through exactly as provided
3. Infer formatType from script structure if not obvious (default: "sitcom")
4. Use EN DASH (–) in range format, not hyphen (-)
5. Keep notes factual and concise (8-20 words)
6. Ensure exactly 10-15 receipts total

Begin:`;
}
