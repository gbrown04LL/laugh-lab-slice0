'use client';
import React from 'react';

interface MetricsCardsProps {
  lpm: number;
  linesPerJoke: number;
  ensembleBalance: number;
}

export function MetricsCards({ lpm, linesPerJoke, ensembleBalance }: MetricsCardsProps) {
  // Determine status labels and colors
  const lpmStatus = lpm >= 2.0 ? { label: '↑ Above Average', color: 'text-green-600' } 
                  : lpm >= 1.5 ? { label: '→ On Target', color: 'text-gray-600' }
                  : { label: '↓ Below Average', color: 'text-red-600' };

  const lpjStatus = linesPerJoke <= 6 ? { label: 'Tight pacing', color: 'text-green-600' }
                  : linesPerJoke <= 10 ? { label: 'Could be snappier', color: 'text-amber-600' }
                  : { label: 'Needs more jokes', color: 'text-red-600' };

  const balanceStatus = ensembleBalance >= 0.8 ? { label: 'Well balanced', color: 'text-green-600' }
                      : ensembleBalance >= 0.6 ? { label: 'Slightly uneven', color: 'text-amber-600' }
                      : { label: 'Needs balance', color: 'text-red-600' };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {/* LPM Card */}
      <div className="group relative flex flex-col bg-gradient-to-br from-white to-gray-50/80 border border-gray-200/60 rounded-2xl p-5 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative">
          <div className="text-sm font-medium text-gray-500">LPM (Laughs/Min)</div>
          <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mt-1">{lpm.toFixed(1)}</div>
          <div className={`text-sm font-semibold mt-2 ${lpmStatus.color}`}>
            {lpmStatus.label}
          </div>
        </div>
      </div>

      {/* Lines Per Joke Card */}
      <div className="group relative flex flex-col bg-gradient-to-br from-white to-gray-50/80 border border-gray-200/60 rounded-2xl p-5 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative">
          <div className="text-sm font-medium text-gray-500">Lines Per Joke</div>
          <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mt-1">{linesPerJoke.toFixed(1)}</div>
          <div className={`text-sm font-semibold mt-2 ${lpjStatus.color}`}>
            {lpjStatus.label}
          </div>
        </div>
      </div>

      {/* Ensemble Balance Card */}
      <div className="group relative flex flex-col bg-gradient-to-br from-white to-gray-50/80 border border-gray-200/60 rounded-2xl p-5 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative">
          <div className="text-sm font-medium text-gray-500">Ensemble Balance</div>
          <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mt-1">
            {Math.round(ensembleBalance * 100)}%
          </div>
          <div className={`text-sm font-semibold mt-2 ${balanceStatus.color}`}>
            {balanceStatus.label}
          </div>
        </div>
      </div>
    </div>
  );
}
