# Evidence-Lock Pipeline Specification

This document outlines the two-stage Evidence-Lock pipeline for Laugh Lab analysis.

## STAGE A: Receipt Extraction (Evidence Lock)

**Input:** `script_text`, optional `jokesByLine[]`, optional `characters[]`, and `metrics_snapshot` (already computed; treat as truth).

**Output:** JSON ONLY matching `StageAOutput` schema:
- `formatType` (use provided value; if missing/auto, infer `sitcom|sketch|standup|feature` from `script_text`)
- `metrics` (PASS-THROUGH from `metrics_snapshot`; do not recompute)
- `receipts[]` (10–15) with strict `Receipt` schema:
  - `id`: "r01"..."r15"
  - `range`: EXACT format "[Lines X–Y] →" (prefer EN DASH)
  - `quote?`: optional, <=20 words (but prefer no quotes)
  - `note`: 8–20 words, plain English, no adjectives
  - `tags`: `string[]`
  - `severity`: `"low"|"med"|"high"`
  - `metric_refs`: `string[]`
  - `confidence`: number 0..1

**Receipt selection rules (deterministic mix):**
- 2–3 tone/engine
- 3–4 constraint (largest gaps)
- 2–3 character distribution
- 1–2 callback (actual or clearly missed)
- 2–3 revision-leverage (highest ROI punch-up zones)

Priority order: `gapPriorityScores`, `retentionCliff`, `LPM/LPJ` deviations, character imbalance, callback chains/misses.

## STAGE B: Executive Summary (Consumer)

**Inputs:** `formatType`, `metrics`, `receipts[]`

**Output:** EXACTLY 3 paragraphs, prose only.

Each paragraph must contain (a) at least one metric key substring and (b) at least one receipt range.

HARD RESTRICTION: may ONLY cite receipt ranges present in `receipts[]`. Must paste range exactly. Must not invent evidence. Ban dialogue quotes in the summary entirely.

## VALIDATOR (hard gate)

Implement `src/lib/validators/summaryValidator.ts`:

- Split into paragraphs on blank lines; must be exactly 3.
- Disallow formatting lines starting with `-`, `1.`, `ALLCAPS` headings, `PARAGRAPH/SECTION/CARD`, etc.
- Require per paragraph: contains metric key substring and a receipt range.
- Approved receipt lock: extract ALL ranges using bracketed regex and ensure they are in `receipts[].range` after dash normalization.
- Metric substrings accepted by validator should include both canonical + common variants:
  ```json
  [
    "overallScore","overall_score",
    "LPM","laughsPerMinute",
    "LPJ","linesPerJoke",
    "CHS","callbackFrequency",
    "characterBalance",
    "retentionCliff",
    "gapPriorityScores","gapPriority"
  ]
  ```

**IMPORTANT:** Receipt range regex must match the bracketed format:
`/[Lines?\s+\d+\s*[–−-]\s*\d+]\s+→/g`

## PIPELINE ORCHESTRATION

In the analyze endpoint/runner:

1. Run Stage A (strict JSON parse with Zod). Persist result.
2. Run Stage B. Validate.
3. If fail: silent retry ONCE using same receipts.
4. If still fail: fallback summary template that uses only metrics + 3 receipt ranges (still 3 paragraphs).
5. Log failure reasons (`paragraph_count`, `missing_metric_pX`, `missing_receipt_pX`, `unapproved_receipt_range`, etc.)
