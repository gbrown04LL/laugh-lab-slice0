'use client';

import React from 'react';

export interface RevisionStep {
  step: string;
  timebox_minutes?: number;
}

interface PriorityFixPlanProps {
  steps: RevisionStep[];
  mode?: 'time_boxed' | 'multi_pass';
}

export function PriorityFixPlan({ steps, mode = 'time_boxed' }: PriorityFixPlanProps) {
  if (!steps?.length) return null;

  const totalMinutes = steps.reduce((sum, s) => sum + (s.timebox_minutes || 0), 0);

  return (
    <div>
      {/* Header */}
      {totalMinutes > 0 && (
        <div className="mb-6 text-sm text-zinc-400">
          Estimated time: <span className="text-zinc-300 font-medium">~{totalMinutes} min</span>
        </div>
      )}

      {/* Steps */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-3 top-0 bottom-0 w-px bg-zinc-800" />

        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div key={idx} className="relative flex gap-4">
              {/* Step number circle */}
              <div className="relative z-10 flex-shrink-0 w-6 h-6 rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center">
                <span className="text-xs font-medium text-zinc-400">
                  {idx + 1}
                </span>
              </div>

              {/* Step content */}
              <div className="flex-1 pb-4">
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {step.step}
                </p>
                {step.timebox_minutes && (
                  <div className="mt-1 text-xs text-zinc-500">
                    {step.timebox_minutes} min
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
