'use client';

import React from 'react';

interface EvidenceChipProps {
  text: string;
  variant?: 'default' | 'scene' | 'line' | 'tag';
}

export function EvidenceChip({ text, variant = 'default' }: EvidenceChipProps) {
  const variantClasses = {
    default: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200',
    scene: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-900/20 dark:text-indigo-300',
    line: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/40 dark:bg-violet-900/20 dark:text-violet-300',
    tag: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${variantClasses[variant]}`}>
      {text}
    </span>
  );
}

// Helper to parse location data from API into chips
export function LocationChips({ location }: { location?: { type: string; value: string } }) {
  if (!location) return null;

  const { type, value } = location;

  if (type === 'scene') {
    return <EvidenceChip text={`Scene: ${value}`} variant="scene" />;
  }

  if (type === 'line_range') {
    return <EvidenceChip text={`Lines ${value}`} variant="line" />;
  }

  return <EvidenceChip text={value} />;
}

// Helper to render tag chips
export function TagChips({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null;

  return (
    <>
      {tags.map((tag, idx) => (
        <EvidenceChip key={idx} text={tag} variant="tag" />
      ))}
    </>
  );
}
