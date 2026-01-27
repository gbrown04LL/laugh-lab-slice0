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

// Generate a brief "why this works" explanation based on the device
function getWhyThisWorks(device: string): string {
  const deviceLower = device.toLowerCase();
  if (deviceLower.includes('callback')) return 'Rewards attentive viewers with a payoff.';
  if (deviceLower.includes('subvert') || deviceLower.includes('misdirect')) return 'Sets up expectations then pivots.';
  if (deviceLower.includes('escalat')) return 'Builds energy through amplification.';
  if (deviceLower.includes('understat') || deviceLower.includes('deadpan')) return 'Contrast creates the surprise.';
  if (deviceLower.includes('character') || deviceLower.includes('voice')) return 'Grounds the joke in who they are.';
  if (deviceLower.includes('absurd') || deviceLower.includes('surreal')) return 'Commits fully to the illogical.';
  if (deviceLower.includes('wordplay') || deviceLower.includes('pun')) return 'Language doing double duty.';
  if (deviceLower.includes('physical') || deviceLower.includes('visual')) return 'Shows rather than tells.';
  return 'Sharpens the comedic intent.';
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
    <section className="rounded-2xl border border-stone-200 bg-stone-50/80 p-6 dark:border-stone-800 dark:bg-stone-900/40">
      {/* Header - editorial style */}
      <h2 className="text-xs font-medium uppercase tracking-widest text-stone-500 dark:text-stone-400 mb-6">
        Punch-Up Workshop
      </h2>

      {/* Punch-up moments */}
      <div className="space-y-8">
        {moments.map((m) => (
          <div key={m.moment_id}>
            {/* Scene context */}
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-4 leading-relaxed">
              {m.moment_context}
            </p>

            {/* Alternative lines - premium feel with serif font */}
            <div className="space-y-4">
              {m.options?.map((opt) => {
                const whyThisWorks = getWhyThisWorks(opt.device);

                return (
                  <div
                    key={opt.option_id}
                    className="border-l-2 border-stone-300 pl-4 dark:border-stone-600"
                  >
                    {/* Comedic intent label */}
                    <span className="text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">
                      {opt.device}
                    </span>

                    {/* The joke line - larger, serif font for premium feel */}
                    <p
                      className="mt-2 text-lg leading-relaxed text-stone-800 dark:text-stone-100"
                      style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
                    >
                      "{opt.text}"
                    </p>

                    {/* Why this works + copy button */}
                    <div className="mt-2 flex items-center justify-between gap-4">
                      <span className="text-sm text-stone-500 dark:text-stone-400 italic">
                        {whyThisWorks}
                      </span>
                      <button
                        onClick={() => handleCopy(opt.option_id, opt.text)}
                        className="flex-shrink-0 text-xs font-medium text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
                      >
                        {copiedId === opt.option_id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
