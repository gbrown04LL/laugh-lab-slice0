import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

// Analyses table - stores completed analysis results
export const analyses = pgTable('analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  fingerprint: text('fingerprint').notNull(),
  title: text('title').default('Untitled Script'),
  format: text('format').notNull(), // sitcom, feature, sketch, standup
  scriptHash: text('script_hash').notNull(), // SHA256 of script, not the script itself
  result: jsonb('result').notNull(), // Full analysis JSON
  createdAt: timestamp('created_at').defaultNow(),
});

// Usage tracking - for rate limiting anonymous users
export const usageTracking = pgTable('usage_tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: text('identifier').notNull().unique(), // fingerprint or IP
  monthlyCount: integer('monthly_count').default(0),
  monthKey: text('month_key').notNull(), // "2025-01"
  updatedAt: timestamp('updated_at').defaultNow(),
});
