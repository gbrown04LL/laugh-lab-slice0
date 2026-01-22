'use client';
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

  return (
    <div className="flex flex-col items-center">
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
            background={{ fill: '#f3f4f6' }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      
      {/* Score number overlay */}
      <div className="-mt-24 text-center">
        <span className="text-5xl font-bold text-gray-900">{score}</span>
        <span className="text-2xl text-gray-500">/100</span>
      </div>
      
      {/* Percentile badge */}
      <div className="mt-4 text-center">
        <span className="inline-block bg-amber-100 text-amber-800 text-sm font-medium px-3 py-1 rounded-full">
          Better than {percentile}% of sitcom pilots
        </span>
      </div>
    </div>
  );
}
