'use client';

import React, { useState } from 'react';
import { LocationChips } from './EvidenceChip';

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

  // Sort by severity (major first) to rank by impact
  const sortedOpportunities = [...opportunities].sort((a, b) => {
    const severityOrder = { major: 0, moderate: 1, minor: 2 };
    const aOrder = severityOrder[a.severity || 'minor'];
    const bOrder = severityOrder[b.severity || 'minor'];
    return aOrder - bOrder;
  });

  return (
    <section>
      {/* Section Header - editorial style */}
      <h2 className="text-xs font-medium uppercase tracking-widest text-stone-500 dark:text-stone-400 mb-4">
        Opportunities to Level Up
      </h2>

      {/* Opportunity items */}
      <div className="space-y-4">
        {sortedOpportunities.map((op, idx) => {
          const isOpen = expanded[op.issue_id];

          return (
            <div
              key={op.issue_id}
              className="border-l-2 border-stone-300 pl-4 dark:border-stone-600"
            >
              <button
                onClick={() => toggle(op.issue_id)}
                className="w-full text-left"
              >
                {/* One-sentence diagnosis */}
                <p className="text-[15px] font-medium text-stone-800 dark:text-stone-100 leading-relaxed">
                  {op.concrete_fix?.title || `Opportunity ${idx + 1}`}
                </p>

                {/* One-sentence why it matters */}
                <p className="mt-1 text-[15px] text-stone-600 dark:text-stone-300 leading-relaxed">
                  {op.why_it_matters}
                </p>

                {/* Location reference */}
                {op.location && (
                  <div className="mt-2">
                    <LocationChips location={op.location} />
                  </div>
                )}

                {/* Expand indicator */}
                {op.concrete_fix?.steps && (
                  <span className="inline-flex items-center gap-1 mt-2 text-xs text-stone-400 dark:text-stone-500">
                    {isOpen ? 'Hide steps' : 'Show steps'}
                    <svg
                      className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                )}
              </button>

              {/* Expanded content - steps to fix */}
              {isOpen && op.concrete_fix?.steps && (
                <div className="mt-4 ml-4 space-y-2">
                  {op.concrete_fix.steps.map((step, i) => (
                    <p key={i} className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                      <span className="text-stone-400 dark:text-stone-500 mr-2">{i + 1}.</span>
                      {step}
                    </p>
                  ))}

                  {op.concrete_fix.expected_result && (
                    <p className="mt-3 text-sm text-stone-500 dark:text-stone-400 italic">
                      Expected result: {op.concrete_fix.expected_result}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
