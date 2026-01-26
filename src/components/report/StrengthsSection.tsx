'use client';
import React from 'react';

interface StrengthsSectionProps {
  strengths: string[];
}

export function StrengthsSection({ strengths }: StrengthsSectionProps) {
  if (!strengths?.length) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 shadow-sm">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900">What's Working</h2>
        <span className="ml-auto text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{strengths.length}</span>
      </div>
      <div className="bg-gradient-to-br from-emerald-50 to-green-50/50 border border-emerald-200/60 rounded-xl p-4">
        <div className="space-y-2">
          {strengths.map((strength, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 bg-white/80 rounded-lg p-3 border border-green-100"
            >
              <div className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-green-500" />
              <p className="text-sm text-gray-700 leading-relaxed">{strength}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
