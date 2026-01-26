'use client';

import React from 'react';
import { useState, useMemo } from 'react';
import { ScoreGauge } from './ScoreGauge';
import { MetricsCards } from './MetricsCards';
import { ExecutiveSummary } from './ExecutiveSummary';
import { StrengthsSection } from './StrengthsSection';
import { OpportunitiesSection, OpportunityItem } from './OpportunitiesSection';
import { PunchUpWorkshop, PunchUpMoment } from './PunchUpWorkshop';
import { CharacterBalanceChart, CharacterBalanceItem } from './CharacterBalanceChart';
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

  const strengths: string[] = output?.prompt_b?.sections?.strengths_to_preserve ?? [];

  const opportunities: OpportunityItem[] = (output?.prompt_b?.sections?.whats_getting_in_the_way ?? []).map((o: any) => ({
    issue_id: o.issue_id,
    why_it_matters: o.why_it_matters,
    concrete_fix: o.concrete_fix,
  }));

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

  const rawJson = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return '';
    }
  }, [data]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <AnalysisProgress isAnalyzing={isAnalyzing} stage={stage} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {scriptTitle || 'Analysis Report'}
              </h1>
              <p className="text-sm text-gray-500">Comedy script analysis results</p>
            </div>
          </div>
        </div>

        {/* Top Section: Score + Summary side by side */}
        <div className="grid md:grid-cols-[280px_1fr] gap-6 mb-6">
          {/* Score Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <ScoreGauge score={overallScore} />
          </div>

          {/* Summary + Quick Stats */}
          <div className="flex flex-col gap-4">
            <ExecutiveSummary
              score={overallScore}
              strengthsCount={strengths.length}
              opportunitiesCount={opportunities.length}
              punchUpsCount={punchUps.length}
            />
            <MetricsCards lpm={lpm} linesPerJoke={linesPerJoke} ensembleBalance={ensembleBalance} />
          </div>
        </div>

        {/* Feedback Sections */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <StrengthsSection strengths={strengths} />
            <CharacterBalanceChart characters={characters} />
          </div>
          <div className="space-y-6">
            <OpportunitiesSection opportunities={opportunities} />
            <PunchUpWorkshop moments={punchUps} />
          </div>
        </div>

        {/* Quick Actions */}
        <section className="mt-8">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/60 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Next Steps</h3>
            <div className="flex flex-wrap gap-3">
              <a
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Analyze Another Script
              </a>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Report
              </button>
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                {showRaw ? 'Hide' : 'View'} JSON Data
              </button>
            </div>
          </div>
        </section>

        {/* Raw JSON (collapsible) */}
        {showRaw && (
          <section className="mt-4">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-3 bg-gray-50 border-b border-gray-200">
                <p className="text-xs font-medium text-gray-600">Raw JSON Response</p>
              </div>
              <pre className="bg-gray-900 text-gray-100 text-xs p-4 overflow-auto max-h-80">
                {rawJson || 'No data'}
              </pre>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
