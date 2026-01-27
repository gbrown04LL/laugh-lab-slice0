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

// Generate editorial coach note for each character
function getCoachNote(char: { name: string; joke_share: number; underutilized: boolean; joke_pct: number }): string {
  if (char.underutilized && char.joke_share < 0.08) {
    return `Could carry more comedic weight. Consider giving ${char.name} a running bit or a signature comic perspective.`;
  }
  if (char.underutilized) {
    return `Has room to contribute more. Look for moments where ${char.name} could land the laugh instead of playing straight.`;
  }
  if (char.joke_pct >= 30) {
    return `Carrying the comedy load effectively. Make sure other characters have room to breathe comedically.`;
  }
  return `Contributing well to the ensemble. The balance feels natural for this character's role.`;
}

export function CharacterBalanceChart({ characters }: CharacterBalanceChartProps) {
  const data = useMemo(() => {
    return (characters || [])
      .map((c) => ({
        name: c.name,
        joke_share: c.joke_share,
        joke_pct: Math.round(c.joke_share * 100),
        line_pct: Math.round(c.line_share * 100),
        underutilized: c.underutilized,
      }))
      .sort((a, b) => b.joke_share - a.joke_share);
  }, [characters]);

  if (!data.length) return null;

  return (
    <section className="rounded-2xl border border-stone-200 bg-stone-50/80 p-6 dark:border-stone-800 dark:bg-stone-900/40">
      {/* Header - editorial style */}
      <h2 className="text-xs font-medium uppercase tracking-widest text-stone-500 dark:text-stone-400 mb-6">
        Character Balance
      </h2>

      {/* Character list - editorial presentation */}
      <div className="space-y-5">
        {data.map((char) => {
          const coachNote = getCoachNote(char);

          return (
            <div key={char.name} className="border-l-2 border-stone-300 pl-4 dark:border-stone-600">
              {/* Character name and stats */}
              <div className="flex items-baseline justify-between gap-4 mb-1">
                <h3 className="text-[15px] font-medium text-stone-800 dark:text-stone-100">
                  {char.name}
                </h3>
                <span className="text-sm text-stone-400 dark:text-stone-500">
                  {char.joke_pct}% of jokes
                </span>
              </div>

              {/* Coach note - the primary content */}
              <p className="text-[15px] text-stone-600 dark:text-stone-300 leading-relaxed">
                {coachNote}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
