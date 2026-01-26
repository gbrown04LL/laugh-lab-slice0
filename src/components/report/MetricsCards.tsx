'use client';
import React from 'react';

interface MetricsCardsProps {
  lpm: number;
  linesPerJoke: number;
  ensembleBalance: number;
}

export function MetricsCards({ lpm, linesPerJoke, ensembleBalance }: MetricsCardsProps) {
  // Determine status labels and colors
  const lpmStatus = lpm >= 2.0 ? { label: 'Above Average', color: 'text-green-600', bg: 'bg-green-500', progress: 100 }
                  : lpm >= 1.5 ? { label: 'On Target', color: 'text-amber-600', bg: 'bg-amber-500', progress: 75 }
                  : { label: 'Below Average', color: 'text-red-600', bg: 'bg-red-500', progress: 40 };

  const lpjStatus = linesPerJoke <= 6 ? { label: 'Tight pacing', color: 'text-green-600', bg: 'bg-green-500', progress: 100 }
                  : linesPerJoke <= 10 ? { label: 'Could be snappier', color: 'text-amber-600', bg: 'bg-amber-500', progress: 60 }
                  : { label: 'Needs more jokes', color: 'text-red-600', bg: 'bg-red-500', progress: 30 };

  const balanceStatus = ensembleBalance >= 0.8 ? { label: 'Well balanced', color: 'text-green-600', bg: 'bg-green-500', progress: 100 }
                      : ensembleBalance >= 0.6 ? { label: 'Slightly uneven', color: 'text-amber-600', bg: 'bg-amber-500', progress: 75 }
                      : { label: 'Needs balance', color: 'text-red-600', bg: 'bg-red-500', progress: 40 };

  const metrics = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Laughs Per Minute',
      value: lpm.toFixed(1),
      target: '2.0+ ideal',
      status: lpmStatus,
      iconBg: 'from-blue-400 to-blue-600',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: 'Lines Per Joke',
      value: linesPerJoke.toFixed(1),
      target: '6 or fewer ideal',
      status: lpjStatus,
      iconBg: 'from-purple-400 to-purple-600',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      label: 'Ensemble Balance',
      value: `${Math.round(ensembleBalance * 100)}%`,
      target: '80%+ ideal',
      status: balanceStatus,
      iconBg: 'from-green-400 to-green-600',
      isPercentage: true,
      percentValue: Math.round(ensembleBalance * 100),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {metrics.map((metric, idx) => (
        <div key={idx} className="group relative bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${metric.iconBg} flex items-center justify-center text-white shadow-sm`}>
              {metric.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{metric.label}</div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                <span className="text-xs text-gray-400">{metric.target}</span>
              </div>

              {/* Progress bar */}
              <div className="mt-2">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${metric.status.bg} rounded-full transition-all duration-500`}
                    style={{ width: `${metric.isPercentage ? metric.percentValue : metric.status.progress}%` }}
                  />
                </div>
              </div>

              {/* Status label */}
              <div className={`text-xs font-semibold mt-1.5 ${metric.status.color}`}>
                {metric.status.label}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
