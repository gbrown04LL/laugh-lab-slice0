import { createHash } from "crypto";
import { ScriptFingerprint } from "./types";

/**
 * Normalize script text for hashing/fingerprinting.
 * SECURITY: Never log this normalized text.
 */
export function normalizeForHash(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function computeInputHash(text: string): string {
  const normalized = normalizeForHash(text);
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

export function countWords(text: string): number {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) return 0;
  return normalized.split(/\s+/).filter(Boolean).length;
}

export function estimatePages(wordCount: number): number {
  // Practical approximation: ~250 words per page, min 0.5
  return Math.max(0.5, Math.round((wordCount / 250) * 10) / 10);
}

export function inferFormat(wordCount: number, estimatedPages: number): ScriptFingerprint["inferred_format"] {
  if (estimatedPages <= 8 || wordCount < 2000) return "scene";
  if (estimatedPages <= 45) return "half_hour";
  if (estimatedPages <= 75) return "hour";
  return "feature";
}

export function tierCompatibility(
  inferred: ScriptFingerprint["inferred_format"],
  wordCount: number
): ScriptFingerprint["tier_compatibility"] {
  const ranges: Record<ScriptFingerprint["inferred_format"], { min: number; max: number }> = {
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

export function computeScriptFingerprint(text: string): ScriptFingerprint {
  const wc = countWords(text);
  const pages = estimatePages(wc);
  const inferred = inferFormat(wc, pages);

  return {
    input_hash: computeInputHash(text),
    word_count: wc,
    estimated_pages: pages,
    inferred_format: inferred,
    tier_compatibility: tierCompatibility(inferred, wc),
  };
}
