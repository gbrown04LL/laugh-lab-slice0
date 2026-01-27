import type { StageBInput } from "@/lib/schemas/receipt";

/**
 * Stage B: Executive Summary Prompt
 *
 * Generates a 3-paragraph prose summary that MUST cite receipts from Stage A.
 * This is the evidence-locked consumer-facing summary.
 *
 * CRITICAL:
 * - Output EXACTLY 3 paragraphs of prose
 * - Each paragraph MUST contain at least one metric key substring
 * - Each paragraph MUST contain at least one receipt range copied EXACTLY
 * - May ONLY cite receipt ranges present in receipts[]
 * - NO dialogue quotes allowed in the summary
 */
export function buildStageBPrompt(input: StageBInput): string {
  const { formatType, metrics, receipts } = input;

  const receiptList = receipts
    .map(
      (r) =>
        `${r.id}: ${r.range} ${r.note} [${r.tags.join(", ")}] (severity: ${r.severity})`
    )
    .join("\n");

  return `You are writing an executive summary for a comedy script analysis.

FORMAT TYPE: ${formatType}

METRICS SUMMARY:
- Overall Score: ${metrics.overall_score}
- LPM (Laughs Per Minute): ${metrics.lpm_intermediate_plus.toFixed(2)}
- Lines Per Joke: ${metrics.lines_per_joke.toFixed(2)}
- Character Balance: ${metrics.character_balance.ensemble_balance.toFixed(2)}
- Retention Risk: ${metrics.retention_risk.overall_risk}

APPROVED RECEIPTS (you may ONLY cite these):
${receiptList}

TASK:
Write EXACTLY 3 paragraphs of prose that form a professional executive summary.

PARAGRAPH 1: Overall assessment
- Mention the overall_score or overallScore
- Cite at least one receipt range EXACTLY as shown above (e.g., "[Lines 45–67] →")
- Provide context on what's working or the script's foundation

PARAGRAPH 2: Primary limitation or constraint
- Reference a metric like LPM, LPJ, retention_risk, or character_balance
- Cite at least one receipt range EXACTLY as shown above
- Explain the key challenge or gap affecting the script

PARAGRAPH 3: Revision guidance or next steps
- Reference a metric or receipt that points to leverage/opportunity
- Cite at least one receipt range EXACTLY as shown above
- Provide actionable direction for improvement

CRITICAL RULES:
1. Output ONLY prose - no bullets, no numbering, no headings, no "PARAGRAPH 1:" labels
2. EXACTLY 3 paragraphs separated by blank lines
3. Each paragraph MUST include:
   - At least one metric key substring (e.g., "overall_score", "LPM", "retention_risk")
   - At least one receipt range copied EXACTLY from the approved list above
4. You may ONLY cite receipt ranges that appear in the approved receipts list
5. Do NOT invent or modify receipt ranges
6. Do NOT include dialogue quotes in the summary
7. Use professional, editorial tone (like a comedy coverage note)
8. Paste receipt ranges EXACTLY including brackets and arrow: "[Lines X–Y] →"

OUTPUT FORMAT:
Return ONLY valid JSON with a single "summary" field containing the 3-paragraph text:
{
  "summary": "Paragraph one text here mentioning overall_score and citing [Lines 45–67] → as evidence.\\n\\nParagraph two text here mentioning LPM and citing [Lines 89–112] → as evidence.\\n\\nParagraph three text here mentioning retention_risk and citing [Lines 134–156] → as evidence."
}

Begin:`;
}
