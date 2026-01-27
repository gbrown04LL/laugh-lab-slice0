'use client';

import React from 'react';

type MetricStatus = 'above' | 'on-target' | 'below';

interface MetricCardProps {
  label: string;
  value: string;
  suffix?: string;
  status: MetricStatus;
  delta: string;
  note: string;
}

function MetricCard({ label, value, suffix, status, delta, note }: MetricCardProps) {
  const statusConfig = {
    above: {
      label: 'Above avg',
      classes: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-900/40',
    },
    'on-target': {
      label: 'On target',
      classes: 'text-slate-700 bg-slate-50 border-slate-200 dark:text-slate-200 dark:bg-slate-800/40 dark:border-slate-700',
    },
    below: {
      label: 'Below avg',
      classes: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-900/20 dark:border-rose-900/40',
    },
  };

  const { label: statusLabel, classes: statusClasses } = statusConfig[status];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</div>
        <div className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses}`}>
          {statusLabel}
        </div>
      </div>

      <div className="mt-3 flex items-end gap-2">
        <div className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">{value}</div>
        {suffix && <div className="pb-1 text-sm text-slate-500 dark:text-slate-400">{suffix}</div>}
      </div>

      <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{delta}</div>
      <div className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{note}</div>
    </div>
  );
}

interface MetricsCardsProps {
  lpm: number;
  linesPerJoke: number;
  ensembleBalance: number;
}

export function MetricsCards({ lpm, linesPerJoke, ensembleBalance }: MetricsCardsProps) {
  // Calculate status and delta for each metric
  const lpmStatus: MetricStatus = lpm >= 2.0 ? 'above' : lpm >= 1.5 ? 'on-target' : 'below';
  const lpmDelta = lpm >= 2.0 ? `+${(lpm - 2.0).toFixed(1)} vs sitcom avg 2.0` : `${(lpm - 2.0).toFixed(1)} vs sitcom avg 2.0`;

  const lpjStatus: MetricStatus = linesPerJoke <= 6 ? 'above' : linesPerJoke <= 10 ? 'on-target' : 'below';
  const lpjDelta = linesPerJoke <= 6 ? `${(6 - linesPerJoke).toFixed(1)} better than 6.0 target` : `+${(linesPerJoke - 6).toFixed(1)} vs target 6.0`;

  const balancePercent = Math.round(ensembleBalance * 100);
  const balanceStatus: MetricStatus = ensembleBalance >= 0.8 ? 'above' : ensembleBalance >= 0.6 ? 'on-target' : 'below';
  const balanceDelta = ensembleBalance >= 0.8 ? `+${balancePercent - 80}% vs 80% target` : `${balancePercent - 80}% vs 80% target`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <MetricCard
        label="Laughs Per Minute"
        value={lpm.toFixed(1)}
        status={lpmStatus}
        delta={lpmDelta}
        note="Measures joke frequency. Higher = more consistent laughs throughout the script."
      />
      <MetricCard
        label="Lines Per Joke"
        value={linesPerJoke.toFixed(1)}
        status={lpjStatus}
        delta={lpjDelta}
        note="Average lines between jokes. Lower = tighter pacing and better comedy density."
      />
      <MetricCard
        label="Ensemble Balance"
        value={`${balancePercent}`}
        suffix="%"
        status={balanceStatus}
        delta={balanceDelta}
        note="How evenly comedy is distributed across characters. 80%+ indicates strong ensemble writing."
      />
    </div>
  );
}
