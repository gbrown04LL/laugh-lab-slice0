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
    <section>
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-indigo-200 bg-indigo-50 dark:border-indigo-900/40 dark:bg-indigo-900/20">
          <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Punch-Up Workshop
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Alternative lines to strengthen key moments
          </p>
        </div>
        <span className="ml-auto text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full dark:text-indigo-300 dark:bg-indigo-900/20 dark:border-indigo-900/40">
          {moments.length}
        </span>
      </div>

      {/* Punch-up Cards */}
      <div className="space-y-4">
        {moments.map((m) => (
          <div
            key={m.moment_id}
            className="rounded-xl border border-slate-200 bg-white/80 backdrop-blur shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900/40"
          >
            <div className="flex">
              {/* Left accent border */}
              <div className="w-1 bg-indigo-500 flex-shrink-0" />

              {/* Content */}
              <div className="flex-1 p-4">
                {/* Context */}
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Scene Context
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                    {m.moment_context}
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {m.options?.map((opt, idx) => (
                    <div
                      key={opt.option_id}
                      className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/40"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Option {String.fromCharCode(65 + idx)}
                          </span>
                          <EvidenceChip text={opt.device} variant="tag" />
                        </div>
                        <button
                          onClick={() => handleCopy(opt.option_id, opt.text)}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors flex items-center gap-1"
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
                      <p className="text-sm text-slate-700 dark:text-slate-200 italic">
                        "{opt.text}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
