'use client';

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
      <div className="flex flex-col bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="text-sm font-medium text-gray-500">LPM (Laughs/Min)</div>
        <div className="text-3xl font-bold text-gray-900 mt-1">{lpm.toFixed(1)}</div>
        <div className={`text-sm font-medium mt-1 ${lpmStatus.color}`}>
          {lpmStatus.label}
        </div>
      </div>

      {/* Lines Per Joke Card */}
      <div className="flex flex-col bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="text-sm font-medium text-gray-500">Lines Per Joke</div>
        <div className="text-3xl font-bold text-gray-900 mt-1">{linesPerJoke.toFixed(1)}</div>
        <div className={`text-sm font-medium mt-1 ${lpjStatus.color}`}>
          {lpjStatus.label}
        </div>
      </div>

      {/* Ensemble Balance Card */}
      <div className="flex flex-col bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="text-sm font-medium text-gray-500">Ensemble Balance</div>
        <div className="text-3xl font-bold text-gray-900 mt-1">
          {Math.round(ensembleBalance * 100)}%
        </div>
        <div className={`text-sm font-medium mt-1 ${balanceStatus.color}`}>
          {balanceStatus.label}
        </div>
      </div>
    </div>
  );
}
