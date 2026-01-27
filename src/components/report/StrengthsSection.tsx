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
    <section>
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/20">
          <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            What's Working
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Strengths to preserve in your script
          </p>
        </div>
        <span className="ml-auto text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full dark:text-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-900/40">
          {normalizedStrengths.length}
        </span>
      </div>

      {/* Strength Cards with left accent */}
      <div className="space-y-3">
        {normalizedStrengths.map((strength, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-200 bg-white/80 backdrop-blur shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900/40"
          >
            <div className="flex">
              {/* Left accent border */}
              <div className="w-1 bg-emerald-500 flex-shrink-0" />

              {/* Content */}
              <div className="flex-1 p-4">
                <p className="text-sm text-slate-700 leading-relaxed dark:text-slate-200">
                  {strength.text}
                </p>

                {/* Evidence chips */}
                {(strength.location || strength.tags?.length) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <LocationChips location={strength.location} />
                    {strength.tags?.map((tag, i) => (
                      <EvidenceChip key={i} text={tag} variant="tag" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Peak Moments (if provided) */}
      {peakMoments && peakMoments.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-3">Peak Moments</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {peakMoments.map((moment, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white/80 backdrop-blur p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
              >
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
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
    </section>
  );
}
