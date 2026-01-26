'use client';

import React, { useState } from 'react';

export interface PunchUpOption {
  option_id: string;
  device: string;
  text: string;
}

export interface PunchUpMoment {
  moment_id: string;
  moment_context: string;
  options: PunchUpOption[];
}

interface PunchUpWorkshopProps {
  moments: PunchUpMoment[];
}

export function PunchUpWorkshop({ moments }: PunchUpWorkshopProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!moments?.length) return null;

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      console.error('Failed to copy');
    }
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 shadow-sm">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900">Punch-Up Workshop</h2>
        <span className="ml-auto text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{moments.length}</span>
      </div>
      <div className="bg-gradient-to-br from-violet-50 to-purple-50/50 border border-violet-200/60 rounded-xl p-4">
        <div className="space-y-3">
          {moments.map((m) => (
            <div key={m.moment_id} className="bg-white/80 border border-violet-100 rounded-lg p-3">
              <div className="mb-2">
                <span className="text-xs font-semibold text-violet-700">Scene Context</span>
                <p className="text-sm text-gray-700 mt-0.5">{m.moment_context}</p>
              </div>

              <div className="space-y-2">
                {m.options?.map((opt) => (
                  <div
                    key={opt.option_id}
                    className="bg-violet-50/50 border border-violet-100 rounded-lg p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-medium text-violet-700 bg-violet-100 px-2 py-0.5 rounded">
                        {opt.device}
                      </span>
                      <button
                        onClick={() => handleCopy(opt.option_id, opt.text)}
                        className="text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors flex items-center gap-1"
                      >
                        {copiedId === opt.option_id ? (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copied
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700">{opt.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
