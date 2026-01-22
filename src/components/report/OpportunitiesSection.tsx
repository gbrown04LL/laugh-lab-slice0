'use client';

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
      <h2 className="text-lg font-semibold text-gray-900 mb-4">🔧 Opportunities to Level Up</h2>
      <div className="grid gap-3">
        {opportunities.map((op) => {
          const isOpen = expanded[op.issue_id];
          return (
            <div key={op.issue_id} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => toggle(op.issue_id)}
                className="w-full p-5 text-left"
              >
                <div className="flex">
                  <div className="w-1 bg-amber-500 rounded-full mr-4 self-stretch" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {op.concrete_fix?.title || 'Opportunity'}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{op.why_it_matters}</p>
                      </div>
                      <span className="text-xs text-gray-500 border border-gray-200 rounded-full px-2 py-1">
                        {isOpen ? 'Collapse' : 'Expand'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                  <div className="flex">
                    <div className="w-1 bg-amber-500 rounded-full mr-4" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Steps to Fix</p>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                        {op.concrete_fix?.steps?.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                      {op.concrete_fix?.expected_result && (
                        <div className="mt-4 bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-semibold uppercase text-gray-500">Expected Result</p>
                          <p className="text-sm text-gray-700 mt-1">{op.concrete_fix.expected_result}</p>
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
    </section>
  );
}
