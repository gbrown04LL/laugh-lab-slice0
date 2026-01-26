'use client';
import React from 'react';
import { ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';

interface ScoreGaugeProps {
  score: number;
  percentile?: number;
}

export function ScoreGauge({ score, percentile = 75 }: ScoreGaugeProps) {
  // Define score zones and colors
  const zones = [
    { name: 'Red', start: 0, end: 50, color: '#dc2626' },    // red-600
    { name: 'Yellow', start: 50, end: 70, color: '#f59e0b' }, // amber-500
    { name: 'Green', start: 70, end: 100, color: '#16a34a' }  // green-600
  ];

  // Build chart data segments for each zone (achieved vs remaining)
  const data: { name: string; value: number; fill: string }[] = [];
  const currentZoneIndex = score > 70 ? 2 : score > 50 ? 1 : 0;
  zones.forEach((zone, idx) => {
    const zoneRange = zone.end - zone.start;
    if (idx < currentZoneIndex) {
      data.push({ name: zone.name, value: zoneRange, fill: zone.color });
    } else if (idx === currentZoneIndex) {
      if (score === zone.end) {
        data.push({ name: zone.name, value: zoneRange, fill: zone.color });
      } else {
        const achieved = score - zone.start;
        const remaining = zone.end - score;
        if (achieved > 0) {
          data.push({ name: zone.name, value: achieved, fill: zone.color });
        }
        if (remaining > 0) {
          data.push({ name: `${zone.name}-remaining`, value: remaining, fill: '#e5e7eb' });
        }
      }
    } else {
      data.push({ name: zone.name, value: zoneRange, fill: '#e5e7eb' });
    }
  });

  // Determine the color based on score
  const scoreColor = score > 70 ? 'from-green-500 to-emerald-600'
                   : score > 50 ? 'from-amber-500 to-orange-600'
                   : 'from-red-500 to-rose-600';

  const glowColor = score > 70 ? 'shadow-green-500/20'
                  : score > 50 ? 'shadow-amber-500/20'
                  : 'shadow-red-500/20';

  return (
    <div className="flex flex-col items-center">
      <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Comedy Score</div>
      <ResponsiveContainer width="100%" height={200}>
        <RadialBarChart
          data={data}
          startAngle={180}
          endAngle={0}
          innerRadius="70%"
          outerRadius="100%"
          barCategoryGap="0%"
          cx="50%"
          cy="100%"
        >
          <RadialBar
            dataKey="value"
            cornerRadius={5}
            background={{ fill: '#e5e7eb' }}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Score number overlay */}
      <div className="-mt-24 text-center">
        <span className={`text-6xl font-black bg-gradient-to-br ${scoreColor} bg-clip-text text-transparent drop-shadow-sm`}>{score}</span>
        <span className="text-2xl font-medium text-gray-400">/100</span>
      </div>

      {/* Percentile badge */}
      <div className="mt-5 text-center">
        <span className={`inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 text-sm font-semibold px-4 py-2 rounded-full border border-amber-200/60 shadow-lg ${glowColor}`}>
          <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Better than {percentile}% of sitcom pilots
        </span>
      </div>
    </div>
  );
}
