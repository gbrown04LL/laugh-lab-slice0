import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import getPrismaClient from "@/lib/prisma";
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
import { PROMPT_A_SYSTEM, PROMPT_B_SYSTEM } from "@/lib/prompts";
import { callOpenAI } from "@/lib/openai";
import { createErrorObject, errorResponse, generateRequestId } from "@/lib/api-errors";
import logger from "@/lib/logger";
import { computeScriptFingerprint } from "@/lib/fingerprint";
import { runEvidenceLockPipeline } from "@/lib/analysis/evidenceLockPipeline";

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
  const prisma = getPrismaClient();
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
        output: output as any,
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
 * POST /api/jobs/[job_id]/run
 *
 * Execute the Slice-0 analysis job (Prompt A → Prompt B → Store Report).
 * Idempotent on completed jobs (returns existing run_id).
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
  const prisma = getPrismaClient();

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

    // Stage: Prompt A
    let promptA: PromptAOutput | undefined;
    let evidenceLockSummary: string | undefined;
    try {
      // Real OpenAI call for Prompt A
      const rawPromptA = await callOpenAI(PROMPT_A_SYSTEM, scriptText);
      
      // Validate Prompt A output
      const validationA = PromptAOutputSchema.safeParse(rawPromptA);
      if (!validationA.success) {
        throw new Error(`Prompt A validation failed: ${validationA.error.message}`);
      }
      
      promptA = validationA.data;
      partial_prompt_a = promptA;

      // Evidence-Lock Pipeline (backend foundation, logged execution)
      try {
        logger.info("Running Evidence-Lock pipeline", { job_id, run_id, request_id });
        const evidenceLockResult = await runEvidenceLockPipeline(
          scriptText,
          promptA,
          request_id
        );
        
        logger.info("Evidence-Lock pipeline completed", {
          job_id,
          run_id,
          request_id,
          receiptCount: evidenceLockResult.stageA.receipts.length,
          summaryValid: evidenceLockResult.validation.valid,
          retryCount: evidenceLockResult.retryCount,
          usedFallback: evidenceLockResult.usedFallback,
        });

        // Log validation failures for monitoring
        if (!evidenceLockResult.validation.valid) {
          logger.warn("Evidence-Lock validation failures", {
            job_id,
            run_id,
            request_id,
            failures: JSON.stringify(evidenceLockResult.validation.failures.map(f => ({
              reason: f.reason,
              details: f.details,
            }))),
          });
        }

        // Store summary for persistence
        evidenceLockSummary = evidenceLockResult.stageB.summary;
      } catch (evidenceLockError) {
        // Evidence-Lock is non-blocking; log error but continue main pipeline
        logger.error("Evidence-Lock pipeline failed (non-blocking)", {
          job_id,
          run_id,
          request_id,
          error: evidenceLockError instanceof Error ? evidenceLockError.message : String(evidenceLockError),
        });
      }
    } catch (err) {
      console.error("=== PROMPT A FAILED ===");
      console.error("Error:", err);
      console.error("Error message:", err instanceof Error ? err.message : String(err));
      console.error("Stack:", err instanceof Error ? err.stack : "No stack");

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

    // Stage: Prompt B
    let promptB: PromptBOutput | undefined;
    try {
      // Real OpenAI call for Prompt B
      const promptBInput = {
        script: scriptText,
        analysis_a: promptA,
        config: tierConfig,
      };
      const rawPromptB = await callOpenAI(PROMPT_B_SYSTEM, promptBInput);
      
      // Validate Prompt B output
      const validationB = PromptBOutputSchema.safeParse(rawPromptB);
      if (!validationB.success) {
        throw new Error(`Prompt B validation failed: ${validationB.error.message}`);
      }
      
      promptB = validationB.data;
      partial_prompt_b = promptB;

      // Primary Fix #2: Enforce Prompt B issue_id references match Prompt A issue_candidates
      const allowedIssueIds = new Set(promptA.issue_candidates.map((c) => c.issue_id));
      const missingIssueIds: string[] = [];

      promptB.sections.whats_getting_in_the_way.forEach((item) => {
        if (!allowedIssueIds.has(item.issue_id)) {
          missingIssueIds.push(item.issue_id);
        }
      });

      promptB.sections.recommended_fixes.forEach((item) => {
        if (!allowedIssueIds.has(item.issue_id)) {
          if (!missingIssueIds.includes(item.issue_id)) {
            missingIssueIds.push(item.issue_id);
          }
        }
      });

      if (missingIssueIds.length > 0) {
        const errorObj = createErrorObject({
          code: "PROMPT_B_UNKNOWN_ISSUE_ID",
          message: "Prompt B includes unknown issue_id references",
          stage: "prompt_b",
          retryable: false,
          request_id: run_id,
          details: {
            missing_issue_ids: missingIssueIds,
            allowed_issue_ids_count: allowedIssueIds.size,
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
      console.error("=== PROMPT B FAILED ===");
      console.error("Error:", err);
      console.error("Error message:", err instanceof Error ? err.message : String(err));
      console.error("Stack:", err instanceof Error ? err.stack : "No stack");

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
      evidence_lock: evidenceLockSummary ? { summary: evidenceLockSummary } : undefined,
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
          output: validationResult.data as any,
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
