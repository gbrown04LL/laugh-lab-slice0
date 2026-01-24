'use client';
import React from 'react';

import { useState } from 'react';

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
    <section className="mt-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/25">
          <span className="text-white text-sm">!</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Opportunities to Level Up</h2>
      </div>
      <div className="relative rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/80 to-yellow-50/60 border border-amber-200/50 p-6 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.15)] overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-200/30 to-transparent rounded-bl-full" />
        <div className="relative grid gap-4">
          {opportunities.map((op) => {
            const isOpen = expanded[op.issue_id];
            return (
              <div key={op.issue_id} className="bg-white/70 backdrop-blur-sm border border-white/80 rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] overflow-hidden hover:shadow-[0_4px_16px_-4px_rgba(245,158,11,0.2)] hover:bg-white/90 transition-all duration-300">
                <button
                  onClick={() => toggle(op.issue_id)}
                  className="w-full p-5 text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm shadow-amber-500/50" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm group-hover:text-amber-900 transition-colors">
                            {op.concrete_fix?.title || 'Opportunity'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">{op.why_it_matters}</p>
                        </div>
                        <span className="flex-shrink-0 text-xs text-amber-700 bg-amber-100/80 border border-amber-200/60 rounded-full px-3 py-1 font-medium group-hover:bg-amber-200/80 transition-colors">
                          {isOpen ? 'Collapse' : 'Expand'}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-amber-200/30 px-5 pb-5 pt-4 bg-gradient-to-b from-amber-50/30 to-transparent">
                    <div className="flex gap-4">
                      <div className="w-0.5 bg-gradient-to-b from-amber-400 to-amber-200 rounded-full" />
                      <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-800/70 mb-3">Steps to Fix</p>
                        <ol className="space-y-3">
                          {op.concrete_fix?.steps?.map((step, i) => (
                            <li key={i} className="flex gap-3 text-sm text-gray-700">
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                              <span className="pt-0.5">{step}</span>
                            </li>
                          ))}
                        </ol>
                        {op.concrete_fix?.expected_result && (
                          <div className="mt-5 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200/50">
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700/70 mb-1">Expected Result</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{op.concrete_fix.expected_result}</p>
                          </div>
                        )}
                      </div>
                    </div>
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
