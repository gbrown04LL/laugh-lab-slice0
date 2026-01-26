'use client';
import React from 'react';

interface ScoreGaugeProps {
  score: number;
  percentile?: number;
}

export function ScoreGauge({ score, percentile = 75 }: ScoreGaugeProps) {
  // Determine the color based on score
  const getScoreColor = (s: number) => {
    if (s >= 70) return { gradient: 'from-green-500 to-emerald-600', stroke: '#16a34a', bg: 'bg-green-500', label: 'Great!' };
    if (s >= 50) return { gradient: 'from-amber-500 to-orange-600', stroke: '#f59e0b', bg: 'bg-amber-500', label: 'Good' };
    return { gradient: 'from-red-500 to-rose-600', stroke: '#dc2626', bg: 'bg-red-500', label: 'Needs Work' };
  };

  const colors = getScoreColor(score);

  // SVG arc calculation for semi-circle gauge
  const radius = 80;
  const strokeWidth = 12;
  const circumference = Math.PI * radius; // Half circle
  const progress = (score / 100) * circumference;
  const dashOffset = circumference - progress;

  return (
    <div className="flex flex-col items-center py-4">
      <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Comedy Score</div>

      {/* SVG Gauge */}
      <div className="relative w-[200px] h-[110px]">
        <svg
          viewBox="0 0 200 110"
          className="w-full h-full"
        >
          {/* Background arc */}
          <path
            d="M 10 100 A 80 80 0 0 1 190 100"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d="M 10 100 A 80 80 0 0 1 190 100"
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-1000 ease-out"
          />
          {/* Zone markers */}
          <circle cx="10" cy="100" r="3" fill="#dc2626" />
          <circle cx="58" cy="26" r="3" fill="#f59e0b" />
          <circle cx="142" cy="26" r="3" fill="#16a34a" />
          <circle cx="190" cy="100" r="3" fill="#16a34a" />
        </svg>

        {/* Score number overlay */}
        <div className="absolute inset-0 flex items-end justify-center pb-0">
          <div className="text-center">
            <span className={`text-5xl font-black bg-gradient-to-br ${colors.gradient} bg-clip-text text-transparent`}>
              {score}
            </span>
            <span className="text-xl font-medium text-gray-400">/100</span>
          </div>
        </div>
      </div>

      {/* Status label */}
      <div className={`mt-2 px-4 py-1.5 rounded-full text-sm font-bold text-white ${colors.bg}`}>
        {colors.label}
      </div>

      {/* Percentile badge */}
      <div className="mt-4 text-center">
        <span className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-50 to-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-full border border-gray-200 shadow-sm">
          <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Better than {percentile}% of sitcom pilots
        </span>
      </div>
    </div>
  );
}
