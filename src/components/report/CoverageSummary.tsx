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
// Generates Laugh Lab format: 500+ words, professional showrunner tone, no numbered lists
export function generateSummaryFromData(data: {
  score: number;
  lpm: number;
  strengths: string[];
  issues: Array<{ why_it_matters: string; concrete_fix?: { title: string } }>;
  revisionSteps: Array<{ step: string; timebox_minutes?: number }>;
  retentionRisk?: string;
}): ReviewSummary {
  const { score, lpm, strengths, issues, revisionSteps, retentionRisk } = data;

  // Score context for professional tone
  const scoreContext = score >= 80 ? 'strong' : score >= 70 ? 'solid' : score >= 50 ? 'developing' : 'early-stage';
  const lpmContext = lpm >= 2.0
    ? 'maintains healthy joke frequency that keeps audiences engaged throughout'
    : lpm >= 1.5
      ? 'shows adequate pacing with room to tighten the comedic rhythm'
      : 'has stretches where the comedic density thins out';

  // Build praise paragraph (~170 words) - professional showrunner tone
  const topStrengths = strengths.slice(0, 3);
  const strengthsText = topStrengths.length > 0
    ? topStrengths.map((s, i) => {
        // Clean up the strength text and integrate naturally
        const cleaned = s.charAt(0).toUpperCase() + s.slice(1);
        if (i === 0) return cleaned;
        return cleaned.toLowerCase();
      }).join(', and ')
    : 'the foundational character work and situational framing';

  const praise = `This script demonstrates ${scoreContext} comedic instincts with a comedy score of ${score}, reflecting genuine understanding of timing and character-driven humor that positions this material well for further development. The LPM of ${lpm.toFixed(1)} ${lpmContext}, and when the jokes land, they land with conviction. What works here works because you've built a foundation that supports escalation rather than fighting against it—${strengthsText}. The dialogue has a naturalistic quality that sells the comedy without feeling overly constructed, and your character voices remain consistent throughout the piece. These structural strengths give you a solid platform to build from, and the comedic identity is clear enough that punch-up work will enhance rather than dilute what's already working. The setup-payoff mechanics are generally sound, and you're earning laughs through specificity rather than broad strokes.`;

  // Build constructive paragraph (~170 words) - identify single bottleneck
  const topIssue = issues[0];
  const retentionContext = retentionRisk === 'high'
    ? 'risks losing audience momentum at critical moments'
    : retentionRisk === 'medium'
      ? 'has some stretches where engagement could drift'
      : 'maintains reasonable audience attention';

  const issueText = topIssue
    ? topIssue.why_it_matters
    : 'the pacing between major comedic beats, where momentum tends to dissipate before building to clear peaks';

  const constructive = `The primary constraint limiting this script's ceiling is ${issueText}. This matters because comedy lives and dies on momentum—when audiences wait too long between payoffs, impatience erodes the goodwill your stronger moments have built. The retention risk assessment indicates the script ${retentionContext}, which directly impacts how the material will play in real-time. This isn't about adding more jokes indiscriminately; it's about compressing setups, finding the shortest path to each laugh, and ensuring every scene has a clear comedic destination rather than meandering toward one. The character balance suggests some ensemble members could carry more comedic weight, which would help distribute the pacing pressure and create more varied textures throughout. Tighten the beats that feel slack, push the escalation where it plateaus, and let your strongest moments land harder by clearing away what dilutes them.`;

  // Build next steps paragraph (~170 words) - no numbered lists, use prose with time estimates
  const step1 = revisionSteps[0];
  const step2 = revisionSteps[1];
  const fixTitle = topIssue?.concrete_fix?.title || 'the flagged pacing issues';

  const stepsText = step1 && step2
    ? `First, ${step1.step.toLowerCase()}${step1.timebox_minutes ? ` (~${step1.timebox_minutes} minutes)` : ' (~15 minutes)'}—this represents your quickest path to improvement and will have immediate impact on the overall score. Second, ${step2.step.toLowerCase()}${step2.timebox_minutes ? ` (~${step2.timebox_minutes} minutes)` : ' (~20 minutes)'}, which addresses the structural constraints without requiring wholesale revision.`
    : step1
      ? `Focus on ${step1.step.toLowerCase()}${step1.timebox_minutes ? ` (~${step1.timebox_minutes} minutes)` : ' (~15 minutes)'}—this represents your highest-leverage opportunity for improvement.`
      : `Revisit ${fixTitle} (~15 minutes) by cutting redundant setup lines that delay payoffs.`;

  const nextSteps = `Three specific moves will materially improve this script and push it toward production readiness. ${stepsText} Third, audit any stretch exceeding ten lines without a clear laugh or callback; compressing these gaps will immediately improve retention metrics (~20 minutes with fresh eyes). These targeted revisions address the script's main constraints without requiring a full rewrite. Budget approximately an hour total for this punch-up pass, focusing on tightening rather than adding. The goal is efficiency—step up what's already there, compress what's slack, and let your best material breathe without competition from weaker beats surrounding it.`;

  return { praise, constructive, nextSteps };
}
