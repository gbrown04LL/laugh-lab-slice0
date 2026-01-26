'use client';
import React, { useState } from 'react';

export interface OpportunityItem {
  issue_id: string;
  why_it_matters: string;
  concrete_fix: {
    title: string;
    steps: string[];
    expected_result: string;
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
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900">Opportunities</h2>
        <span className="ml-auto text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{opportunities.length}</span>
      </div>
      <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/60 rounded-xl p-4">
        <div className="space-y-2">
          {opportunities.map((op) => {
            const isOpen = expanded[op.issue_id];
            return (
              <div key={op.issue_id} className="bg-white/80 border border-amber-100 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggle(op.issue_id)}
                  className="w-full p-3 text-left group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-amber-500" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {op.concrete_fix?.title || 'Opportunity'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{op.why_it_matters}</p>
                        </div>
                        <svg className={`flex-shrink-0 w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-amber-100 px-3 pb-3 pt-2 bg-amber-50/50">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">Steps to Fix</p>
                    <ol className="space-y-1.5">
                      {op.concrete_fix?.steps?.map((step, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                          <span className="pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                    {op.concrete_fix?.expected_result && (
                      <div className="mt-3 bg-green-50 rounded-lg p-2.5 border border-green-100">
                        <p className="text-xs font-semibold text-green-700 mb-0.5">Expected Result</p>
                        <p className="text-sm text-gray-700">{op.concrete_fix.expected_result}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
