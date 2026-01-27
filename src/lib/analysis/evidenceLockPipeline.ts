import { callOpenAI } from "@/lib/openai";
import { buildStageAPrompt } from "@/lib/prompts/stageA_receipts";
import { buildStageBPrompt } from "@/lib/prompts/stageB_summary";
import {
  StageAOutputSchema,
  StageBOutputSchema,
  type StageAInput,
  type StageAOutput,
  type StageBOutput,
  type EvidenceLockResult,
} from "@/lib/schemas/receipt";
import {
  validateSummary,
  generateFallbackSummary,
} from "@/lib/validators/summaryValidator";
import logger from "@/lib/logger";
import type { PromptAOutput } from "@/lib/types";

/**
 * Evidence-Lock Pipeline Runner
 *
 * Executes the two-stage Evidence-Lock pipeline:
 * 1. Stage A: Extract 10-15 receipts (evidence-locked observations)
 * 2. Stage B: Generate 3-paragraph summary citing only approved receipts
 * 3. Validation: Ensure Stage B only cites approved receipts
 * 4. Retry: If validation fails, retry Stage B once
 * 5. Fallback: If still fails, generate template summary
 *
 * This pipeline is backend-only and does not modify UI.
 */
export async function runEvidenceLockPipeline(
  scriptText: string,
  promptAOutput: PromptAOutput,
  requestId: string
): Promise<EvidenceLockResult> {
  logger.info("Starting Evidence-Lock pipeline", { requestId });

  // Prepare Stage A input
  const stageAInput: StageAInput = {
    script_text: scriptText,
    jokesByLine: promptAOutput.issue_candidates.map((ic) => {
      // Extract line numbers from location values
      const match = ic.location.value.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    }),
    characters: promptAOutput.metrics.character_balance.characters.map(
      (c) => c.name
    ),
    metrics_snapshot: promptAOutput.metrics,
  };

  // ========================================================================
  // STAGE A: Receipt Extraction
  // ========================================================================
  logger.info("Running Stage A: Receipt Extraction", { requestId });

  const stageAPrompt = buildStageAPrompt(stageAInput);
  const rawStageA = await callOpenAI(stageAPrompt, "");

  // Parse and validate Stage A output
  const stageAValidation = StageAOutputSchema.safeParse(rawStageA);
  if (!stageAValidation.success) {
    logger.error("Stage A validation failed", {
      requestId,
      error: stageAValidation.error.message,
    });
    throw new Error(`Stage A validation failed: ${stageAValidation.error.message}`);
  }

  const stageAOutput: StageAOutput = stageAValidation.data;
  logger.info("Stage A completed", {
    requestId,
    receiptCount: stageAOutput.receipts.length,
    formatType: stageAOutput.formatType,
  });

  // ========================================================================
  // STAGE B: Executive Summary (with validation and retry)
  // ========================================================================
  logger.info("Running Stage B: Executive Summary", { requestId });

  const stageBInput = {
    formatType: stageAOutput.formatType,
    metrics: stageAOutput.metrics,
    receipts: stageAOutput.receipts,
  };

  let stageBOutput: StageBOutput | null = null;
  let validationResult = null;
  let retryCount = 0;
  let usedFallback = false;

  // First attempt
  try {
    const stageBPrompt = buildStageBPrompt(stageBInput);
    const rawStageB = await callOpenAI(stageBPrompt, "");

    const stageBValidation = StageBOutputSchema.safeParse(rawStageB);
    if (!stageBValidation.success) {
      throw new Error(`Stage B parsing failed: ${stageBValidation.error.message}`);
    }

    stageBOutput = stageBValidation.data;

    // Validate summary
    validationResult = validateSummary(
      stageBOutput.summary,
      stageAOutput.receipts
    );

    if (!validationResult.valid) {
      logger.warn("Stage B validation failed (attempt 1)", {
        requestId,
        failures: validationResult.failures,
      });

      // Retry once
      retryCount = 1;
      logger.info("Retrying Stage B", { requestId });

      const retryStageB = await callOpenAI(stageBPrompt, "");
      const retryStageBValidation = StageBOutputSchema.safeParse(retryStageB);

      if (!retryStageBValidation.success) {
        throw new Error(
          `Stage B retry parsing failed: ${retryStageBValidation.error.message}`
        );
      }

      stageBOutput = retryStageBValidation.data;
      validationResult = validateSummary(
        stageBOutput.summary,
        stageAOutput.receipts
      );

      if (!validationResult.valid) {
        logger.warn("Stage B validation failed (attempt 2), using fallback", {
          requestId,
          failures: validationResult.failures,
        });

        // Use fallback
        usedFallback = true;
        const fallbackSummary = generateFallbackSummary(
          {
            overall_score: stageAOutput.metrics.overall_score,
            lpm_intermediate_plus: stageAOutput.metrics.lpm_intermediate_plus,
            lines_per_joke: stageAOutput.metrics.lines_per_joke,
            retention_risk: stageAOutput.metrics.retention_risk,
          },
          stageAOutput.receipts
        );

        stageBOutput = { summary: fallbackSummary };
        validationResult = validateSummary(
          stageBOutput.summary,
          stageAOutput.receipts
        );
      }
    }
  } catch (error) {
    logger.error("Stage B failed, using fallback", {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    // Use fallback on any error
    usedFallback = true;
    const fallbackSummary = generateFallbackSummary(
      {
        overall_score: stageAOutput.metrics.overall_score,
        lpm_intermediate_plus: stageAOutput.metrics.lpm_intermediate_plus,
        lines_per_joke: stageAOutput.metrics.lines_per_joke,
        retention_risk: stageAOutput.metrics.retention_risk,
      },
      stageAOutput.receipts
    );

    stageBOutput = { summary: fallbackSummary };
    validationResult = validateSummary(
      stageBOutput.summary,
      stageAOutput.receipts
    );
  }

  logger.info("Evidence-Lock pipeline completed", {
    requestId,
    retryCount,
    usedFallback,
    validationPassed: validationResult.valid,
  });

  // Log validation failures for monitoring
  if (!validationResult.valid) {
    logger.error("Evidence-Lock validation failed even with fallback", {
      requestId,
      failures: validationResult.failures,
    });
  }

  return {
    stageA: stageAOutput,
    stageB: stageBOutput,
    validation: validationResult,
    retryCount,
    usedFallback,
  };
}
