'use client';

import React from 'react';

interface EvidenceChipProps {
  text: string;
  variant?: 'default' | 'scene' | 'line' | 'tag';
}

export function EvidenceChip({ text, variant = 'default' }: EvidenceChipProps) {
  // Muted editorial color palette - stone-based for consistency
  const variantClasses = {
    default: 'border-stone-200 bg-stone-100 text-stone-600 dark:border-stone-700 dark:bg-stone-800/40 dark:text-stone-300',
    scene: 'border-stone-200 bg-stone-100 text-stone-600 dark:border-stone-700 dark:bg-stone-800/40 dark:text-stone-300',
    line: 'border-stone-200 bg-stone-100 text-stone-600 dark:border-stone-700 dark:bg-stone-800/40 dark:text-stone-300',
    tag: 'border-stone-200 bg-stone-100 text-stone-500 dark:border-stone-700 dark:bg-stone-800/40 dark:text-stone-400',
  };

  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${variantClasses[variant]}`}>
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
