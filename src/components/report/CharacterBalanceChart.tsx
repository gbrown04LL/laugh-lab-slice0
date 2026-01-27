'use client';

import React, { useMemo } from 'react';

export interface CharacterBalanceItem {
  name: string;
  joke_share: number;
  line_share: number;
  underutilized: boolean;
}

interface CharacterBalanceChartProps {
  characters: CharacterBalanceItem[];
}

export function CharacterBalanceChart({ characters }: CharacterBalanceChartProps) {
  const data = useMemo(() => {
    return (characters || [])
      .map((c) => ({
        name: c.name,
        joke_share: c.joke_share,
        joke_pct: Math.round(c.joke_share * 100),
        line_pct: Math.round(c.line_share * 100),
        status: c.underutilized
          ? c.joke_share < 0.08 ? 'severely' : 'underutilized'
          : 'balanced',
      }))
      .sort((a, b) => b.joke_share - a.joke_share);
  }, [characters]);

  if (!data.length) return null;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'balanced':
        return {
          bar: 'bg-emerald-500',
          badge: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-900/40',
          label: 'Balanced'
        };
      case 'underutilized':
        return {
          bar: 'bg-amber-500',
          badge: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-900/40',
          label: 'Underutilized'
        };
      case 'severely':
        return {
          bar: 'bg-rose-500',
          badge: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-900/20 dark:border-rose-900/40',
          label: 'Needs focus'
        };
      default:
        return {
          bar: 'bg-slate-500',
          badge: 'text-slate-700 bg-slate-50 border-slate-200 dark:text-slate-300 dark:bg-slate-800/40 dark:border-slate-700',
          label: 'Unknown'
        };
    }
  };

  const maxShare = Math.max(...data.map(d => d.joke_share), 0.4);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40">
          <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Character Balance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comedy distribution across characters
          </p>
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_80px_80px_100px] gap-3 mb-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        <div>Character</div>
        <div className="text-right">Jokes</div>
        <div className="text-right">Lines</div>
        <div className="text-right">Status</div>
      </div>

      {/* Character rows */}
      <div className="space-y-3">
        {data.map((char) => {
          const config = getStatusConfig(char.status);
          const barWidth = (char.joke_share / maxShare) * 100;

          return (
            <div
              key={char.name}
              className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/40"
            >
              <div className="grid grid-cols-[1fr_80px_80px_100px] gap-3 items-center mb-2">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-50">
                  {char.name}
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 text-right">
                  {char.joke_pct}%
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300 text-right">
                  {char.line_pct}%
                </div>
                <div className="flex justify-end">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${config.badge}`}>
                    {config.label}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden dark:bg-slate-700">
                <div
                  className={`h-full ${config.bar} rounded-full transition-all duration-500`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <span className="text-xs text-slate-500 dark:text-slate-400">Legend:</span>
        <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <span className="w-2 h-2 bg-emerald-500 rounded-full" />
          Balanced (even distribution)
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <span className="w-2 h-2 bg-amber-500 rounded-full" />
          Underutilized
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <span className="w-2 h-2 bg-rose-500 rounded-full" />
          Needs focus
        </span>
      </div>
    </section>
  );
}
