-- AlterTable: Add fingerprint fields to script_submissions
-- Required for Truth Contract script_fingerprint compliance

-- Add columns (NOT NULL with default for existing rows, then alter)
ALTER TABLE "script_submissions" ADD COLUMN "input_hash" VARCHAR(64);
ALTER TABLE "script_submissions" ADD COLUMN "word_count" INTEGER;
ALTER TABLE "script_submissions" ADD COLUMN "estimated_pages" DOUBLE PRECISION;
ALTER TABLE "script_submissions" ADD COLUMN "inferred_format" VARCHAR(20);
ALTER TABLE "script_submissions" ADD COLUMN "tier_compatibility" VARCHAR(20);

-- For any existing rows (if any), populate with placeholder values
-- In production, you'd want to backfill these properly
UPDATE "script_submissions"
SET
  "input_hash" = 'legacy-' || SUBSTRING(MD5("text") FROM 1 FOR 56),
  "word_count" = COALESCE(array_length(regexp_split_to_array(trim("text"), '\s+'), 1), 0),
  "estimated_pages" = GREATEST(0.5, ROUND(COALESCE(array_length(regexp_split_to_array(trim("text"), '\s+'), 1), 0)::numeric / 250, 1)),
  "inferred_format" = 'scene',
  "tier_compatibility" = 'ok'
WHERE "input_hash" IS NULL;

-- Now make required columns NOT NULL
ALTER TABLE "script_submissions" ALTER COLUMN "input_hash" SET NOT NULL;
ALTER TABLE "script_submissions" ALTER COLUMN "word_count" SET NOT NULL;
ALTER TABLE "script_submissions" ALTER COLUMN "estimated_pages" SET NOT NULL;
ALTER TABLE "script_submissions" ALTER COLUMN "inferred_format" SET NOT NULL;

-- CreateIndex
CREATE INDEX "script_submissions_input_hash_idx" ON "script_submissions"("input_hash");
