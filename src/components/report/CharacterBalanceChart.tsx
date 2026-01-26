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
        status: c.underutilized
          ? c.joke_share < 0.08 ? 'severely' : 'underutilized'
          : 'balanced',
      }))
      .sort((a, b) => b.joke_share - a.joke_share);
  }, [characters]);

  if (!data.length) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'balanced': return { bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' };
      case 'underutilized': return { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' };
      case 'severely': return { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' };
      default: return { bar: 'bg-gray-500', text: 'text-gray-700', bg: 'bg-gray-50' };
    }
  };

  const maxShare = Math.max(...data.map(d => d.joke_share), 0.4);

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 shadow-sm">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900">Character Balance</h2>
        <span className="ml-auto text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{data.length}</span>
      </div>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/60 rounded-xl p-4">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mb-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-gray-600">Balanced</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-amber-500 rounded-full" />
            <span className="text-gray-600">Underutilized</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-gray-600">Severely</span>
          </span>
        </div>

        {/* Character bars */}
        <div className="space-y-2">
          {data.map((char) => {
            const colors = getStatusColor(char.status);
            const barWidth = (char.joke_share / maxShare) * 100;
            return (
              <div key={char.name} className="bg-white/80 border border-blue-100 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-900">{char.name}</span>
                  <span className={`text-xs font-semibold ${colors.text}`}>{char.joke_pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
