'use client';

import React from 'react';
import { EvidenceChip, LocationChips } from './EvidenceChip';

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

  // Normalize strengths to StrengthItem format
  const normalizedStrengths: StrengthItem[] = strengths.map(s =>
    typeof s === 'string' ? { text: s } : s
  );

  return (
    <div className="space-y-4">
      {normalizedStrengths.map((strength, idx) => (
        <div
          key={idx}
          className="border-l-2 border-zinc-700 pl-4"
        >
          <p className="text-sm text-zinc-300 leading-relaxed">
            {strength.text}
          </p>

          {/* Evidence chips */}
          {(strength.location || strength.tags?.length) && (
            <div className="mt-2 flex flex-wrap gap-2">
              <LocationChips location={strength.location} />
              {strength.tags?.map((tag, i) => (
                <EvidenceChip key={i} text={tag} variant="tag" />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Peak Moments (if provided) */}
      {peakMoments && peakMoments.length > 0 && (
        <div className="mt-6 pt-6 border-t border-zinc-800">
          <h4 className="text-xs uppercase tracking-wider text-zinc-500 mb-4">Peak Moments</h4>
          <div className="space-y-3">
            {peakMoments.map((moment, idx) => (
              <div
                key={idx}
                className="border-l-2 border-zinc-700 pl-4"
              >
                <p className="text-sm text-zinc-300 mb-2">
                  {moment.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  <LocationChips location={moment.location} />
                  {moment.reason_tag && (
                    <EvidenceChip text={moment.reason_tag} variant="tag" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
