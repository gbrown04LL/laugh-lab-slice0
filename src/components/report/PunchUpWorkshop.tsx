'use client';

import React, { useState } from 'react';
import { EvidenceChip } from './EvidenceChip';

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
    <div className="space-y-6">
      {moments.map((m) => (
        <div
          key={m.moment_id}
          className="border-l-2 border-zinc-700 pl-4"
        >
          {/* Context */}
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
              Scene Context
            </p>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {m.moment_context}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {m.options?.map((opt, idx) => (
              <div
                key={opt.option_id}
                className="rounded border border-zinc-800 bg-zinc-900/50 p-3"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-400">
                      Option {String.fromCharCode(65 + idx)}
                    </span>
                    <EvidenceChip text={opt.device} variant="tag" />
                  </div>
                  <button
                    onClick={() => handleCopy(opt.option_id, opt.text)}
                    className="text-xs font-medium text-zinc-400 hover:text-zinc-300 transition-colors flex items-center gap-1"
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
                <p className="text-sm text-zinc-300 italic">
                  "{opt.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
