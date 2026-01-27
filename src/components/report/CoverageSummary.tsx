'use client';

import React from 'react';

export interface ReviewSummary {
  praise: string;
  constructive: string;
  nextSteps: string;
}

interface CoverageSummaryProps {
  summary: ReviewSummary;
}

export function CoverageSummary({ summary }: CoverageSummaryProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
        Coverage Summary
      </h2>

      <div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-700 dark:text-slate-200">
        <p>{summary.praise}</p>
        <p>{summary.constructive}</p>
        <p>{summary.nextSteps}</p>
      </div>
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
