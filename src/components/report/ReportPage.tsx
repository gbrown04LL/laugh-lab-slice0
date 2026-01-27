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

  // Use Evidence-Lock summary if available, otherwise generate from existing data
  const summary = useMemo(() => {
    const evidenceLockSummary: string | undefined =
      typeof output?.evidence_lock?.summary === 'string' ? output.evidence_lock.summary : undefined;
    
    if (evidenceLockSummary) {
      // Split Evidence-Lock summary into 3 paragraphs
      const paragraphs = evidenceLockSummary.split('\n\n').filter((p) => p.trim().length > 0);
      return {
        praise: paragraphs[0] || '',
        constructive: paragraphs[1] || '',
        nextSteps: paragraphs[2] || '',
      };
    }
    
    // Fallback to legacy summary generation
    return generateSummaryFromData({
      score: overallScore,
      lpm,
      strengths,
      issues: opportunities,
      revisionSteps,
      retentionRisk,
    });
  }, [output, overallScore, lpm, strengths, opportunities, revisionSteps, retentionRisk]);

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
    <main className="min-h-screen bg-zinc-950">
      {/* Editorial Header */}
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light tracking-tight text-zinc-100 mb-1">
                {scriptTitle || 'Untitled Script'}
              </h1>
              <p className="text-sm text-zinc-500">Script Coverage Report</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.print()}
                className="text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
              >
                Print
              </button>
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
              >
                {showRaw ? 'Hide' : 'View'} Data
              </button>
              <a
                href="/"
                className="px-4 py-2 bg-zinc-800 text-zinc-300 text-sm font-medium rounded hover:bg-zinc-700 transition-colors"
              >
                New Analysis
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content: Sidebar + Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12">
          {/* Left Sidebar: Metrics */}
          <aside className="space-y-6">
            <div>
              <h2 className="text-xs uppercase tracking-wider text-zinc-500 mb-4">Metrics</h2>
              <div className="space-y-4">
                {/* Score */}
                <div className="pb-4 border-b border-zinc-800">
                  <div className="text-xs text-zinc-500 mb-1">Comedy Score</div>
                  <div className="text-3xl font-light text-zinc-100">{overallScore}</div>
                  <div className="text-xs text-zinc-600 mt-1">out of 100</div>
                </div>

                {/* LPM */}
                {lpm > 0 && (
                  <div className="pb-4 border-b border-zinc-800">
                    <div className="text-xs text-zinc-500 mb-1">Laughs Per Minute</div>
                    <div className="text-2xl font-light text-zinc-100">{lpm.toFixed(1)}</div>
                    <div className="text-xs text-zinc-600 mt-1">target: 2.0+</div>
                  </div>
                )}

                {/* Lines Per Joke */}
                {linesPerJoke > 0 && (
                  <div className="pb-4 border-b border-zinc-800">
                    <div className="text-xs text-zinc-500 mb-1">Lines Per Joke</div>
                    <div className="text-2xl font-light text-zinc-100">{linesPerJoke.toFixed(1)}</div>
                    <div className="text-xs text-zinc-600 mt-1">target: ≤6</div>
                  </div>
                )}

                {/* Ensemble Balance */}
                {ensembleBalance > 0 && (
                  <div className="pb-4 border-b border-zinc-800">
                    <div className="text-xs text-zinc-500 mb-1">Ensemble Balance</div>
                    <div className="text-2xl font-light text-zinc-100">{Math.round(ensembleBalance * 100)}%</div>
                    <div className="text-xs text-zinc-600 mt-1">target: 80%+</div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="space-y-12">
            {/* Coverage Summary - Hero Section */}
            <section>
              <h2 className="text-xs uppercase tracking-wider text-zinc-500 mb-6">Executive Summary</h2>
              <div className="space-y-6 text-base leading-relaxed text-zinc-300">
                <p>{summary.praise}</p>
                <p>{summary.constructive}</p>
                <p>{summary.nextSteps}</p>
              </div>
            </section>

            {/* Divider */}
            <div className="border-t border-zinc-800"></div>

            {/* Strengths and Opportunities */}
            <section>
              <h2 className="text-xs uppercase tracking-wider text-zinc-500 mb-6">Analysis</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-4">Strengths</h3>
                  <StrengthsSection strengths={strengths} peakMoments={peakMoments} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-4">Opportunities</h3>
                  <OpportunitiesSection opportunities={opportunities} />
                </div>
              </div>
            </section>

            {/* Character Balance */}
            {characters.length > 0 && (
              <>
                <div className="border-t border-zinc-800"></div>
                <section>
                  <h2 className="text-xs uppercase tracking-wider text-zinc-500 mb-6">Character Balance</h2>
                  <CharacterBalanceChart characters={characters} />
                </section>
              </>
            )}

            {/* Punch-Up Workshop */}
            {punchUps.length > 0 && (
              <>
                <div className="border-t border-zinc-800"></div>
                <section>
                  <h2 className="text-xs uppercase tracking-wider text-zinc-500 mb-6">Punch-Up Workshop</h2>
                  <PunchUpWorkshop moments={punchUps} />
                </section>
              </>
            )}

            {/* Priority Fix Plan */}
            {revisionSteps.length > 0 && (
              <>
                <div className="border-t border-zinc-800"></div>
                <section>
                  <h2 className="text-xs uppercase tracking-wider text-zinc-500 mb-6">Revision Plan</h2>
                  <PriorityFixPlan steps={revisionSteps} />
                </section>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Raw JSON (collapsible) */}
      {showRaw && (
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <div className="border border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800">
              <p className="text-xs font-medium text-zinc-400">Raw JSON Response</p>
            </div>
            <pre className="bg-zinc-950 text-zinc-400 text-xs p-6 overflow-auto max-h-96 font-mono">
              {rawJson || 'No data'}
            </pre>
          </div>
        </div>
      )}
    </main>
  );
}
