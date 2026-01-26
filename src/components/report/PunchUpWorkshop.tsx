'use client';

import React from 'react';
import { useState } from 'react';

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
    <section className="mt-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 shadow-lg shadow-purple-500/25">
          <span className="text-white text-sm">✎</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Punch-Up Workshop</h2>
      </div>
      <div className="relative rounded-2xl bg-gradient-to-br from-violet-50 via-purple-50/80 to-indigo-50/60 border border-violet-200/50 p-6 shadow-[0_4px_20px_-4px_rgba(139,92,246,0.15)] overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-200/30 to-transparent rounded-bl-full" />
        <div className="relative grid gap-6">
          {moments.map((m) => (
            <div key={m.moment_id} className="bg-white/70 backdrop-blur-sm border border-white/80 rounded-xl p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
              <div className="mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-700/70">Scene Context</span>
                <p className="text-sm text-gray-800 mt-1 leading-relaxed">{m.moment_context}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {m.options?.map((opt) => (
                  <div
                    key={opt.option_id}
                    className="group relative bg-white/60 border border-violet-200/40 rounded-xl p-4 hover:border-violet-300 hover:shadow-[0_4px_12px_-2px_rgba(139,92,246,0.15)] hover:bg-white/80 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 px-2.5 py-1 rounded-full border border-violet-200/50">
                        {opt.device}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed mb-3">{opt.text}</p>
                    <button
                      onClick={() => handleCopy(opt.option_id, opt.text)}
                      className="text-xs font-semibold text-violet-600 bg-violet-50 border border-violet-200/60 rounded-lg px-3 py-1.5 hover:bg-violet-100 hover:border-violet-300 transition-colors"
                    >
                      {copiedId === opt.option_id ? '✓ Copied' : 'Copy to clipboard'}
                    </button>
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
