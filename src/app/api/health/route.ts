import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { createErrorObject, generateRequestId } from "@/lib/api-errors";
import type { ErrorObject } from "@/lib/types";
import logger from "@/lib/logger";

// Required for serverless
export const runtime = "nodejs";

type HealthOk = { ok: true };
type HealthFail = { ok: false; errors: ErrorObject[] };

/**
 * GET /api/health
 *
 * Minimal DB connectivity check.
 */
export async function GET(): Promise<NextResponse<HealthOk | HealthFail>> {
  const request_id = generateRequestId();
  const endTimer = logger.startTimer("GET /api/health", { request_id });

  try {
    // Simple query; doesn't require any table rows
    await db.execute(sql`SELECT 1`);

    endTimer();
    return NextResponse.json({ ok: true });
  } catch {
    endTimer();
    return NextResponse.json(
      {
        ok: false,
        errors: [
          createErrorObject({
            code: "INTERNAL_ERROR",
            message: "Database connectivity check failed",
            stage: "persistence",
            retryable: true,
            request_id,
            details: {},
          }),
        ],
      },
      { status: 503 }
    );
  }
}
