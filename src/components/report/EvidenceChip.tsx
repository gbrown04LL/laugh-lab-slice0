'use client';

import React from 'react';

interface EvidenceChipProps {
  text: string;
  variant?: 'default' | 'scene' | 'line' | 'tag';
}

export function EvidenceChip({ text, variant = 'default' }: EvidenceChipProps) {
  // All variants use the same minimal styling
  const classes = 'border-zinc-700 bg-zinc-900 text-zinc-400';

  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${classes}`}>
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
