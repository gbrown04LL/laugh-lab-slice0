'use client';

import React from 'react';

/**
 * Laugh Lab closing line constant
 */
const LAUGH_LAB_CLOSING_LINE = "Ready to analyze some punchline gaps?";

export interface ReviewSummary {
  praise: string;
  constructive: string;
  nextSteps: string;
}

interface CoverageSummaryProps {
  summary: ReviewSummary;
  /** Optional: raw summary text from evidence-lock pipeline */
  rawSummary?: string;
}

/**
 * Parse raw summary text into structured ReviewSummary
 * Handles the Laugh Lab format: 3 paragraphs + closing line
 */
function parseRawSummary(rawSummary: string): ReviewSummary {
  const paragraphs = rawSummary
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && p !== LAUGH_LAB_CLOSING_LINE);

  return {
    praise: paragraphs[0] || '',
    constructive: paragraphs[1] || '',
    nextSteps: paragraphs[2] || '',
  };
}

/**
 * Check if summary contains the Laugh Lab closing line
 */
function hasClosingLine(summary: ReviewSummary | string): boolean {
  if (typeof summary === 'string') {
    return summary.includes(LAUGH_LAB_CLOSING_LINE);
  }
  return (
    summary.praise.includes(LAUGH_LAB_CLOSING_LINE) ||
    summary.constructive.includes(LAUGH_LAB_CLOSING_LINE) ||
    summary.nextSteps.includes(LAUGH_LAB_CLOSING_LINE)
  );
}

export function CoverageSummary({ summary, rawSummary }: CoverageSummaryProps) {
  // Use raw summary if provided, otherwise use structured summary
  const parsedSummary = rawSummary ? parseRawSummary(rawSummary) : summary;
  const showClosingLine = rawSummary
    ? rawSummary.includes(LAUGH_LAB_CLOSING_LINE)
    : hasClosingLine(summary);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
        Script Coverage
      </h2>

      <div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-700 dark:text-slate-200">
        {parsedSummary.praise && <p>{parsedSummary.praise}</p>}
        {parsedSummary.constructive && <p>{parsedSummary.constructive}</p>}
        {parsedSummary.nextSteps && <p>{parsedSummary.nextSteps}</p>}
      </div>

      {showClosingLine && (
        <p className="mt-6 text-sm font-medium text-violet-600 dark:text-violet-400">
          {LAUGH_LAB_CLOSING_LINE}
        </p>
      )}
    </section>
  );
}

// Helper to generate summary from existing API data
export function generateSummaryFromData(data: {
  score: number;
  lpm: number;
  strengths: string[];
  issues: Array<{ why_it_matters: string; concrete_fix?: { title: string } }>;
  revisionSteps: Array<{ step: string; timebox_minutes?: number }>;
  retentionRisk?: string;
}): ReviewSummary {
  const { score, lpm, strengths, issues, revisionSteps, retentionRisk } = data;

  // Praise: top strengths + metrics context
  const topStrengths = strengths.slice(0, 2);
  const scoreContext = score >= 80 ? 'exceptional' : score >= 70 ? 'strong' : 'solid';
  const lpmContext = lpm >= 2.0 ? 'above industry benchmarks' : lpm >= 1.5 ? 'on target' : 'has room to grow';

  const praise = topStrengths.length > 0
    ? `This script demonstrates ${scoreContext} comedy writing with an LPM that's ${lpmContext}. ${topStrengths[0]} ${topStrengths[1] ? `Additionally, ${topStrengths[1].toLowerCase()}` : ''}`
    : `This script shows ${scoreContext} potential with a comedy score of ${score}/100.`;

  // Constructive: top issue + retention risk
  const topIssue = issues[0];
  const constructive = topIssue
    ? `The primary opportunity lies in addressing: ${topIssue.why_it_matters}${retentionRisk && retentionRisk !== 'low' ? ` The overall retention risk is ${retentionRisk}, which warrants attention to maintain audience engagement.` : ''}`
    : 'No significant issues were identified. Focus on polish and refinement.';

  // Next steps: revision plan
  const steps = revisionSteps.slice(0, 2);
  const nextSteps = steps.length > 0
    ? `Recommended next steps: ${steps.map((s, i) => `(${i + 1}) ${s.step}${s.timebox_minutes ? ` (~${s.timebox_minutes} min)` : ''}`).join(' ')}`
    : 'Review the punch-up suggestions below and implement the highest-impact changes first.';

  return { praise, constructive, nextSteps };
}
