import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

// Script submissions - stores submitted scripts for analysis
export const scriptSubmission = pgTable('script_submission', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: text('user_id').notNull(),
  text: text('text').notNull(),
  input_hash: text('input_hash').notNull(),
  word_count: integer('word_count').notNull(),
  estimated_pages: integer('estimated_pages').notNull(),
  inferred_format: text('inferred_format').notNull(),
  tier_compatibility: text('tier_compatibility').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Analysis jobs - tracks analysis job status
export const analysisJob = pgTable('analysis_job', {
  id: uuid('id').primaryKey().defaultRandom(),
  script_id: uuid('script_id').notNull().references(() => scriptSubmission.id),
  user_id: text('user_id').notNull(),
  status: text('status').notNull(), // pending, running, completed, failed
  run_id: uuid('run_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  started_at: timestamp('started_at'),
  completed_at: timestamp('completed_at'),
});

// Analysis reports - stores immutable analysis results
export const analysisReport = pgTable('analysis_report', {
  id: uuid('id').primaryKey(),
  job_id: uuid('job_id').notNull().references(() => analysisJob.id),
  user_id: text('user_id').notNull(),
  schema_version: text('schema_version').notNull(),
  output: jsonb('output').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Analyses table - stores completed analysis results (legacy, may be removed)
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
