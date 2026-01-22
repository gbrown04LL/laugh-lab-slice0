'use client';

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
      <h2 className="text-lg font-semibold text-gray-900 mb-4">✍️ Punch-Up Workshop</h2>
      <div className="grid gap-5">
        {moments.map((m) => (
          <div key={m.moment_id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="mb-4">
              <span className="text-xs font-medium text-gray-500 uppercase">Scene Context</span>
              <p className="text-sm text-gray-800 mt-1">{m.moment_context}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {m.options?.map((opt) => (
                <div
                  key={opt.option_id}
                  className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {opt.device}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed mb-3">{opt.text}</p>
                  <button
                    onClick={() => handleCopy(opt.option_id, opt.text)}
                    className="text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50"
                  >
                    {copiedId === opt.option_id ? '✓ Copied' : 'Copy to clipboard'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
