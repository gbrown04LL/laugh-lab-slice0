import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analysisReport } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { STUB_USER_ID } from "@/lib/types";
import type { ReportResponse, FinalOutput, ErrorObject } from "@/lib/types";
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
    run_id: string;
  }>;
}

/**
 * GET /api/reports/[run_id]
 * 
 * Retrieve the immutable analysis report for a completed job run.
 * Returns Truth Contract compliant output with schema_version 1.0.0
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ReportResponse | { errors: ErrorObject[] }>> {
  const { run_id } = await params;
  const request_id = generateRequestId();
  const endTimer = logger.startTimer("GET /api/reports/[run_id]", { run_id, request_id });

  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(run_id)) {
      logger.warn("Invalid run_id format", { run_id, user_id: STUB_USER_ID, request_id });
      return errorResponse(400, [
        validationError("Invalid run_id format", request_id),
      ]);
    }

    // Fetch report with owner check
    const [report] = await db.select({
      id: analysisReport.id,
      job_id: analysisReport.job_id,
      user_id: analysisReport.user_id,
      schema_version: analysisReport.schema_version,
      output: analysisReport.output,
      created_at: analysisReport.created_at,
    }).from(analysisReport).where(eq(analysisReport.id, run_id)).limit(1);

    if (!report) {
      logger.warn("Report not found", { run_id, user_id: STUB_USER_ID, request_id });
      return errorResponse(404, [
        notFoundError("Report", request_id),
      ]);
    }

    // Owner check
    if (report.user_id !== STUB_USER_ID) {
      logger.warn("Report ownership mismatch", { 
        run_id, 
        user_id: STUB_USER_ID,
        request_id,
      });
      // Don't reveal ownership info
      return errorResponse(404, [
        notFoundError("Report", request_id),
      ]);
    }

    logger.info("Report retrieved", { 
      run_id: report.id, 
      job_id: report.job_id,
      user_id: report.user_id,
      request_id,
      schema_version: report.schema_version,
    });

    endTimer();

    return NextResponse.json({
      id: report.id,
      job_id: report.job_id,
      schema_version: report.schema_version,
      output: report.output as FinalOutput,
      created_at: report.created_at.toISOString(),
    });

  } catch (error) {
    logger.error("Failed to retrieve report", { 
      run_id,
      user_id: STUB_USER_ID,
      request_id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    
    return errorResponse(500, [
      internalError("Internal server error", request_id),
    ]);
  }
}
