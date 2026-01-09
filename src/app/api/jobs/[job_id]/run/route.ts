import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
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
import { PROMPT_A_SYSTEM, PROMPT_B_SYSTEM } from "@/lib/prompts";
import { callOpenAI } from "@/lib/openai";
import { createErrorObject, errorResponse, generateRequestId } from "@/lib/api-errors";
import logger from "@/lib/logger";

// Required for Prisma on Vercel serverless
export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{ job_id: string }>;
};

/**
 * Normalize script text for hashing/fingerprinting.
 * SECURITY: Never log this normalized text.
 */
function normalizeForHash(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function computeInputHash(text: string): string {
  const normalized = normalizeForHash(text);
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

function countWords(text: string): number {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) return 0;
  return normalized.split(/\s+/).filter(Boolean).length;
}

function estimatePages(wordCount: number): number {
  // Practical approximation: ~250 words per page, min 0.5
  return Math.max(0.5, Math.round((wordCount / 250) * 10) / 10);
}

function inferFormat(wordCount: number, estimatedPages: number): ScriptFingerprint["inferred_format"] {
  if (estimatedPages <= 8 || wordCount < 2000) return "scene";
  if (estimatedPages <= 45) return "half_hour";
  if (estimatedPages <= 75) return "hour";
  return "feature";
}

function tierCompatibility(
  inferred: ScriptFingerprint["inferred_format"],
  wordCount: number
): ScriptFingerprint["tier_compatibility"] {
  const ranges: Record<ScriptFingerprint["inferred_format"], { min: number; max: number }> = {
    scene: { min: 200, max: 6000 },
    half_hour: { min: 2500, max: 15000 },
    hour: { min: 5000, max: 25000 },
    feature: { min: 10000, max: 50000 },
  };

  const r = ranges[inferred];
  if (wordCount < r.min) return "too_short";
  if (wordCount > r.max) return "too_long";
  return "ok";
}

function computeScriptFingerprint(text: string): ScriptFingerprint {
  const wc = countWords(text);
  const pages = estimatePages(wc);
  const inferred = inferFormat(wc, pages);

  return {
    input_hash: computeInputHash(text),
    word_count: wc,
    estimated_pages: pages,
    inferred_format: inferred,
    tier_compatibility: tierCompatibility(inferred, wc),
  };
}

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
