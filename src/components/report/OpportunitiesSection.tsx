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
    <div className="space-y-4">
      {opportunities.map((op) => {
        const isOpen = expanded[op.issue_id];

        return (
          <div
            key={op.issue_id}
            className="border-l-2 border-zinc-700"
          >
            <button
              onClick={() => toggle(op.issue_id)}
              className="w-full pl-4 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Fix title */}
                  <p className="text-sm font-medium text-zinc-200">
                    {op.concrete_fix?.title || 'Opportunity'}
                  </p>

                  {/* Why it matters */}
                  <p className="mt-1 text-sm text-zinc-400 line-clamp-2">
                    {op.why_it_matters}
                  </p>

                  {/* Evidence chips */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <LocationChips location={op.location} />
                    <TagChips tags={op.tags} />
                    {op.severity && (
                      <SeverityBadge severity={op.severity} />
                    )}
                  </div>
                </div>

                {/* Expand icon */}
                <svg
                  className={`flex-shrink-0 w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
              <div className="pl-4 mt-4 pt-4 border-t border-zinc-800">
                <p className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
                  Steps to Fix
                </p>
                <ol className="space-y-2">
                  {op.concrete_fix.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-zinc-300">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 text-xs font-medium flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>

                {op.concrete_fix.expected_result && (
                  <div className="mt-4 p-3 rounded border border-zinc-800 bg-zinc-900/50">
                    <p className="text-xs font-medium text-zinc-400 mb-1">
                      Expected Result
                    </p>
                    <p className="text-sm text-zinc-300">
                      {op.concrete_fix.expected_result}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: 'minor' | 'moderate' | 'major' }) {
  const config = {
    minor: {
      label: 'Minor',
      classes: 'text-zinc-400 bg-zinc-900 border-zinc-700',
    },
    moderate: {
      label: 'Moderate',
      classes: 'text-zinc-300 bg-zinc-800 border-zinc-700',
    },
    major: {
      label: 'Major',
      classes: 'text-zinc-200 bg-zinc-800 border-zinc-600',
    },
  };

  const { label, classes } = config[severity];

  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}
