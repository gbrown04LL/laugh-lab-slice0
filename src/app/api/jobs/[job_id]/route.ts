import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analysisJob } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { STUB_USER_ID } from "@/lib/types";
import type { JobResponse, ErrorObject } from "@/lib/types";
import {
  errorResponse,
  validationError,
  notFoundError,
  internalError,
  generateRequestId
} from "@/lib/api-errors";
import logger from "@/lib/logger";

// Required for serverless
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{
    job_id: string;
  }>;
}

/**
 * GET /api/jobs/[job_id]
 * 
 * Retrieve the status and details of an analysis job.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<JobResponse | { errors: ErrorObject[] }>> {
  const { job_id } = await params;
  const request_id = generateRequestId();
  const endTimer = logger.startTimer("GET /api/jobs/[job_id]", { job_id, request_id });

  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(job_id)) {
      logger.warn("Invalid job_id format", { job_id, user_id: STUB_USER_ID, request_id });
      return errorResponse(400, [
        validationError("Invalid job_id format", request_id),
      ]);
    }

    // Fetch job with owner check
    const [job] = await db.select({
      id: analysisJob.id,
      script_id: analysisJob.script_id,
      user_id: analysisJob.user_id,
      status: analysisJob.status,
      run_id: analysisJob.run_id,
      created_at: analysisJob.created_at,
      started_at: analysisJob.started_at,
      completed_at: analysisJob.completed_at,
    }).from(analysisJob).where(eq(analysisJob.id, job_id)).limit(1);

    if (!job) {
      logger.warn("Job not found", { job_id, user_id: STUB_USER_ID, request_id });
      return errorResponse(404, [
        notFoundError("Job", request_id),
      ]);
    }

    // Owner check
    if (job.user_id !== STUB_USER_ID) {
      logger.warn("Job ownership mismatch", { 
        job_id, 
        user_id: STUB_USER_ID,
        request_id,
      });
      // Don't reveal ownership info
      return errorResponse(404, [
        notFoundError("Job", request_id),
      ]);
    }

    logger.info("Job retrieved", { 
      job_id: job.id, 
      user_id: job.user_id,
      request_id,
      status: job.status,
    });

    endTimer();

    return NextResponse.json({
      id: job.id,
      script_id: job.script_id,
      user_id: job.user_id,
      status: job.status,
      run_id: job.run_id,
      created_at: job.created_at.toISOString(),
      started_at: job.started_at?.toISOString() ?? null,
      completed_at: job.completed_at?.toISOString() ?? null,
    });

  } catch (error) {
    logger.error("Failed to retrieve job", { 
      job_id,
      user_id: STUB_USER_ID,
      request_id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    
    return errorResponse(500, [
      internalError("Internal server error", request_id),
    ]);
  }
}
