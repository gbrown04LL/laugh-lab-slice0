'use client';

import React, { useState } from 'react';
import { EvidenceChip, LocationChips, TagChips } from './EvidenceChip';

export interface OpportunityItem {
  issue_id: string;
  why_it_matters: string;
  location?: { type: string; value: string };
  tags?: string[];
  severity?: 'minor' | 'moderate' | 'major';
  concrete_fix?: {
    title: string;
    steps?: string[];
    expected_result?: string;
  };
}

interface OpportunitiesSectionProps {
  opportunities: OpportunityItem[];
}

export function OpportunitiesSection({ opportunities }: OpportunitiesSectionProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!opportunities?.length) return null;

  const toggle = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section>
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/20">
          <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Opportunities
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Areas to strengthen for maximum impact
          </p>
        </div>
        <span className="ml-auto text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-900/40">
          {opportunities.length}
        </span>
      </div>

      {/* Opportunity Cards with left accent */}
      <div className="space-y-3">
        {opportunities.map((op) => {
          const isOpen = expanded[op.issue_id];

          return (
            <div
              key={op.issue_id}
              className="rounded-xl border border-slate-200 bg-white/80 backdrop-blur shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900/40"
            >
              <div className="flex">
                {/* Left accent border */}
                <div className="w-1 bg-amber-500 flex-shrink-0" />

                {/* Content */}
                <div className="flex-1">
                  <button
                    onClick={() => toggle(op.issue_id)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Fix title */}
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                          {op.concrete_fix?.title || 'Opportunity'}
                        </p>

                        {/* Why it matters */}
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                          {op.why_it_matters}
                        </p>

                        {/* Evidence chips */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <LocationChips location={op.location} />
                          <TagChips tags={op.tags} />
                          {op.severity && (
                            <SeverityBadge severity={op.severity} />
                          )}
                        </div>
                      </div>

                      {/* Expand icon */}
                      <svg
                        className={`flex-shrink-0 w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isOpen && op.concrete_fix?.steps && (
                    <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-4 mb-3">
                        Steps to Fix
                      </p>
                      <ol className="space-y-2">
                        {op.concrete_fix.steps.map((step, i) => (
                          <li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-200">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 text-xs font-medium flex items-center justify-center dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {i + 1}
                            </span>
                            <span className="pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>

                      {op.concrete_fix.expected_result && (
                        <div className="mt-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/20">
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
                            Expected Result
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-200">
                            {op.concrete_fix.expected_result}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SeverityBadge({ severity }: { severity: 'minor' | 'moderate' | 'major' }) {
  const config = {
    minor: {
      label: 'Minor',
      classes: 'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-300 dark:bg-slate-800/40 dark:border-slate-700',
    },
    moderate: {
      label: 'Moderate',
      classes: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-900/40',
    },
    major: {
      label: 'Major',
      classes: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-900/20 dark:border-rose-900/40',
    },
  };

  const { label, classes } = config[severity];

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}
