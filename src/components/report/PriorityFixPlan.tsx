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
    <section className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-indigo-200 bg-indigo-50 dark:border-indigo-900/40 dark:bg-indigo-900/20">
            <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              Priority Fix Plan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {mode === 'time_boxed' ? 'Time-boxed revision steps' : 'Multi-pass approach'}
            </p>
          </div>
        </div>

        {totalMinutes > 0 && (
          <div className="text-right">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              ~{totalMinutes} min
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">total estimate</div>
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />

        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div key={idx} className="relative flex gap-4">
              {/* Step number circle */}
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full border-2 border-indigo-500 bg-white flex items-center justify-center dark:bg-slate-900">
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  {idx + 1}
                </span>
              </div>

              {/* Step content */}
              <div className="flex-1 pb-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                    {step.step}
                  </p>
                  {step.timebox_minutes && (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {step.timebox_minutes} min
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Completion indicator */}
          <div className="relative flex gap-4">
            <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full border-2 border-emerald-500 bg-emerald-50 flex items-center justify-center dark:bg-emerald-900/20">
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Ready for final review
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
