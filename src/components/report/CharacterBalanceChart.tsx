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
          bar: 'bg-zinc-600',
          badge: 'text-zinc-300 bg-zinc-900 border-zinc-700',
          label: 'Balanced'
        };
      case 'underutilized':
        return {
          bar: 'bg-zinc-500',
          badge: 'text-zinc-300 bg-zinc-800 border-zinc-700',
          label: 'Underutilized'
        };
      case 'severely':
        return {
          bar: 'bg-zinc-400',
          badge: 'text-zinc-200 bg-zinc-800 border-zinc-600',
          label: 'Needs focus'
        };
      default:
        return {
          bar: 'bg-zinc-700',
          badge: 'text-zinc-400 bg-zinc-900 border-zinc-700',
          label: 'Unknown'
        };
    }
  };

  const maxShare = Math.max(...data.map(d => d.joke_share), 0.4);

  return (
    <div className="space-y-4">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_80px_80px_100px] gap-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
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
              className="rounded border border-zinc-800 bg-zinc-900/50 p-3"
            >
              <div className="grid grid-cols-[1fr_80px_80px_100px] gap-3 items-center mb-2">
                <div className="text-sm font-medium text-zinc-200">
                  {char.name}
                </div>
                <div className="text-sm font-semibold text-zinc-100 text-right">
                  {char.joke_pct}%
                </div>
                <div className="text-sm text-zinc-400 text-right">
                  {char.line_pct}%
                </div>
                <div className="flex justify-end">
                  <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${config.badge}`}>
                    {config.label}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${config.bar} rounded-full transition-all duration-500`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
