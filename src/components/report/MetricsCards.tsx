'use client';

import React from 'react';

type MetricStatus = 'strong' | 'steady' | 'developing';

interface MetricCardProps {
  label: string;
  value: string;
  suffix?: string;
  status: MetricStatus;
  description: string;
}

function MetricCard({ label, value, suffix, status, description }: MetricCardProps) {
  // Editorial plain-language status labels
  const statusConfig = {
    strong: {
      label: 'Strong',
      classes: 'text-stone-700 bg-stone-100 dark:text-stone-200 dark:bg-stone-800/60',
    },
    steady: {
      label: 'Tight',
      classes: 'text-stone-600 bg-stone-100 dark:text-stone-300 dark:bg-stone-800/40',
    },
    developing: {
      label: 'Slightly Uneven',
      classes: 'text-stone-500 bg-stone-100 dark:text-stone-400 dark:bg-stone-800/40',
    },
  };

  const { label: statusLabel, classes: statusClasses } = statusConfig[status];

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-widest text-stone-500 dark:text-stone-400">
          {label}
        </span>
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusClasses}`}>
          {statusLabel}
        </span>
      </div>

      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-light tracking-tight text-stone-800 dark:text-stone-100">
          {value}
        </span>
        {suffix && (
          <span className="text-sm text-stone-400 dark:text-stone-500">{suffix}</span>
        )}
      </div>

      <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

interface MetricsCardsProps {
  lpm: number;
  linesPerJoke: number;
  ensembleBalance: number;
}

export function MetricsCards({ lpm, linesPerJoke, ensembleBalance }: MetricsCardsProps) {
  // Calculate status for each metric using plain language
  const lpmStatus: MetricStatus = lpm >= 2.0 ? 'strong' : lpm >= 1.5 ? 'steady' : 'developing';
  const lpjStatus: MetricStatus = linesPerJoke <= 6 ? 'strong' : linesPerJoke <= 10 ? 'steady' : 'developing';
  const balancePercent = Math.round(ensembleBalance * 100);
  const balanceStatus: MetricStatus = ensembleBalance >= 0.8 ? 'strong' : ensembleBalance >= 0.6 ? 'steady' : 'developing';

  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-6 dark:border-stone-800 dark:bg-stone-900/40">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
        <MetricCard
          label="Laughs per Minute"
          value={lpm.toFixed(1)}
          status={lpmStatus}
          description="Consistency of laughs throughout"
        />
        <MetricCard
          label="Lines per Joke"
          value={linesPerJoke.toFixed(1)}
          status={lpjStatus}
          description="Comedy density and pacing"
        />
        <MetricCard
          label="Ensemble Balance"
          value={`${balancePercent}`}
          suffix="%"
          status={balanceStatus}
          description="Distribution of comic weight"
        />
      </div>
    </div>
  );
}
