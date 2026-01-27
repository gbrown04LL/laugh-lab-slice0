'use client';

import React from 'react';

export interface RevisionStep {
  step: string;
  timebox_minutes?: number;
}

interface PriorityFixPlanProps {
  steps: RevisionStep[];
}

export function PriorityFixPlan({ steps }: PriorityFixPlanProps) {
  if (!steps?.length) return null;

  // Limit to 3 steps max
  const limitedSteps = steps.slice(0, 3);

  return (
    <section className="rounded-2xl border border-stone-200 bg-stone-50/80 p-6 dark:border-stone-800 dark:bg-stone-900/40">
      {/* Header - editorial style */}
      <h2 className="text-xs font-medium uppercase tracking-widest text-stone-500 dark:text-stone-400 mb-6">
        Suggested Rewrite Path
      </h2>

      {/* Steps - clean list format */}
      <div className="space-y-4">
        {limitedSteps.map((step, idx) => (
          <div key={idx} className="border-l-2 border-stone-300 pl-4 dark:border-stone-600">
            {/* Step number and timebox */}
            <div className="flex items-baseline justify-between gap-4 mb-1">
              <span className="text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">
                Pass {idx + 1}
              </span>
              {step.timebox_minutes && (
                <span className="text-sm text-stone-400 dark:text-stone-500">
                  ~{step.timebox_minutes} min
                </span>
              )}
            </div>

            {/* Step description */}
            <p className="text-[15px] text-stone-700 dark:text-stone-200 leading-relaxed">
              {step.step}
            </p>
          </div>
        ))}
      </div>

      {/* Reassuring close - calm, confident */}
      <p className="mt-6 pt-4 border-t border-stone-200 text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400 leading-relaxed">
        Trust the material. These passes will sharpen what is already there without overworking the script.
      </p>
    </section>
  );
}
