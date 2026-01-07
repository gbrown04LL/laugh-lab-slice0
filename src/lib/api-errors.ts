import { NextResponse } from "next/server";
import type { ErrorObject, AnalysisStageType, ApiErrorResponse } from "./types";

/**
 * Create an ErrorObject conforming to Truth Contract schema.
 *
 * SECURITY: Never include raw script text in details.
 */
export function createErrorObject(params: {
  code: string;
  message: string;
  stage: AnalysisStageType;
  retryable: boolean;
  request_id: string;
  details?: Record<string, unknown>;
}): ErrorObject {
  return {
    code: params.code,
    message: params.message,
    stage: params.stage,
    retryable: params.retryable,
    request_id: params.request_id,
    details: params.details ?? {},
  };
}

/**
 * Standardized API error response wrapper.
 */
export function errorResponse(status: number, errors: ErrorObject[]): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ errors }, { status });
}

export function validationError(
  message: string,
  request_id: string,
  details?: Record<string, unknown>
): ErrorObject {
  return createErrorObject({
    code: "INPUT_VALIDATION_FAILED",
    message,
    stage: "input_validation",
    retryable: false,
    request_id,
    details,
  });
}

export function notFoundError(resource: string, request_id: string): ErrorObject {
  return createErrorObject({
    code: "NOT_FOUND",
    message: `${resource} not found`,
    stage: "input_validation",
    retryable: false,
    request_id,
    details: {},
  });
}

export function internalError(
  message: string,
  request_id: string,
  details?: Record<string, unknown>
): ErrorObject {
  return createErrorObject({
    code: "INTERNAL_ERROR",
    message,
    stage: "persistence",
    retryable: true,
    request_id,
    details,
  });
}

/**
 * Generate a request ID for tracking.
 * In production, this could be from headers or a UUID.
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
