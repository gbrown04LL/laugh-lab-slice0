import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/prisma";
import {
  STUB_USER_ID,
  SCHEMA_VERSION,
  FinalOutputSchema,
  PromptAOutputSchema,
  PromptBOutputSchema,
  type TierConfig,
  type ScriptFingerprint,
  type FinalOutput,
  type ErrorObject,
  type RunResponse,
  type PromptAOutput,
  type PromptBOutput,
} from "@/lib/types";
import {
  PROMPT_A_SYSTEM,
  PROMPT_B_SYSTEM,
  USE_STUB_PROVIDER,
  runPromptAStub,
  runPromptBStub,
} from "@/lib/prompts";
import { callOpenAIWithSchema } from "@/lib/openai";
import { PromptASchemaForOpenAI, PromptBSchemaForOpenAI } from "@/lib/schemas";
import { createErrorObject, errorResponse, generateRequestId } from "@/lib/api-errors";
import logger from "@/lib/logger";
import { computeScriptFingerprint } from "@/lib/fingerprint";

// Required for Prisma on Vercel serverless
export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{ job_id: string }>;
};

function getDefaultTierConfig(): TierConfig {
  // Slice-0 defaults: Pro tier, small limits, deterministic.
  return {
    depth_level: "pro",
    max_issues: 4,
    punch_up_moments: 3,
    options_per_moment: 3,
    metrics_verbosity: "interpretive",
    revision_guidance_level: "time_boxed",
  };
}

/**
 * Persist an immutable error report to the database.
 * */
async function persistErrorReport(params: {
  run_id: string;
  job_id: string;
  user_id: string;
  tierConfig: TierConfig;
  scriptFingerprint: ScriptFingerprint;
  createdAt: string;
  errors: ErrorObject[];
  promptA?: PromptAOutput;
  promptB?: PromptBOutput;
}) {
  const output: FinalOutput = {
    schema_version: SCHEMA_VERSION,
    run: {
      run_id: params.run_id,
      created_at: params.createdAt,
      tier_config: params.tierConfig,
      script_fingerprint: params.scriptFingerprint,
    },
    prompt_a: params.promptA,
    prompt_b: params.promptB,
    errors: params.errors,
  };

  await prisma.$transaction([
    prisma.analysisReport.create({
      data: {
        id: params.run_id,
        job_id: params.job_id,
        user_id: params.user_id,
        schema_version: SCHEMA_VERSION,
        output: output as object,
      },
    }),
    prisma.analysisJob.update({
      where: { id: params.job_id },
      data: {
        status: "failed",
        completed_at: new Date(),
      },
    }),
  ]);
}

/**
 * Execute Prompt A analysis.
 * Uses Structured Outputs (json_schema + strict: true) for contract enforcement.
 * Falls back to stub generator when LLM_PROVIDER=stub.
 */
async function executePromptA(scriptText: string): Promise<PromptAOutput> {
  if (USE_STUB_PROVIDER) {
    logger.info("Using stub provider for Prompt A (LLM_PROVIDER=stub)");
    return runPromptAStub(scriptText);
  }

  // Real OpenAI call with Structured Outputs
  const rawPromptA = await callOpenAIWithSchema<PromptAOutput>({
    system: PROMPT_A_SYSTEM,
    user: scriptText,
    schemaName: "PromptAResult",
    schema: PromptASchemaForOpenAI,
  });

  return rawPromptA;
}

/**
 * Execute Prompt B analysis.
 * Uses Structured Outputs (json_schema + strict: true) for contract enforcement.
 * Falls back to stub generator when LLM_PROVIDER=stub.
 */
async function executePromptB(
  scriptText: string,
  promptA: PromptAOutput,
  tierConfig: TierConfig
): Promise<PromptBOutput> {
  if (USE_STUB_PROVIDER) {
    logger.info("Using stub provider for Prompt B (LLM_PROVIDER=stub)");
    return runPromptBStub(scriptText, promptA, tierConfig);
  }

  // Real OpenAI call with Structured Outputs
  const promptBInput = {
    script: scriptText,
    analysis_a: promptA,
    config: tierConfig,
  };

  const rawPromptB = await callOpenAIWithSchema<PromptBOutput>({
    system: PROMPT_B_SYSTEM,
    user: JSON.stringify(promptBInput),
    schemaName: "PromptBResult",
    schema: PromptBSchemaForOpenAI,
  });

  return rawPromptB;
}

/**
 * Validate that Prompt B only references issue_ids from Prompt A.
 * Returns array of invalid issue_ids if validation fails, empty array if valid.
 */
function validateIssueIdReferences(
  promptA: PromptAOutput,
  promptB: PromptBOutput
): string[] {
  const allowedIssueIds = new Set(promptA.issue_candidates.map((c) => c.issue_id));
  const invalidIds: string[] = [];

  for (const item of promptB.sections.whats_getting_in_the_way) {
    if (!allowedIssueIds.has(item.issue_id)) {
      invalidIds.push(item.issue_id);
    }
  }

  for (const item of promptB.sections.recommended_fixes) {
    if (!allowedIssueIds.has(item.issue_id) && !invalidIds.includes(item.issue_id)) {
      invalidIds.push(item.issue_id);
    }
  }

  return invalidIds;
}

/**
 * Validate that Prompt B only references moment_ids from Prompt A's peak_moments.
 * Returns array of invalid moment_ids if validation fails, empty array if valid.
 */
function validateMomentIdReferences(
  promptA: PromptAOutput,
  promptB: PromptBOutput
): string[] {
  const allowedMomentIds = new Set(promptA.metrics.peak_moments.map((m) => m.moment_id));
  const invalidIds: string[] = [];

  for (const suggestion of promptB.sections.punch_up_suggestions) {
    if (!allowedMomentIds.has(suggestion.moment_id) && !invalidIds.includes(suggestion.moment_id)) {
      invalidIds.push(suggestion.moment_id);
    }
  }

  return invalidIds;
}

/**
 * POST /api/jobs/[job_id]/run
 *
 * Execute the Slice-0 analysis job (Prompt A → Prompt B → Store Report).
 * Idempotent on completed jobs (returns existing run_id).
 *
 * Contract-first implementation:
 * - Uses OpenAI Structured Outputs (json_schema + strict: true) for schema enforcement
 * - Validates Prompt B doesn't introduce new issue_ids or moment_ids
 * - Assembles run metadata deterministically on server
 *
 * SECURITY: No raw script content in logs.
 * TRUTH CONTRACT: Store output compliant with schema_version 1.0.0.
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<RunResponse | { errors: ErrorObject[] }>> {
  const { job_id } = await params;
  const request_id = generateRequestId();
  const endTimer = logger.startTimer("POST /api/jobs/[job_id]/run", { job_id, request_id });

  // Track these so we can persist an immutable error report after run_id allocation.
  let allocated_run_id: string | null = null;
  let allocated_created_at: string | null = null;
  let allocated_tier_config: TierConfig | null = null;
  let allocated_script_fingerprint: ScriptFingerprint | null = null;
  let partial_prompt_a: PromptAOutput | undefined;
  let partial_prompt_b: PromptBOutput | undefined;


  // Validate UUID format early
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(job_id)) {
    endTimer();
    return errorResponse(400, [
      createErrorObject({
        code: "INPUT_VALIDATION_FAILED",
        message: "Invalid job_id format",
        stage: "input_validation",
        retryable: false,
        request_id,
        details: { field: "job_id" },
      }),
    ]);
  }

  try {
    const job = await prisma.analysisJob.findFirst({
      where: { id: job_id, user_id: STUB_USER_ID },
      include: { script: true },
    });

    if (!job) {
      endTimer();
      return errorResponse(404, [
        createErrorObject({
          code: "NOT_FOUND",
          message: "Job not found",
          stage: "input_validation",
          retryable: false,
          request_id,
          details: { job_id },
        }),
      ]);
    }

    if (job.status === "completed" && job.run_id) {
      logger.info("Job already completed, returning existing run_id", {
        job_id,
        run_id: job.run_id,
        status: job.status,
        request_id,
      });
      endTimer();
      return NextResponse.json({
        job_id: job.id,
        run_id: job.run_id,
        status: job.status,
        already_completed: true,
      });
    }

    if (job.status === "running") {
      endTimer();
      return errorResponse(409, [
        createErrorObject({
          code: "INPUT_VALIDATION_FAILED",
          message: "Job is already running",
          stage: "input_validation",
          retryable: true,
          request_id,
          details: { job_id },
        }),
      ]);
    }

    if (job.status === "failed") {
      logger.warn("Job previously failed", { job_id, status: job.status, request_id });
      endTimer();
      return errorResponse(409, [
        createErrorObject({
          code: "INPUT_VALIDATION_FAILED",
          message: "Job previously failed. Create a new job to retry.",
          stage: "input_validation",
          retryable: false,
          request_id,
          details: { job_id },
        }),
      ]);
    }

    if (!job.script) {
      endTimer();
      return errorResponse(404, [
        createErrorObject({
          code: "NOT_FOUND",
          message: "Script submission not found for this job",
          stage: "input_validation",
          retryable: false,
          request_id,
          details: { job_id },
        }),
      ]);
    }

    // Allocate run_id and mark job running
    const run_id = uuidv4();
    const createdAt = new Date().toISOString();

    allocated_run_id = run_id;
    allocated_created_at = createdAt;

    await prisma.analysisJob.update({
      where: { id: job.id },
      data: {
        status: "running",
        run_id,
        started_at: new Date(),
      },
    });

    const scriptText = job.script.text;
    const scriptFingerprint = computeScriptFingerprint(scriptText);
    const tierConfig = getDefaultTierConfig();

    allocated_script_fingerprint = scriptFingerprint;
    allocated_tier_config = tierConfig;

    // Stage: Prompt A (with Structured Outputs enforcement)
    let promptA: PromptAOutput;
    try {
      const rawPromptA = await executePromptA(scriptText);

      // Additional Zod validation (belt-and-suspenders with Structured Outputs)
      const validationA = PromptAOutputSchema.safeParse(rawPromptA);
      if (!validationA.success) {
        throw new Error(`Prompt A validation failed: ${validationA.error.message}`);
      }

      promptA = validationA.data;
      partial_prompt_a = promptA;
    } catch (err) {
      logger.error("Prompt A failed", {
        job_id,
        run_id,
        request_id,
        error: err instanceof Error ? err.message : String(err),
      });

      const errorObj = createErrorObject({
        code: "PROMPT_A_FAILED",
        message: "Prompt A stage failed",
        stage: "prompt_a",
        retryable: true,
        request_id: run_id,
        details: { job_id, run_id, error: err instanceof Error ? err.message : String(err) },
      });

      await persistErrorReport({
        run_id,
        job_id: job.id,
        user_id: STUB_USER_ID,
        tierConfig,
        scriptFingerprint,
        createdAt,
        errors: [errorObj],
      });

      endTimer();
      return errorResponse(500, [errorObj]);
    }

    // Stage: Prompt B (with Structured Outputs enforcement)
    let promptB: PromptBOutput;
    try {
      const rawPromptB = await executePromptB(scriptText, promptA, tierConfig);

      // Additional Zod validation (belt-and-suspenders with Structured Outputs)
      const validationB = PromptBOutputSchema.safeParse(rawPromptB);
      if (!validationB.success) {
        throw new Error(`Prompt B validation failed: ${validationB.error.message}`);
      }

      promptB = validationB.data;
      partial_prompt_b = promptB;

      // Hard validation: Prompt B issue_id references must exist in Prompt A
      const invalidIssueIds = validateIssueIdReferences(promptA, promptB);
      if (invalidIssueIds.length > 0) {
        const errorObj = createErrorObject({
          code: "PROMPT_B_UNKNOWN_ISSUE_ID",
          message: "Prompt B references issue_ids not present in Prompt A",
          stage: "prompt_b",
          retryable: false,
          request_id: run_id,
          details: {
            invalid_issue_ids: invalidIssueIds,
            allowed_issue_ids: promptA.issue_candidates.map((c) => c.issue_id),
          },
        });

        await persistErrorReport({
          run_id,
          job_id: job.id,
          user_id: STUB_USER_ID,
          tierConfig,
          scriptFingerprint,
          createdAt,
          errors: [errorObj],
          promptA,
          promptB,
        });

        endTimer();
        return errorResponse(400, [errorObj]);
      }

      // Hard validation: Prompt B moment_id references must exist in Prompt A
      const invalidMomentIds = validateMomentIdReferences(promptA, promptB);
      if (invalidMomentIds.length > 0) {
        const errorObj = createErrorObject({
          code: "PROMPT_B_UNKNOWN_MOMENT_ID",
          message: "Prompt B references moment_ids not present in Prompt A peak_moments",
          stage: "prompt_b",
          retryable: false,
          request_id: run_id,
          details: {
            invalid_moment_ids: invalidMomentIds,
            allowed_moment_ids: promptA.metrics.peak_moments.map((m) => m.moment_id),
          },
        });

        await persistErrorReport({
          run_id,
          job_id: job.id,
          user_id: STUB_USER_ID,
          tierConfig,
          scriptFingerprint,
          createdAt,
          errors: [errorObj],
          promptA,
          promptB,
        });

        endTimer();
        return errorResponse(400, [errorObj]);
      }
    } catch (err) {
      logger.error("Prompt B failed", {
        job_id,
        run_id,
        request_id,
        error: err instanceof Error ? err.message : String(err),
      });

      const errorObj = createErrorObject({
        code: "PROMPT_B_FAILED",
        message: "Prompt B stage failed",
        stage: "prompt_b",
        retryable: true,
        request_id: run_id,
        details: { job_id, run_id, error: err instanceof Error ? err.message : String(err) },
      });

      await persistErrorReport({
        run_id,
        job_id: job.id,
        user_id: STUB_USER_ID,
        tierConfig,
        scriptFingerprint,
        createdAt,
        errors: [errorObj],
        promptA,
      });

      endTimer();
      return errorResponse(500, [errorObj]);
    }

    // Build final output (Truth Contract)
    // run metadata is assembled deterministically on the server (not by LLM)
    const finalOutput: FinalOutput = {
      schema_version: SCHEMA_VERSION,
      run: {
        run_id,
        created_at: createdAt,
        tier_config: tierConfig,
        script_fingerprint: scriptFingerprint,
      },
      prompt_a: promptA,
      prompt_b: promptB,
    };

    // Validate final output before persistence
    const validationResult = FinalOutputSchema.safeParse(finalOutput);
    if (!validationResult.success) {
      logger.error("Final output schema validation failed", {
        job_id,
        run_id,
        request_id,
      });

      const errorObj = createErrorObject({
        code: "OUTPUT_VALIDATION_FAILED",
        message: "Final output failed Truth Contract validation",
        stage: "persistence",
        retryable: false,
        request_id: run_id,
        details: {
          job_id,
          run_id,
          zod_issues: validationResult.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
      });

      await persistErrorReport({
        run_id,
        job_id: job.id,
        user_id: STUB_USER_ID,
        tierConfig,
        scriptFingerprint,
        createdAt,
        errors: [errorObj],
        promptA,
        promptB,
      });

      endTimer();
      return errorResponse(500, [errorObj]);
    }

    // Persist report (immutable) + mark job completed
    await prisma.$transaction([
      prisma.analysisReport.create({
        data: {
          id: run_id,
          job_id: job.id,
          user_id: STUB_USER_ID,
          schema_version: SCHEMA_VERSION,
          output: validationResult.data as object,
        },
      }),
      prisma.analysisJob.update({
        where: { id: job.id },
        data: {
          status: "completed",
          completed_at: new Date(),
        },
      }),
    ]);

    endTimer();
    return NextResponse.json({
      job_id: job.id,
      run_id,
      status: "completed",
      already_completed: false,
    });
  } catch (err) {
    logger.error("Unhandled error in run route", {
      job_id,
      request_id,
    });

    // If we allocated a run_id, attempt to persist an immutable error report.
    if (allocated_run_id && allocated_created_at && allocated_tier_config && allocated_script_fingerprint) {
      const errorObj = createErrorObject({
        code: "ANALYSIS_FAILED",
        message: "Analysis failed",
        stage: "persistence",
        retryable: true,
        request_id: allocated_run_id,
        details: { job_id, run_id: allocated_run_id },
      });

      try {
        await persistErrorReport({
          run_id: allocated_run_id,
          job_id,
          user_id: STUB_USER_ID,
          tierConfig: allocated_tier_config,
          scriptFingerprint: allocated_script_fingerprint,
          createdAt: allocated_created_at,
          errors: [errorObj],
          promptA: partial_prompt_a,
          promptB: partial_prompt_b,
        });
      } catch {
        // If DB is unavailable, we can only return the error response.
      }

      endTimer();
      return errorResponse(500, [errorObj]);
    }

    endTimer();
    return errorResponse(500, [
      createErrorObject({
        code: "INTERNAL_ERROR",
        message: "Internal server error",
        stage: "persistence",
        retryable: true,
        request_id,
        details: { job_id },
      }),
    ]);
  }
}
