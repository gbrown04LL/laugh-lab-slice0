'use client';

import React from 'react';
import { LocationChips } from './EvidenceChip';

interface StrengthItem {
  text: string;
  location?: { type: string; value: string };
  tags?: string[];
}

interface StrengthsSectionProps {
  strengths: (string | StrengthItem)[];
  peakMoments?: Array<{
    label: string;
    location?: { type: string; value: string };
    reason_tag?: string;
  }>;
}

export function StrengthsSection({ strengths, peakMoments }: StrengthsSectionProps) {
  if (!strengths?.length) return null;

  // Normalize strengths to StrengthItem format, limit to 3 max
  const normalizedStrengths: StrengthItem[] = strengths
    .slice(0, 3)
    .map(s => typeof s === 'string' ? { text: s } : s);

  return (
    <section>
      {/* Section Header - editorial style */}
      <h2 className="text-xs font-medium uppercase tracking-widest text-stone-500 dark:text-stone-400 mb-4">
        Strengths to Preserve
      </h2>

      {/* Strength items - clean list, no cards */}
      <div className="space-y-4">
        {normalizedStrengths.map((strength, idx) => (
          <div key={idx} className="border-l-2 border-stone-300 pl-4 dark:border-stone-600">
            <p className="text-[15px] leading-relaxed text-stone-700 dark:text-stone-200">
              {strength.text}
            </p>

            {/* Location reference - subtle */}
            {strength.location && (
              <div className="mt-2">
                <LocationChips location={strength.location} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Peak Moments - condensed */}
      {peakMoments && peakMoments.length > 0 && (
        <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-700">
          <h3 className="text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-3">
            Peak Moments
          </h3>
          <ul className="space-y-2">
            {peakMoments.slice(0, 3).map((moment, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 text-sm text-stone-600 dark:text-stone-300"
              >
                <span className="text-stone-400 dark:text-stone-500 mt-0.5">-</span>
                <span>{moment.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
