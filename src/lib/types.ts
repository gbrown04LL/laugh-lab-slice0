import { z } from "zod";

// ============================================================================
// Constants
// ============================================================================

export const STUB_USER_ID = "test-user-1";
export const SCHEMA_VERSION = "1.0.0";

// ============================================================================
// Request Schemas
// ============================================================================

export const CreateScriptSchema = z.object({
  text: z
    .string()
    .min(1, "Script text is required")
    .max(100000, "Script text too long"),
});

export const CreateJobSchema = z.object({
  script_id: z.string().uuid("Invalid script_id format"),
});

// ============================================================================
// Truth Contract (Laugh Lab V1) — Core Enums
// ============================================================================

export const AnalysisStage = z.enum([
  "input_validation",
  "prompt_a",
  "prompt_a_validation",
  "prompt_b",
  "persistence",
]);

export const DepthLevel = z.enum(["pro", "studio"]);
export const MetricsVerbosity = z.enum(["interpretive", "macro"]);
export const RevisionGuidanceLevel = z.enum(["time_boxed", "multi_pass"]);

export const InferredFormat = z.enum(["scene", "half_hour", "hour", "feature"]);
export const TierCompatibility = z.enum([
  "ok",
  "too_short",
  "too_long",
  "unsupported_format",
]);

export const LocationType = z.enum(["line_range", "timecode_range", "scene"]);
export const Severity = z.enum(["minor", "moderate", "major"]);

export const PeakReasonTag = z.enum([
  "setup_payoff",
  "surprise",
  "character",
  "escalation",
  "button",
  "other",
]);

export const RetentionRiskLevel = z.enum(["low", "medium", "high"]);
export const RetentionIndicatorType = z.enum([
  "gap_cluster",
  "late_soft_end",
  "repeat_escalation",
  "low_surprise_run",
]);

export const IssueType = z.enum([
  "pacing_soft_spot",
  "escalation_repeat",
  "surprise_decay",
  "button_weakness",
  "character_underutilization",
  "other",
]);

// ============================================================================
// Truth Contract Error Schema
// ============================================================================

export const ErrorObjectSchema = z.object({
  code: z.string().min(1),
  message: z.string(),
  stage: AnalysisStage,
  retryable: z.boolean(),
  request_id: z.string(),
  details: z.record(z.string(), z.unknown()),
});

// ============================================================================
// Truth Contract Tier Config + Script Fingerprint
// ============================================================================

export const TierConfigSchema = z.object({
  depth_level: DepthLevel,
  max_issues: z.number().int().nonnegative(),
  punch_up_moments: z.number().int().nonnegative(),
  options_per_moment: z.number().int().nonnegative(),
  metrics_verbosity: MetricsVerbosity,
  revision_guidance_level: RevisionGuidanceLevel,
});

export const ScriptFingerprintSchema = z.object({
  input_hash: z.string(),
  word_count: z.number().int().nonnegative(),
  estimated_pages: z.number().nonnegative(),
  inferred_format: InferredFormat,
  tier_compatibility: TierCompatibility,
});

export const ClassificationSchema = z.object({
  inferred_format: InferredFormat,
  word_count: z.number().int().nonnegative(),
  estimated_pages: z.number().nonnegative(),
  tier_compatibility: TierCompatibility,
});

// ============================================================================
// Truth Contract Prompt A Schema
// ============================================================================

export const IssueLocationSchema = z.object({
  type: LocationType,
  value: z.string(),
});

export const PeakMomentSchema = z.object({
  moment_id: z.string(),
  label: z.string(),
  location: IssueLocationSchema,
  reason_tag: PeakReasonTag,
});

export const CharacterBalanceEntrySchema = z.object({
  name: z.string(),
  joke_share: z.number().min(0).max(1),
  line_share: z.number().min(0).max(1),
  underutilized: z.boolean(),
});

export const CharacterBalanceSchema = z.object({
  ensemble_balance: z.number().min(0).max(1),
  dominant_character: z.string(),
  characters: z.array(CharacterBalanceEntrySchema),
});

export const RetentionRiskIndicatorSchema = z.object({
  indicator_id: z.string(),
  type: RetentionIndicatorType,
  location: IssueLocationSchema,
  severity: Severity,
});

export const RetentionRiskSchema = z.object({
  overall_risk: RetentionRiskLevel,
  indicators: z.array(RetentionRiskIndicatorSchema),
});

export const MetricsSchema = z.object({
  overall_score: z.number().min(0).max(100),
  lpm_intermediate_plus: z.number().nonnegative(),
  lines_per_joke: z.number().nonnegative(),
  peak_moments: z.array(PeakMomentSchema),
  character_balance: CharacterBalanceSchema,
  retention_risk: RetentionRiskSchema,
});

export const IssueEvidenceSchema = z.object({
  quote_snippet: z.string().max(140),
  metric_refs: z.array(z.string()),
});

export const IssueCandidateSchema = z.object({
  issue_id: z.string(),
  type: IssueType,
  location: IssueLocationSchema,
  severity: Severity,
  tags: z.array(z.string()),
  evidence: IssueEvidenceSchema,
});

export const PromptAOutputSchema = z.object({
  classification: ClassificationSchema,
  metrics: MetricsSchema,
  issue_candidates: z.array(IssueCandidateSchema),
});

// ============================================================================
// Truth Contract Prompt B Schema
// ============================================================================

export const ComedyMetricsSnapshotSchema = z.object({
  bullets: z.array(z.string()),
  notes: z.string().optional(),
});

export const ConcreteFixSchema = z.object({
  title: z.string(),
  steps: z.array(z.string()),
  expected_result: z.string(),
});

export const WhatsGettingInTheWaySchema = z.object({
  issue_id: z.string(),
  why_it_matters: z.string(),
  concrete_fix: ConcreteFixSchema,
});

export const RecommendedFixSchema = z.object({
  issue_id: z.string(),
  fix: z.string(),
});

export const PunchUpOptionSchema = z.object({
  option_id: z.string(),
  device: z.string(),
  text: z.string(),
});

export const PunchUpSuggestionSchema = z.object({
  moment_id: z.string(),
  moment_context: z.string(),
  options: z.array(PunchUpOptionSchema),
});

export const RevisionPlanStepSchema = z.object({
  step: z.string(),
  timebox_minutes: z.number().int().positive().optional(),
  pass: z.string().optional(),
});

export const RevisionPlanSchema = z.object({
  mode: z.enum(["time_boxed", "multi_pass"]),
  steps: z.array(RevisionPlanStepSchema),
});

export const HowToReviseSchema = z.object({
  revision_plan: RevisionPlanSchema,
});

export const PromptBSectionsSchema = z.object({
  comedy_metrics_snapshot: ComedyMetricsSnapshotSchema,
  strengths_to_preserve: z.array(z.string()),
  whats_getting_in_the_way: z.array(WhatsGettingInTheWaySchema),
  recommended_fixes: z.array(RecommendedFixSchema),
  punch_up_suggestions: z.array(PunchUpSuggestionSchema),
  how_to_revise_this_efficiently: HowToReviseSchema,
});

export const PromptBOutputSchema = z.object({
  sections: PromptBSectionsSchema,
});

// ============================================================================
// Final Output Schema
// ============================================================================

export const RunMetadataSchema = z.object({
  run_id: z.string().uuid(),
  created_at: z.string().datetime(),
  tier_config: TierConfigSchema,
  script_fingerprint: ScriptFingerprintSchema,
});

export const FinalOutputSchema = z.object({
  schema_version: z.literal("1.0.0"),
  run: RunMetadataSchema,
  prompt_a: PromptAOutputSchema.optional(),
  prompt_b: PromptBOutputSchema.optional(),
  errors: z.array(ErrorObjectSchema).optional(),
  warnings: z.array(z.string()).optional(),
});

// ============================================================================
// TypeScript Types
// ============================================================================

export type ErrorObject = z.infer<typeof ErrorObjectSchema>;
export type AnalysisStageType = z.infer<typeof AnalysisStage>;

export type TierConfig = z.infer<typeof TierConfigSchema>;
export type DepthLevelType = z.infer<typeof DepthLevel>;
export type MetricsVerbosityType = z.infer<typeof MetricsVerbosity>;
export type RevisionGuidanceLevelType = z.infer<typeof RevisionGuidanceLevel>;

export type InferredFormatType = z.infer<typeof InferredFormat>;
export type TierCompatibilityType = z.infer<typeof TierCompatibility>;

export type ScriptFingerprint = z.infer<typeof ScriptFingerprintSchema>;
export type Classification = z.infer<typeof ClassificationSchema>;
export type IssueLocation = z.infer<typeof IssueLocationSchema>;

export type PeakMoment = z.infer<typeof PeakMomentSchema>;
export type CharacterBalance = z.infer<typeof CharacterBalanceSchema>;
export type RetentionRisk = z.infer<typeof RetentionRiskSchema>;
export type IssueCandidate = z.infer<typeof IssueCandidateSchema>;

export type PromptAOutput = z.infer<typeof PromptAOutputSchema>;
export type PromptBOutput = z.infer<typeof PromptBOutputSchema>;
export type PromptBSections = z.infer<typeof PromptBSectionsSchema>;

export type ComedyMetricsSnapshot = z.infer<typeof ComedyMetricsSnapshotSchema>;
export type WhatsGettingInTheWay = z.infer<typeof WhatsGettingInTheWaySchema>;
export type ConcreteFix = z.infer<typeof ConcreteFixSchema>;
export type RecommendedFix = z.infer<typeof RecommendedFixSchema>;
export type PunchUpSuggestion = z.infer<typeof PunchUpSuggestionSchema>;
export type PunchUpOption = z.infer<typeof PunchUpOptionSchema>;
export type RevisionPlan = z.infer<typeof RevisionPlanSchema>;

export type FinalOutput = z.infer<typeof FinalOutputSchema>;

// ============================================================================
// API Response Types (minimal; Slice-0 stubbed user)
// ============================================================================

export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface ScriptResponse {
  id: string;
  user_id: string;
  created_at: string;
}

export interface JobResponse {
  id: string;
  script_id: string;
  user_id: string;
  status: JobStatus;
  run_id: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface RunResponse {
  job_id: string;
  run_id: string;
  status: JobStatus;
  already_completed: boolean;
}

export interface ReportResponse {
  id: string;
  job_id: string;
  schema_version: string;
  output: FinalOutput;
  created_at: string;
}

export interface ApiErrorResponse {
  errors: ErrorObject[];
}
