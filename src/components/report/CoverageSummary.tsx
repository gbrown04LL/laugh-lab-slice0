'use client';

import React from 'react';

export interface ReviewSummary {
  bigPicture: string;
  limitation: string;
  guidance: string;
}

interface CoverageSummaryProps {
  summary: ReviewSummary;
}

export function CoverageSummary({ summary }: CoverageSummaryProps) {
  return (
    <section className="py-2">
      {/* Section title - editorial style */}
      <h2 className="text-xs font-medium uppercase tracking-widest text-stone-500 dark:text-stone-400 mb-6">
        Coach's Notes
      </h2>

      {/* Three paragraphs - full width, generous spacing, no cards/borders */}
      <div className="space-y-6 text-[16px] leading-[1.8] text-stone-700 dark:text-stone-200">
        <p className="max-w-prose">
          {summary.bigPicture}
        </p>
        <p className="max-w-prose">
          {summary.limitation}
        </p>
        <p className="max-w-prose">
          {summary.guidance}
        </p>
      </div>
    </section>
  );
}

// Helper to generate summary from existing API data
// Paragraph structure follows professional coverage format:
// 1. Big Picture Strength - what kind of show, how comedy engine works
// 2. Primary Limitation - ONE main issue with cause → effect → audience impact
// 3. Rewrite Guidance - clear mental model, what to tackle first vs later
export function generateSummaryFromData(data: {
  score: number;
  lpm: number;
  strengths: string[];
  issues: Array<{ why_it_matters: string; concrete_fix?: { title: string } }>;
  revisionSteps: Array<{ step: string; timebox_minutes?: number }>;
  retentionRisk?: string;
}): ReviewSummary {
  const { score, lpm, strengths, issues, revisionSteps } = data;

  // Paragraph 1: Big Picture Strength
  // What kind of show this feels like, how the comedy engine works
  const showType = score >= 75
    ? 'a polished half-hour comedy'
    : score >= 60
      ? 'an ensemble comedy with a clear voice'
      : 'a developing comedy with distinct moments';

  const engineDescription = lpm >= 2.0
    ? 'The comedy engine is running well, delivering consistent laughs throughout each scene.'
    : lpm >= 1.5
      ? 'The pacing has a natural rhythm, with room to tighten the joke frequency in key moments.'
      : 'The comedic throughline is present but could benefit from more frequent payoffs.';

  const topStrength = strengths[0] || 'The script shows comedic instincts worth preserving.';

  const bigPicture = `This reads like ${showType}. ${engineDescription} ${topStrength}`;

  // Paragraph 2: Primary Limitation
  // ONE main issue only, with cause → effect → audience impact
  const topIssue = issues[0];
  let limitation: string;

  if (topIssue) {
    const issueCore = topIssue.why_it_matters;
    const fix = topIssue.concrete_fix?.title || '';
    limitation = `The primary area to address: ${issueCore}${fix ? ` The fix is straightforward: ${fix.toLowerCase()}.` : ''} Addressing this will strengthen the overall comedic impact and keep the audience engaged through the slower stretches.`;
  } else {
    limitation = 'No major structural issues stand out. The focus now should be on polish and punch-up work, refining individual lines rather than rethinking the comedic architecture.';
  }

  // Paragraph 3: Rewrite Guidance
  // Clear mental model for revision, what to tackle first vs later, calm direction
  const steps = revisionSteps.slice(0, 2);
  let guidance: string;

  if (steps.length >= 2) {
    guidance = `For the rewrite, start with ${steps[0].step.toLowerCase()}. Once that pass is complete, move to ${steps[1].step.toLowerCase()}. This two-pass approach will yield the clearest improvements without overworking the material.`;
  } else if (steps.length === 1) {
    guidance = `For the rewrite, focus first on ${steps[0].step.toLowerCase()}. This single pass should address the most pressing concerns while preserving what already works.`;
  } else {
    guidance = 'For the rewrite, work through the punch-up suggestions first, then return to examine pacing in scenes where the energy dips. Trust your instincts on the material and resist the urge to overhaul what is already landing.';
  }

  return { bigPicture, limitation, guidance };
}
