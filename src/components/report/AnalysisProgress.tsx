'use client';

import React from 'react';
import { useEffect, useState } from 'react';

interface AnalysisProgressProps {
  isAnalyzing: boolean;
  stage?: number;
}

export function AnalysisProgress({ isAnalyzing, stage }: AnalysisProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) {
      setProgress(0);
      return;
    }

    if (typeof stage === 'number') {
      setProgress(Math.min(100, Math.max(0, stage)));
      return;
    }

    // Auto-progress animation
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p < 40) return p + 2;
        if (p < 70) return p + 1;
        if (p < 92) return p + 0.5;
        return p;
      });
    }, 200);

    return () => clearInterval(timer);
  }, [isAnalyzing, stage]);

  if (!isAnalyzing) return null;

  const getStageText = (p: number) => {
    if (p < 40) return 'Reading your script...';
    if (p < 60) return 'Crunching the numbers...';
    if (p < 90) return 'Writing your feedback...';
    return 'Polishing the report...';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🧠</div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Analysis in progress</p>
            <p className="text-sm text-gray-600 mt-1">
              {getStageText(progress)}
              <span className="inline-flex ml-1 gap-0.5">
                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-2">This usually takes 15-30 seconds</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>Progress</span>
            <span className="font-semibold">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
