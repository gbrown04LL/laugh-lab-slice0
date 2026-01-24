'use client';
import React from 'react';

interface StrengthsSectionProps {
  strengths: string[];
}

export function StrengthsSection({ strengths }: StrengthsSectionProps) {
  if (!strengths?.length) return null;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">🎯 What's Working</h2>
      <div className="grid gap-3">
        {strengths.map((strength, idx) => (
          <div
            key={idx}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm"
          >
            <div className="flex">
              <div className="w-1 bg-green-500 rounded-full mr-4 self-stretch" />
              <p className="text-sm text-gray-700 leading-relaxed">{strength}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
