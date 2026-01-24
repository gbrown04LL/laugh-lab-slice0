'use client';
import React from 'react';

interface StrengthsSectionProps {
  strengths: string[];
}

export function StrengthsSection({ strengths }: StrengthsSectionProps) {
  if (!strengths?.length) return null;

  return (
    <section className="mt-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-green-500/25">
          <span className="text-white text-sm">✓</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">What's Working</h2>
      </div>
      <div className="relative rounded-2xl bg-gradient-to-br from-emerald-50 via-green-50/80 to-teal-50/60 border border-emerald-200/50 p-6 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.15)] overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-bl-full" />
        <div className="relative grid gap-4">
          {strengths.map((strength, idx) => (
            <div
              key={idx}
              className="group flex items-start gap-4 bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_-4px_rgba(16,185,129,0.2)] hover:bg-white/90 transition-all duration-300"
            >
              <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-sm shadow-green-500/50" />
              <p className="text-sm text-gray-700 leading-relaxed">{strength}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
