'use client';
import React from 'react';

interface ExecutiveSummaryProps {
  score: number;
  strengthsCount: number;
  opportunitiesCount: number;
  punchUpsCount: number;
}

export function ExecutiveSummary({ score, strengthsCount, opportunitiesCount, punchUpsCount }: ExecutiveSummaryProps) {
  const getSummaryMessage = (s: number) => {
    if (s >= 80) return { text: 'Excellent comedy writing! Minor polish needed.', tone: 'text-green-700' };
    if (s >= 70) return { text: 'Strong script with good comedy potential.', tone: 'text-green-600' };
    if (s >= 50) return { text: 'Solid foundation - focus on the opportunities below.', tone: 'text-amber-600' };
    return { text: 'Several areas need attention - see recommendations.', tone: 'text-red-600' };
  };

  const summary = getSummaryMessage(score);

  const quickStats = [
    { label: 'Strengths', value: strengthsCount, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { label: 'Opportunities', value: opportunitiesCount, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { label: 'Punch-Ups', value: punchUpsCount, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  ];

  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <h3 className="font-semibold text-gray-900">Quick Summary</h3>
      </div>

      <p className={`text-sm font-medium ${summary.tone} mb-4`}>{summary.text}</p>

      <div className="flex flex-wrap gap-3">
        {quickStats.map((stat, idx) => (
          <div key={idx} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${stat.bg} border ${stat.border}`}>
            <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
            <span className="text-xs text-gray-600">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
