'use client';

import React from 'react';
import { useState, useMemo } from 'react';
import { ScoreGauge } from './ScoreGauge';
import { MetricsCards } from './MetricsCards';
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

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            {scriptTitle || 'Analysis Report'}
          </h1>
          <div className="mt-2 h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
        </div>

        {/* Score + Metrics */}
        <div className="grid gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1),0_8px_40px_-8px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.15),0_16px_50px_-8px_rgba(0,0,0,0.08)] transition-all duration-300">
            <ScoreGauge score={overallScore} />
          </div>
          <MetricsCards lpm={lpm} linesPerJoke={linesPerJoke} ensembleBalance={ensembleBalance} />
        </div>

        {/* Feedback Sections */}
        <StrengthsSection strengths={strengths} />
        <OpportunitiesSection opportunities={opportunities} />
        <PunchUpWorkshop moments={punchUps} />
        <CharacterBalanceChart characters={characters} />

        {/* Raw JSON */}
        <section className="mt-10">
          <div className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] overflow-hidden hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] transition-all duration-300">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="w-full p-5 text-left flex justify-between items-center group"
            >
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">View Full JSON Report</p>
                <p className="text-sm text-gray-500">Debug payload from the analysis pipeline</p>
              </div>
              <span className="text-xs text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 font-medium group-hover:bg-gray-200 transition-colors">
                {showRaw ? 'Hide' : 'Show'}
              </span>
            </button>
            {showRaw && (
              <div className="border-t border-gray-200/50 p-5 bg-gradient-to-b from-gray-50/50 to-transparent">
                <pre className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 text-xs p-5 rounded-xl overflow-auto max-h-96 shadow-inner">
                  {rawJson || 'No data'}
                </pre>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
