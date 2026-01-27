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

  // Use Evidence-Lock summary if available, otherwise generate from existing data
  const summary = useMemo(() => {
    const evidenceLockSummary = output?.evidence_lock?.summary;
    
    if (evidenceLockSummary) {
      // Split Evidence-Lock summary into 3 paragraphs
      const paragraphs = evidenceLockSummary.split('\n\n').filter(p => p.trim().length > 0);
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
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AnalysisProgress isAnalyzing={isAnalyzing} stage={stage} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-indigo-200 bg-indigo-50 flex items-center justify-center dark:border-indigo-900/40 dark:bg-indigo-900/20">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {scriptTitle || 'Analysis Report'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Comedy script analysis</p>
            </div>
          </div>
        </div>

        {/* Coverage Summary - 3 paragraphs at top */}
        <div className="mb-6">
          <CoverageSummary summary={summary} />
        </div>

        {/* Score Hero with Benchmarks */}
        <div className="mb-6">
          <ScoreHero
            score={overallScore}
            percentile={73}
            verdict={verdict}
            benchmarks={benchmarks}
          />
        </div>

        {/* Metrics Cards */}
        <div className="mb-8">
          <MetricsCards lpm={lpm} linesPerJoke={linesPerJoke} ensembleBalance={ensembleBalance} />
        </div>

        {/* Two-column layout for Strengths and Opportunities */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <StrengthsSection strengths={strengths} peakMoments={peakMoments} />
          <OpportunitiesSection opportunities={opportunities} />
        </div>

        {/* Character Balance */}
        {characters.length > 0 && (
          <div className="mb-8">
            <CharacterBalanceChart characters={characters} />
          </div>
        )}

        {/* Punch-Up Workshop */}
        {punchUps.length > 0 && (
          <div className="mb-8">
            <PunchUpWorkshop moments={punchUps} />
          </div>
        )}

        {/* Priority Fix Plan */}
        {revisionSteps.length > 0 && (
          <div className="mb-8">
            <PriorityFixPlan steps={revisionSteps} />
          </div>
        )}

        {/* Actions */}
        <section className="mb-8">
          <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">Next Steps</h3>
            <div className="flex flex-wrap gap-3">
              <a
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Analyze Another Script
              </a>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Report
              </button>
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                {showRaw ? 'Hide' : 'View'} JSON
              </button>
            </div>
          </div>
        </section>

        {/* Raw JSON (collapsible) */}
        {showRaw && (
          <section className="mb-8">
            <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
              <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Raw JSON Response</p>
              </div>
              <pre className="bg-slate-900 text-slate-100 text-xs p-4 overflow-auto max-h-80">
                {rawJson || 'No data'}
              </pre>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
