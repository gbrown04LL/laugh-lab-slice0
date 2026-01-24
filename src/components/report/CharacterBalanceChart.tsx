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
      <h2 className="text-lg font-semibold text-gray-900 mb-4">🎭 Character Balance</h2>
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full" /> Balanced
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-amber-500 rounded-full" /> Underutilized
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-full" /> Severely
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
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
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
    </section>
  );
}
