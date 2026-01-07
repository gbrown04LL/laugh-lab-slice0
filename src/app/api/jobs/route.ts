import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CreateJobSchema, STUB_USER_ID } from "@/lib/types";
import type { JobResponse, ErrorObject } from "@/lib/types";
import { 
  errorResponse, 
  validationError, 
  notFoundError, 
  internalError, 
  generateRequestId 
} from "@/lib/api-errors";
import logger from "@/lib/logger";

// Required for Prisma on Vercel serverless
export const runtime = "nodejs";

/**
 * POST /api/jobs
 * 
 * Create an analysis job for a script submission.
 * The job starts in 'pending' status.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<JobResponse | { errors: ErrorObject[] }>> {
  const request_id = generateRequestId();
  const endTimer = logger.startTimer("POST /api/jobs", { request_id });

  try {
    const body = await request.json();
    
    // Validate input
    const parseResult = CreateJobSchema.safeParse(body);
    if (!parseResult.success) {
      logger.warn("Job validation failed", { 
        user_id: STUB_USER_ID,
        request_id,
        error_count: parseResult.error.errors.length,
      });
      return errorResponse(400, [
        validationError(
          "Validation failed",
          request_id,
          {
            fields: parseResult.error.errors.map(e => ({
              path: e.path.join("."),
              message: e.message,
            })),
          }
        ),
      ]);
    }

    const { script_id } = parseResult.data;

    // Verify script exists and belongs to user
    const script = await prisma.scriptSubmission.findUnique({
      where: { id: script_id },
      select: { id: true, user_id: true },
    });

    if (!script) {
      logger.warn("Script not found", { script_id, user_id: STUB_USER_ID, request_id });
      return errorResponse(404, [
        notFoundError("Script", request_id),
      ]);
    }

    if (script.user_id !== STUB_USER_ID) {
      logger.warn("Script ownership mismatch", { 
        script_id, 
        user_id: STUB_USER_ID,
        request_id,
      });
      // Don't reveal ownership info
      return errorResponse(404, [
        notFoundError("Script", request_id),
      ]);
    }

    // Create job in pending status
    const job = await prisma.analysisJob.create({
      data: {
        script_id,
        user_id: STUB_USER_ID,
        status: "pending",
      },
      select: {
        id: true,
        script_id: true,
        user_id: true,
        status: true,
        run_id: true,
        created_at: true,
        started_at: true,
        completed_at: true,
      },
    });

    logger.info("Job created", { 
      job_id: job.id, 
      script_id: job.script_id,
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
    }, { status: 201 });

  } catch (error) {
    logger.error("Failed to create job", { 
      user_id: STUB_USER_ID,
      request_id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    
    return errorResponse(500, [
      internalError("Internal server error", request_id),
    ]);
  }
}
