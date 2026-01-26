'use client';

import React from 'react';
import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
  Cell,
} from 'recharts';

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
        fill: c.underutilized
          ? c.joke_share < 0.08 ? '#ef4444' : '#f59e0b'
          : '#22c55e',
      }))
      .sort((a, b) => b.joke_share - a.joke_share);
  }, [characters]);

  if (!data.length) return null;

  const chartHeight = Math.max(200, data.length * 50);

  return (
    <section className="mt-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg shadow-indigo-500/25">
          <span className="text-white text-sm">☰</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Character Balance</h2>
      </div>
      <div className="relative rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50/80 to-slate-50/60 border border-blue-200/50 p-6 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.15)] overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-200/30 to-transparent rounded-bl-full" />
        <div className="relative bg-white/70 backdrop-blur-sm border border-white/80 rounded-xl p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
          <div className="flex flex-wrap items-center gap-4 mb-4 text-xs">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 font-medium px-3 py-1.5 rounded-full border border-emerald-200/50">
              <span className="w-2.5 h-2.5 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full shadow-sm" /> Balanced
            </span>
            <span className="flex items-center gap-2 bg-amber-50 text-amber-700 font-medium px-3 py-1.5 rounded-full border border-amber-200/50">
              <span className="w-2.5 h-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-sm" /> Underutilized
            </span>
            <span className="flex items-center gap-2 bg-red-50 text-red-700 font-medium px-3 py-1.5 rounded-full border border-red-200/50">
              <span className="w-2.5 h-2.5 bg-gradient-to-br from-red-400 to-rose-500 rounded-full shadow-sm" /> Severely
            </span>
          </div>

          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
              >
                <XAxis type="number" domain={[0, 0.5]} hide />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12, fontWeight: 500 }} />
                <Bar dataKey="joke_share" radius={[0, 8, 8, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                  <LabelList
                    dataKey="joke_pct"
                    position="right"
                    formatter={(v: any) => `${v}%`}
                    style={{ fontSize: 12, fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
