'use client';

import React from 'react';
import { useState, useMemo } from 'react';
import { ScoreHero } from './ScoreGauge';
import { MetricsCards } from './MetricsCards';
import { CoverageSummary, generateSummaryFromData } from './CoverageSummary';
import { StrengthsSection } from './StrengthsSection';
import { OpportunitiesSection, OpportunityItem } from './OpportunitiesSection';
import { PunchUpWorkshop, PunchUpMoment } from './PunchUpWorkshop';
import { CharacterBalanceChart, CharacterBalanceItem } from './CharacterBalanceChart';
import { PriorityFixPlan, RevisionStep } from './PriorityFixPlan';
import { AnalysisProgress } from './AnalysisProgress';

interface ReportPageProps {
  data?: any;
  scriptTitle?: string;
  isAnalyzing?: boolean;
  stage?: number;
}

export default function ReportPage({ data, scriptTitle, isAnalyzing = false, stage }: ReportPageProps) {
  const [showRaw, setShowRaw] = useState(false);

  const output = data?.output;

  // Map data to component props
  const overallScore = output?.prompt_a?.metrics?.overall_score ?? 0;
  const lpm = output?.prompt_a?.metrics?.lpm_intermediate_plus ?? 0;
  const linesPerJoke = output?.prompt_a?.metrics?.lines_per_joke ?? 0;
  const ensembleBalance = output?.prompt_a?.metrics?.character_balance?.ensemble_balance ?? 0;
  const retentionRisk = output?.prompt_a?.metrics?.retention_risk?.overall_risk;
  const peakMoments = output?.prompt_a?.metrics?.peak_moments ?? [];

  const strengths: string[] = output?.prompt_b?.sections?.strengths_to_preserve ?? [];

  // Map opportunities with location and tags from issue_candidates
  const issueCandidates = output?.prompt_a?.issue_candidates ?? [];
  const rawOpportunities = output?.prompt_b?.sections?.whats_getting_in_the_way ?? [];

  const opportunities: OpportunityItem[] = rawOpportunities.map((o: any) => {
    const candidate = issueCandidates.find((c: any) => c.issue_id === o.issue_id);
    return {
      issue_id: o.issue_id,
      why_it_matters: o.why_it_matters,
      location: candidate?.location,
      tags: candidate?.tags,
      severity: candidate?.severity,
      concrete_fix: o.concrete_fix,
    };
  });

  const punchUps: PunchUpMoment[] = (output?.prompt_b?.sections?.punch_up_suggestions ?? []).map((m: any) => ({
    moment_id: m.moment_id,
    moment_context: m.moment_context,
    options: m.options,
  }));

  const characters: CharacterBalanceItem[] = (output?.prompt_a?.metrics?.character_balance?.characters ?? []).map((c: any) => ({
    name: c.name,
    joke_share: c.joke_share,
    line_share: c.line_share,
    underutilized: c.underutilized,
  }));

  const revisionSteps: RevisionStep[] = output?.prompt_b?.sections?.how_to_revise_this_efficiently?.revision_plan?.steps ?? [];

  // Generate summary from existing data
  const summary = useMemo(() => generateSummaryFromData({
    score: overallScore,
    lpm,
    strengths,
    issues: opportunities,
    revisionSteps,
    retentionRisk,
  }), [overallScore, lpm, strengths, opportunities, revisionSteps, retentionRisk]);

  // Build benchmarks for ScoreHero
  type BenchmarkStatus = 'above' | 'on-target' | 'below';
  const benchmarks = useMemo(() => {
    const items: Array<{ label: string; value: string; target: string; status: BenchmarkStatus }> = [];

    if (lpm > 0) {
      const status: BenchmarkStatus = lpm >= 2.0 ? 'above' : lpm >= 1.5 ? 'on-target' : 'below';
      items.push({
        label: 'Laughs/Min',
        value: lpm.toFixed(1),
        target: '2.0+',
        status,
      });
    }

    if (linesPerJoke > 0) {
      const status: BenchmarkStatus = linesPerJoke <= 6 ? 'above' : linesPerJoke <= 10 ? 'on-target' : 'below';
      items.push({
        label: 'Lines/Joke',
        value: linesPerJoke.toFixed(1),
        target: '≤6',
        status,
      });
    }

    if (ensembleBalance > 0) {
      const status: BenchmarkStatus = ensembleBalance >= 0.8 ? 'above' : ensembleBalance >= 0.6 ? 'on-target' : 'below';
      items.push({
        label: 'Ensemble',
        value: `${Math.round(ensembleBalance * 100)}%`,
        target: '80%+',
        status,
      });
    }

    return items;
  }, [lpm, linesPerJoke, ensembleBalance]);

  const rawJson = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return '';
    }
  }, [data]);

  // Generate verdict based on score
  const verdict = overallScore >= 80
    ? 'Excellent comedy writing with minor polish needed.'
    : overallScore >= 70
      ? 'Strong script with good comedy potential.'
      : overallScore >= 50
        ? 'Solid foundation with clear opportunities.'
        : 'Several areas need attention.';

  return (
    <main className="min-h-screen bg-stone-100 dark:bg-stone-950">
      <AnalysisProgress isAnalyzing={isAnalyzing} stage={stage} />

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header - editorial style */}
        <header className="mb-10">
          <h1 className="text-2xl font-light tracking-tight text-stone-800 dark:text-stone-100">
            {scriptTitle || 'Script Analysis'}
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Professional comedy coverage
          </p>
        </header>

        {/* SECTION 1: Dashboard - Score + Core Metrics */}
        <div className="mb-8">
          <ScoreHero
            score={overallScore}
            verdict={verdict}
            benchmarks={benchmarks}
          />
        </div>

        <div className="mb-12">
          <MetricsCards lpm={lpm} linesPerJoke={linesPerJoke} ensembleBalance={ensembleBalance} />
        </div>

        {/* SECTION 2: Coach's Notes - 3-paragraph breakdown */}
        <div className="mb-14">
          <CoverageSummary summary={summary} />
        </div>

        {/* SECTION 3: Supporting Analysis */}
        <div className="space-y-10">
          {/* Two-column layout for Strengths and Opportunities */}
          <div className="grid md:grid-cols-2 gap-8">
            <StrengthsSection strengths={strengths} peakMoments={peakMoments} />
            <OpportunitiesSection opportunities={opportunities} />
          </div>

          {/* Character Balance */}
          {characters.length > 0 && (
            <CharacterBalanceChart characters={characters} />
          )}

          {/* Punch-Up Workshop */}
          {punchUps.length > 0 && (
            <PunchUpWorkshop moments={punchUps} />
          )}

          {/* Suggested Rewrite Path */}
          {revisionSteps.length > 0 && (
            <PriorityFixPlan steps={revisionSteps} />
          )}
        </div>

        {/* Actions - minimal, editorial */}
        <div className="mt-12 pt-8 border-t border-stone-200 dark:border-stone-800">
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-stone-800 text-stone-100 text-sm font-medium rounded-lg hover:bg-stone-700 transition-colors dark:bg-stone-200 dark:text-stone-900 dark:hover:bg-stone-300"
            >
              Analyze Another Script
            </a>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 text-stone-600 text-sm font-medium rounded-lg border border-stone-300 hover:bg-stone-50 transition-colors dark:text-stone-300 dark:border-stone-700 dark:hover:bg-stone-800"
            >
              Print
            </button>
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="text-sm text-stone-500 hover:text-stone-700 transition-colors dark:text-stone-400 dark:hover:text-stone-200"
            >
              {showRaw ? 'Hide JSON' : 'View JSON'}
            </button>
          </div>
        </div>

        {/* Raw JSON (collapsible) */}
        {showRaw && (
          <div className="mt-6">
            <div className="rounded-lg border border-stone-200 overflow-hidden dark:border-stone-800">
              <pre className="bg-stone-900 text-stone-300 text-xs p-4 overflow-auto max-h-80">
                {rawJson || 'No data'}
              </pre>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
