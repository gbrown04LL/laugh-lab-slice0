import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CreateScriptSchema, STUB_USER_ID } from "@/lib/types";
import type { ScriptResponse, ErrorObject } from "@/lib/types";
import { 
  errorResponse, 
  validationError, 
  internalError, 
  generateRequestId 
} from "@/lib/api-errors";
import logger from "@/lib/logger";

// Required for Prisma on Vercel serverless
export const runtime = "nodejs";

/**
 * POST /api/scripts
 * 
 * Submit script text for analysis.
 * Returns the created script submission ID.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ScriptResponse | { errors: ErrorObject[] }>> {
  const request_id = generateRequestId();
  const endTimer = logger.startTimer("POST /api/scripts", { request_id });

  try {
    const body = await request.json();
    
    // Validate input
    const parseResult = CreateScriptSchema.safeParse(body);
    if (!parseResult.success) {
      logger.warn("Script validation failed", { 
        user_id: STUB_USER_ID,
        request_id,
        error_count: parseResult.error.issues.length,
      });
      return errorResponse(400, [
        validationError(
          "Validation failed",
          request_id,
          { 
            fields: parseResult.error.issues.map(e => ({
              path: e.path.join("."),
              message: e.message,
            })),
          }
        ),
      ]);
    }

    const { text } = parseResult.data;

    // Create script submission
    // SECURITY: Only log text length, never raw content
    const script = await prisma.scriptSubmission.create({
      data: {
        user_id: STUB_USER_ID,
        text,
      },
      select: {
        id: true,
        user_id: true,
        created_at: true,
      },
    });

    logger.info("Script created", { 
      script_id: script.id, 
      user_id: script.user_id,
      request_id,
      text_length: text.length,
    });

    endTimer();

    return NextResponse.json({
      id: script.id,
      user_id: script.user_id,
      created_at: script.created_at.toISOString(),
    }, { status: 201 });

  } catch (error) {
    logger.error("Failed to create script", { 
      user_id: STUB_USER_ID,
      request_id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    
    return errorResponse(500, [
      internalError("Internal server error", request_id),
    ]);
  }
}
