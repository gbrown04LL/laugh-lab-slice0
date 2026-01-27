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
  percentile?: number;
  verdict?: string;
  benchmarks?: Benchmark[];
}

export function ScoreHero({
  score,
  percentile = 73,
  verdict = 'Strong comedy writing with room for targeted improvements.',
  benchmarks = []
}: ScoreHeroProps) {
  // SVG arc calculation for semi-circle gauge
  const radius = 70;
  const strokeWidth = 8;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;
  const dashOffset = circumference - progress;

  // Determine score color
  const getScoreColor = (s: number) => {
    if (s >= 70) return '#059669'; // emerald-600
    if (s >= 50) return '#d97706'; // amber-600
    return '#dc2626'; // red-600
  };

  const strokeColor = getScoreColor(score);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        {/* Left: Gauge */}
        <div className="flex flex-col items-center md:items-start">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Comedy Score
          </div>

          {/* SVG Gauge */}
          <div className="relative w-[160px] h-[90px]">
            <svg viewBox="0 0 160 90" className="w-full h-full">
              {/* Background arc */}
              <path
                d="M 10 80 A 70 70 0 0 1 150 80"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                className="dark:stroke-slate-700"
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
                <span className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  {score}
                </span>
                <span className="text-lg font-medium text-slate-400 dark:text-slate-500">/100</span>
              </div>
            </div>
          </div>

          {/* Percentile badge */}
          <div className="mt-3 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200">
            Better than {percentile}%
          </div>

          {/* Verdict */}
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 max-w-[200px] text-center md:text-left">
            {verdict}
          </p>
        </div>

        {/* Right: Benchmarks table */}
        {benchmarks.length > 0 && (
          <div className="flex-1 md:border-l md:border-slate-200 md:pl-6 md:dark:border-slate-700">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Benchmarks
            </div>
            <div className="space-y-3">
              {benchmarks.map((b, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-50">{b.label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Target: {b.target}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                      {b.value}
                    </span>
                    <StatusBadge status={b.status} />
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

function StatusBadge({ status }: { status: 'above' | 'on-target' | 'below' }) {
  const config = {
    above: {
      label: 'Above',
      classes: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-900/40',
    },
    'on-target': {
      label: 'On target',
      classes: 'text-slate-700 bg-slate-50 border-slate-200 dark:text-slate-200 dark:bg-slate-800/40 dark:border-slate-700',
    },
    below: {
      label: 'Below',
      classes: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-900/20 dark:border-rose-900/40',
    },
  };

  const { label, classes } = config[status];

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}

// Keep old export for backwards compatibility during migration
export function ScoreGauge(props: { score: number; percentile?: number }) {
  return <ScoreHero {...props} benchmarks={[]} />;
}
