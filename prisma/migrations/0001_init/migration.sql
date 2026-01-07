-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('pending', 'running', 'completed', 'failed');

-- CreateTable
CREATE TABLE "script_submissions" (
    "id" UUID NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "script_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_jobs" (
    "id" UUID NOT NULL,
    "script_id" UUID NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'pending',
    "run_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "analysis_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_reports" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "schema_version" VARCHAR(20) NOT NULL,
    "output" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "script_submissions_user_id_idx" ON "script_submissions"("user_id");

-- CreateIndex
CREATE INDEX "analysis_jobs_user_id_idx" ON "analysis_jobs"("user_id");

-- CreateIndex
CREATE INDEX "analysis_jobs_script_id_idx" ON "analysis_jobs"("script_id");

-- CreateIndex
CREATE INDEX "analysis_jobs_status_idx" ON "analysis_jobs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "analysis_reports_job_id_key" ON "analysis_reports"("job_id");

-- CreateIndex
CREATE INDEX "analysis_reports_user_id_idx" ON "analysis_reports"("user_id");

-- AddForeignKey
ALTER TABLE "analysis_jobs" ADD CONSTRAINT "analysis_jobs_script_id_fkey" FOREIGN KEY ("script_id") REFERENCES "script_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_reports" ADD CONSTRAINT "analysis_reports_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "analysis_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
