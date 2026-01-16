-- AddColumns: script_submissions fingerprint and metadata fields
-- These columns exist in schema.prisma but were missing from 0001_init
--
-- WARNING: This migration truncates script_submissions.
-- Acceptable for Slice-0 / dev environments. Do NOT run in production with real data.

-- Truncate to allow NOT NULL columns without defaults
TRUNCATE TABLE "script_submissions" RESTART IDENTITY CASCADE;

-- Add missing columns
ALTER TABLE "script_submissions" ADD COLUMN "input_hash" VARCHAR(64) NOT NULL;
ALTER TABLE "script_submissions" ADD COLUMN "word_count" INTEGER NOT NULL;
ALTER TABLE "script_submissions" ADD COLUMN "estimated_pages" DOUBLE PRECISION NOT NULL;
ALTER TABLE "script_submissions" ADD COLUMN "inferred_format" VARCHAR(20) NOT NULL;
ALTER TABLE "script_submissions" ADD COLUMN "tier_compatibility" VARCHAR(20);

-- CreateIndex
CREATE INDEX "script_submissions_input_hash_idx" ON "script_submissions"("input_hash");
