'use client';

import React from 'react';

interface Benchmark {
  label: string;
  value: string;
  target: string;
  status: 'above' | 'on-target' | 'below';
}

interface ScoreHeroProps {
  score: number;
  verdict?: string;
  benchmarks?: Benchmark[];
}

// Generate industry-comparable subtext based on score
function getIndustryContext(score: number): string {
  if (score >= 85) return 'Comparable to top-tier produced comedy';
  if (score >= 75) return 'Comparable to produced half-hour sitcoms';
  if (score >= 65) return 'Solid draft with clear comedic voice';
  if (score >= 50) return 'Promising foundation for development';
  return 'Early-stage material with potential';
}

export function ScoreHero({
  score,
  verdict = 'Strong comedy writing with room for targeted improvements.',
  benchmarks = []
}: ScoreHeroProps) {
  // SVG arc calculation for semi-circle gauge
  const radius = 70;
  const strokeWidth = 8;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;
  const dashOffset = circumference - progress;

  // Muted editorial color palette
  const getScoreColor = (s: number) => {
    if (s >= 70) return '#4b5563'; // gray-600 (muted success)
    if (s >= 50) return '#6b7280'; // gray-500 (neutral)
    return '#9ca3af'; // gray-400 (needs attention)
  };

  const strokeColor = getScoreColor(score);
  const industryContext = getIndustryContext(score);

  return (
    <section className="rounded-2xl border border-stone-200 bg-stone-50/80 p-8 dark:border-stone-800 dark:bg-stone-900/40">
      <div className="flex flex-col md:flex-row md:items-start gap-8">
        {/* Left: Gauge */}
        <div className="flex flex-col items-center md:items-start">
          <div className="text-xs font-medium uppercase tracking-widest text-stone-500 dark:text-stone-400 mb-4">
            Comedy Effectiveness
          </div>

          {/* SVG Gauge */}
          <div className="relative w-[160px] h-[90px]">
            <svg viewBox="0 0 160 90" className="w-full h-full">
              {/* Background arc */}
              <path
                d="M 10 80 A 70 70 0 0 1 150 80"
                fill="none"
                stroke="#d6d3d1"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                className="dark:stroke-stone-700"
              />
              {/* Progress arc */}
              <path
                d="M 10 80 A 70 70 0 0 1 150 80"
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Score number overlay */}
            <div className="absolute inset-0 flex items-end justify-center pb-1">
              <div className="text-center">
                <span className="text-4xl font-light tracking-tight text-stone-800 dark:text-stone-100">
                  {score}
                </span>
                <span className="text-lg font-light text-stone-400 dark:text-stone-500">/100</span>
              </div>
            </div>
          </div>

          {/* Industry context subtext - replaces percentile */}
          <p className="mt-4 text-sm text-stone-600 dark:text-stone-300 max-w-[220px] text-center md:text-left leading-relaxed">
            {industryContext}
          </p>
        </div>

        {/* Right: Benchmarks table */}
        {benchmarks.length > 0 && (
          <div className="flex-1 md:border-l md:border-stone-200 md:pl-8 md:dark:border-stone-700">
            <div className="text-xs font-medium uppercase tracking-widest text-stone-500 dark:text-stone-400 mb-4">
              Key Metrics
            </div>
            <div className="space-y-4">
              {benchmarks.map((b, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-stone-800 dark:text-stone-100">{b.label}</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">Target: {b.target}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-light tracking-tight text-stone-800 dark:text-stone-100">
                      {b.value}
                    </span>
                    <StatusLabel status={b.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function StatusLabel({ status }: { status: 'above' | 'on-target' | 'below' }) {
  // Plain language status labels with muted editorial colors
  const config = {
    above: {
      label: 'Strong',
      classes: 'text-stone-700 bg-stone-100 dark:text-stone-200 dark:bg-stone-800/60',
    },
    'on-target': {
      label: 'Steady',
      classes: 'text-stone-600 bg-stone-100 dark:text-stone-300 dark:bg-stone-800/40',
    },
    below: {
      label: 'Developing',
      classes: 'text-stone-500 bg-stone-100 dark:text-stone-400 dark:bg-stone-800/40',
    },
  };

  const { label, classes } = config[status];

  return (
    <span className={`rounded px-2.5 py-1 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}

// Keep old export for backwards compatibility during migration
export function ScoreGauge(props: { score: number }) {
  return <ScoreHero {...props} benchmarks={[]} />;
}
