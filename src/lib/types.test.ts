import { describe, it, expect } from 'vitest';
import {
  CreateScriptSchema,
  CreateJobSchema,
  ErrorObjectSchema,
  TierConfigSchema,
  ScriptFingerprintSchema,
  ClassificationSchema,
  IssueLocationSchema,
  PeakMomentSchema,
  CharacterBalanceEntrySchema,
  CharacterBalanceSchema,
  RetentionRiskIndicatorSchema,
  RetentionRiskSchema,
  MetricsSchema,
  IssueEvidenceSchema,
  IssueCandidateSchema,
  PromptAOutputSchema,
  ComedyMetricsSnapshotSchema,
  ConcreteFixSchema,
  WhatsGettingInTheWaySchema,
  RecommendedFixSchema,
  PunchUpOptionSchema,
  PunchUpSuggestionSchema,
  RevisionPlanStepSchema,
  RevisionPlanSchema,
  HowToReviseSchema,
  PromptBSectionsSchema,
  PromptBOutputSchema,
  RunMetadataSchema,
  FinalOutputSchema,
} from './types';

describe('Schema Validation Tests', () => {
  describe('CreateScriptSchema', () => {
    it('should accept valid script text', () => {
      const validData = { text: 'A'.repeat(1000) };
      expect(() => CreateScriptSchema.parse(validData)).not.toThrow();
    });

    it('should reject empty text', () => {
      const invalidData = { text: '' };
      expect(() => CreateScriptSchema.parse(invalidData)).toThrow();
    });

    it('should reject text exceeding 100k characters', () => {
      const invalidData = { text: 'A'.repeat(100001) };
      expect(() => CreateScriptSchema.parse(invalidData)).toThrow();
    });

    it('should accept text at exactly 100k characters', () => {
      const validData = { text: 'A'.repeat(100000) };
      expect(() => CreateScriptSchema.parse(validData)).not.toThrow();
    });

    it('should accept text with minimum 1 character', () => {
      const validData = { text: 'A' };
      expect(() => CreateScriptSchema.parse(validData)).not.toThrow();
    });
  });

  describe('CreateJobSchema', () => {
    it('should accept valid UUID', () => {
      const validData = { script_id: '123e4567-e89b-12d3-a456-426614174000' };
      expect(() => CreateJobSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid UUID format', () => {
      const invalidData = { script_id: 'not-a-uuid' };
      expect(() => CreateJobSchema.parse(invalidData)).toThrow();
    });

    it('should reject empty string', () => {
      const invalidData = { script_id: '' };
      expect(() => CreateJobSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing script_id', () => {
      const invalidData = {};
      expect(() => CreateJobSchema.parse(invalidData)).toThrow();
    });
  });

  describe('ErrorObjectSchema', () => {
    it('should accept valid error object', () => {
      const validData = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        stage: 'input_validation',
        retryable: true,
        request_id: 'req-123',
        details: { field: 'text' },
      };
      expect(() => ErrorObjectSchema.parse(validData)).not.toThrow();
    });

    it('should reject empty code', () => {
      const invalidData = {
        code: '',
        message: 'Invalid input',
        stage: 'input_validation',
        retryable: true,
        request_id: 'req-123',
        details: {},
      };
      expect(() => ErrorObjectSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid stage', () => {
      const invalidData = {
        code: 'ERROR',
        message: 'Test',
        stage: 'invalid_stage',
        retryable: false,
        request_id: 'req-123',
        details: {},
      };
      expect(() => ErrorObjectSchema.parse(invalidData)).toThrow();
    });

    it('should accept all valid stages', () => {
      const stages = ['input_validation', 'prompt_a', 'prompt_a_validation', 'prompt_b', 'persistence'];

      stages.forEach(stage => {
        const validData = {
          code: 'ERROR',
          message: 'Test',
          stage,
          retryable: false,
          request_id: 'req-123',
          details: {},
        };
        expect(() => ErrorObjectSchema.parse(validData)).not.toThrow();
      });
    });

    it('should require retryable to be boolean', () => {
      const invalidData = {
        code: 'ERROR',
        message: 'Test',
        stage: 'prompt_a',
        retryable: 'yes',
        request_id: 'req-123',
        details: {},
      };
      expect(() => ErrorObjectSchema.parse(invalidData)).toThrow();
    });
  });

  describe('TierConfigSchema', () => {
    it('should accept valid tier config', () => {
      const validData = {
        depth_level: 'pro',
        max_issues: 5,
        punch_up_moments: 3,
        options_per_moment: 2,
        metrics_verbosity: 'interpretive',
        revision_guidance_level: 'time_boxed',
      };
      expect(() => TierConfigSchema.parse(validData)).not.toThrow();
    });

    it('should reject negative numbers', () => {
      const invalidData = {
        depth_level: 'pro',
        max_issues: -1,
        punch_up_moments: 3,
        options_per_moment: 2,
        metrics_verbosity: 'interpretive',
        revision_guidance_level: 'time_boxed',
      };
      expect(() => TierConfigSchema.parse(invalidData)).toThrow();
    });

    it('should reject non-integer numbers', () => {
      const invalidData = {
        depth_level: 'pro',
        max_issues: 5.5,
        punch_up_moments: 3,
        options_per_moment: 2,
        metrics_verbosity: 'interpretive',
        revision_guidance_level: 'time_boxed',
      };
      expect(() => TierConfigSchema.parse(invalidData)).toThrow();
    });

    it('should accept both depth levels', () => {
      const proData = {
        depth_level: 'pro',
        max_issues: 5,
        punch_up_moments: 3,
        options_per_moment: 2,
        metrics_verbosity: 'interpretive',
        revision_guidance_level: 'time_boxed',
      };
      const studioData = { ...proData, depth_level: 'studio' };

      expect(() => TierConfigSchema.parse(proData)).not.toThrow();
      expect(() => TierConfigSchema.parse(studioData)).not.toThrow();
    });
  });

  describe('ScriptFingerprintSchema', () => {
    it('should accept valid fingerprint', () => {
      const validData = {
        input_hash: 'abc123',
        word_count: 15000,
        estimated_pages: 60,
        inferred_format: 'feature',
        tier_compatibility: 'ok',
      };
      expect(() => ScriptFingerprintSchema.parse(validData)).not.toThrow();
    });

    it('should reject negative word count', () => {
      const invalidData = {
        input_hash: 'abc123',
        word_count: -100,
        estimated_pages: 60,
        inferred_format: 'feature',
        tier_compatibility: 'ok',
      };
      expect(() => ScriptFingerprintSchema.parse(invalidData)).toThrow();
    });

    it('should reject negative estimated pages', () => {
      const invalidData = {
        input_hash: 'abc123',
        word_count: 15000,
        estimated_pages: -5,
        inferred_format: 'feature',
        tier_compatibility: 'ok',
      };
      expect(() => ScriptFingerprintSchema.parse(invalidData)).toThrow();
    });

    it('should accept all valid formats', () => {
      const formats = ['scene', 'half_hour', 'hour', 'feature'];

      formats.forEach(format => {
        const validData = {
          input_hash: 'abc123',
          word_count: 15000,
          estimated_pages: 60,
          inferred_format: format,
          tier_compatibility: 'ok',
        };
        expect(() => ScriptFingerprintSchema.parse(validData)).not.toThrow();
      });
    });

    it('should accept all valid tier compatibilities', () => {
      const compatibilities = ['ok', 'too_short', 'too_long', 'unsupported_format'];

      compatibilities.forEach(compatibility => {
        const validData = {
          input_hash: 'abc123',
          word_count: 15000,
          estimated_pages: 60,
          inferred_format: 'feature',
          tier_compatibility: compatibility,
        };
        expect(() => ScriptFingerprintSchema.parse(validData)).not.toThrow();
      });
    });
  });

  describe('CharacterBalanceSchema', () => {
    it('should accept valid character balance', () => {
      const validData = {
        ensemble_balance: 0.75,
        dominant_character: 'Alice',
        characters: [
          { name: 'Alice', joke_share: 0.5, line_share: 0.4, underutilized: false },
          { name: 'Bob', joke_share: 0.3, line_share: 0.35, underutilized: false },
          { name: 'Charlie', joke_share: 0.2, line_share: 0.25, underutilized: true },
        ],
      };
      expect(() => CharacterBalanceSchema.parse(validData)).not.toThrow();
    });

    it('should reject ensemble_balance > 1', () => {
      const invalidData = {
        ensemble_balance: 1.5,
        dominant_character: 'Alice',
        characters: [],
      };
      expect(() => CharacterBalanceSchema.parse(invalidData)).toThrow();
    });

    it('should reject ensemble_balance < 0', () => {
      const invalidData = {
        ensemble_balance: -0.1,
        dominant_character: 'Alice',
        characters: [],
      };
      expect(() => CharacterBalanceSchema.parse(invalidData)).toThrow();
    });

    it('should reject joke_share > 1', () => {
      const invalidData = {
        ensemble_balance: 0.8,
        dominant_character: 'Alice',
        characters: [
          { name: 'Alice', joke_share: 1.5, line_share: 0.5, underutilized: false },
        ],
      };
      expect(() => CharacterBalanceSchema.parse(invalidData)).toThrow();
    });

    it('should accept boundary values 0 and 1', () => {
      const validData = {
        ensemble_balance: 1,
        dominant_character: 'Alice',
        characters: [
          { name: 'Alice', joke_share: 1, line_share: 1, underutilized: false },
          { name: 'Bob', joke_share: 0, line_share: 0, underutilized: true },
        ],
      };
      expect(() => CharacterBalanceSchema.parse(validData)).not.toThrow();
    });
  });

  describe('IssueLocationSchema', () => {
    it('should accept all valid location types', () => {
      const types = ['line_range', 'timecode_range', 'scene'];

      types.forEach(type => {
        const validData = { type, value: 'L10-L20' };
        expect(() => IssueLocationSchema.parse(validData)).not.toThrow();
      });
    });

    it('should reject invalid location type', () => {
      const invalidData = { type: 'invalid_type', value: 'L10-L20' };
      expect(() => IssueLocationSchema.parse(invalidData)).toThrow();
    });
  });

  describe('PeakMomentSchema', () => {
    it('should accept valid peak moment', () => {
      const validData = {
        moment_id: 'peak-1',
        label: 'Big reveal',
        location: { type: 'line_range', value: 'L100-L105' },
        reason_tag: 'setup_payoff',
      };
      expect(() => PeakMomentSchema.parse(validData)).not.toThrow();
    });

    it('should accept all valid reason tags', () => {
      const tags = ['setup_payoff', 'surprise', 'character', 'escalation', 'button', 'other'];

      tags.forEach(tag => {
        const validData = {
          moment_id: 'peak-1',
          label: 'Test',
          location: { type: 'line_range', value: 'L10-L20' },
          reason_tag: tag,
        };
        expect(() => PeakMomentSchema.parse(validData)).not.toThrow();
      });
    });
  });

  describe('RetentionRiskSchema', () => {
    it('should accept valid retention risk', () => {
      const validData = {
        overall_risk: 'medium',
        indicators: [
          {
            indicator_id: 'risk-1',
            type: 'gap_cluster',
            location: { type: 'line_range', value: 'L50-L100' },
            severity: 'moderate',
          },
        ],
      };
      expect(() => RetentionRiskSchema.parse(validData)).not.toThrow();
    });

    it('should accept all valid risk levels', () => {
      const levels = ['low', 'medium', 'high'];

      levels.forEach(level => {
        const validData = {
          overall_risk: level,
          indicators: [],
        };
        expect(() => RetentionRiskSchema.parse(validData)).not.toThrow();
      });
    });

    it('should accept all valid indicator types', () => {
      const types = ['gap_cluster', 'late_soft_end', 'repeat_escalation', 'low_surprise_run'];

      types.forEach(type => {
        const validData = {
          overall_risk: 'medium',
          indicators: [
            {
              indicator_id: 'risk-1',
              type,
              location: { type: 'line_range', value: 'L50-L100' },
              severity: 'moderate',
            },
          ],
        };
        expect(() => RetentionRiskSchema.parse(validData)).not.toThrow();
      });
    });

    it('should accept all valid severity levels', () => {
      const severities = ['minor', 'moderate', 'major'];

      severities.forEach(severity => {
        const validData = {
          overall_risk: 'medium',
          indicators: [
            {
              indicator_id: 'risk-1',
              type: 'gap_cluster',
              location: { type: 'line_range', value: 'L50-L100' },
              severity,
            },
          ],
        };
        expect(() => RetentionRiskSchema.parse(validData)).not.toThrow();
      });
    });
  });

  describe('MetricsSchema', () => {
    it('should accept valid metrics', () => {
      const validData = {
        overall_score: 75,
        lpm_intermediate_plus: 2.5,
        lines_per_joke: 5.5,
        peak_moments: [
          {
            moment_id: 'peak-1',
            label: 'Big reveal',
            location: { type: 'line_range', value: 'L100-L105' },
            reason_tag: 'setup_payoff',
          },
        ],
        character_balance: {
          ensemble_balance: 0.8,
          dominant_character: 'Alice',
          characters: [
            { name: 'Alice', joke_share: 0.6, line_share: 0.5, underutilized: false },
          ],
        },
        retention_risk: {
          overall_risk: 'low',
          indicators: [],
        },
      };
      expect(() => MetricsSchema.parse(validData)).not.toThrow();
    });

    it('should reject overall_score > 100', () => {
      const invalidData = {
        overall_score: 101,
        lpm_intermediate_plus: 2.5,
        lines_per_joke: 5.5,
        peak_moments: [],
        character_balance: {
          ensemble_balance: 0.8,
          dominant_character: 'Alice',
          characters: [],
        },
        retention_risk: { overall_risk: 'low', indicators: [] },
      };
      expect(() => MetricsSchema.parse(invalidData)).toThrow();
    });

    it('should reject overall_score < 0', () => {
      const invalidData = {
        overall_score: -1,
        lpm_intermediate_plus: 2.5,
        lines_per_joke: 5.5,
        peak_moments: [],
        character_balance: {
          ensemble_balance: 0.8,
          dominant_character: 'Alice',
          characters: [],
        },
        retention_risk: { overall_risk: 'low', indicators: [] },
      };
      expect(() => MetricsSchema.parse(invalidData)).toThrow();
    });

    it('should reject negative lpm_intermediate_plus', () => {
      const invalidData = {
        overall_score: 75,
        lpm_intermediate_plus: -1,
        lines_per_joke: 5.5,
        peak_moments: [],
        character_balance: {
          ensemble_balance: 0.8,
          dominant_character: 'Alice',
          characters: [],
        },
        retention_risk: { overall_risk: 'low', indicators: [] },
      };
      expect(() => MetricsSchema.parse(invalidData)).toThrow();
    });

    it('should accept boundary value 0', () => {
      const validData = {
        overall_score: 0,
        lpm_intermediate_plus: 0,
        lines_per_joke: 0,
        peak_moments: [],
        character_balance: {
          ensemble_balance: 0,
          dominant_character: 'None',
          characters: [],
        },
        retention_risk: { overall_risk: 'low', indicators: [] },
      };
      expect(() => MetricsSchema.parse(validData)).not.toThrow();
    });

    it('should accept boundary value 100', () => {
      const validData = {
        overall_score: 100,
        lpm_intermediate_plus: 10,
        lines_per_joke: 3,
        peak_moments: [],
        character_balance: {
          ensemble_balance: 1,
          dominant_character: 'Alice',
          characters: [],
        },
        retention_risk: { overall_risk: 'low', indicators: [] },
      };
      expect(() => MetricsSchema.parse(validData)).not.toThrow();
    });
  });

  describe('IssueEvidenceSchema', () => {
    it('should accept valid evidence', () => {
      const validData = {
        quote_snippet: 'This is a quote from the script',
        metric_refs: ['lpm', 'character_balance'],
      };
      expect(() => IssueEvidenceSchema.parse(validData)).not.toThrow();
    });

    it('should reject quote_snippet > 140 characters', () => {
      const invalidData = {
        quote_snippet: 'A'.repeat(141),
        metric_refs: [],
      };
      expect(() => IssueEvidenceSchema.parse(invalidData)).toThrow();
    });

    it('should accept quote_snippet at exactly 140 characters', () => {
      const validData = {
        quote_snippet: 'A'.repeat(140),
        metric_refs: [],
      };
      expect(() => IssueEvidenceSchema.parse(validData)).not.toThrow();
    });

    it('should accept empty metric_refs array', () => {
      const validData = {
        quote_snippet: 'Quote',
        metric_refs: [],
      };
      expect(() => IssueEvidenceSchema.parse(validData)).not.toThrow();
    });
  });

  describe('IssueCandidateSchema', () => {
    it('should accept valid issue candidate', () => {
      const validData = {
        issue_id: 'issue-1',
        type: 'pacing_soft_spot',
        location: { type: 'line_range', value: 'L50-L60' },
        severity: 'moderate',
        tags: ['pacing', 'late-act'],
        evidence: {
          quote_snippet: 'Example quote',
          metric_refs: ['lpm'],
        },
      };
      expect(() => IssueCandidateSchema.parse(validData)).not.toThrow();
    });

    it('should accept all valid issue types', () => {
      const types = [
        'pacing_soft_spot',
        'escalation_repeat',
        'surprise_decay',
        'button_weakness',
        'character_underutilization',
        'other',
      ];

      types.forEach(type => {
        const validData = {
          issue_id: 'issue-1',
          type,
          location: { type: 'line_range', value: 'L50-L60' },
          severity: 'moderate',
          tags: [],
          evidence: { quote_snippet: 'Quote', metric_refs: [] },
        };
        expect(() => IssueCandidateSchema.parse(validData)).not.toThrow();
      });
    });
  });

  describe('PromptAOutputSchema', () => {
    it('should accept valid Prompt A output', () => {
      const validData = {
        classification: {
          inferred_format: 'feature',
          word_count: 15000,
          estimated_pages: 60,
          tier_compatibility: 'ok',
        },
        metrics: {
          overall_score: 75,
          lpm_intermediate_plus: 2.5,
          lines_per_joke: 5.5,
          peak_moments: [],
          character_balance: {
            ensemble_balance: 0.8,
            dominant_character: 'Alice',
            characters: [],
          },
          retention_risk: { overall_risk: 'low', indicators: [] },
        },
        issue_candidates: [],
      };
      expect(() => PromptAOutputSchema.parse(validData)).not.toThrow();
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        classification: {
          inferred_format: 'feature',
          word_count: 15000,
          estimated_pages: 60,
          tier_compatibility: 'ok',
        },
        // Missing metrics
      };
      expect(() => PromptAOutputSchema.parse(invalidData)).toThrow();
    });
  });

  describe('PromptBOutputSchema', () => {
    it('should accept valid Prompt B output', () => {
      const validData = {
        sections: {
          comedy_metrics_snapshot: {
            bullets: ['Strong setup/payoff', 'Good character balance'],
            notes: 'Overall solid script',
          },
          strengths_to_preserve: ['Character dynamics', 'Setup structure'],
          whats_getting_in_the_way: [
            {
              issue_id: 'issue-1',
              why_it_matters: 'Pacing suffers in Act 2',
              concrete_fix: {
                title: 'Add more jokes in middle section',
                steps: ['Identify gaps', 'Add 3-5 jokes'],
                expected_result: 'Better pacing',
              },
            },
          ],
          recommended_fixes: [
            { issue_id: 'issue-1', fix: 'Add jokes at lines 50-60' },
          ],
          punch_up_suggestions: [
            {
              moment_id: 'peak-1',
              moment_context: 'The big reveal scene',
              options: [
                { option_id: 'opt-1', device: 'Surprise', text: 'Alternative line 1' },
                { option_id: 'opt-2', device: 'Callback', text: 'Alternative line 2' },
              ],
            },
          ],
          how_to_revise_this_efficiently: {
            revision_plan: {
              mode: 'time_boxed',
              steps: [
                { step: 'Review Act 2', timebox_minutes: 30 },
                { step: 'Add jokes', timebox_minutes: 60 },
              ],
            },
          },
        },
      };
      expect(() => PromptBOutputSchema.parse(validData)).not.toThrow();
    });

    it('should accept optional notes in comedy_metrics_snapshot', () => {
      const validData = {
        sections: {
          comedy_metrics_snapshot: {
            bullets: ['Point 1'],
          },
          strengths_to_preserve: [],
          whats_getting_in_the_way: [],
          recommended_fixes: [],
          punch_up_suggestions: [],
          how_to_revise_this_efficiently: {
            revision_plan: {
              mode: 'multi_pass',
              steps: [],
            },
          },
        },
      };
      expect(() => PromptBOutputSchema.parse(validData)).not.toThrow();
    });

    it('should accept both revision plan modes', () => {
      const timeBoxedData = {
        sections: {
          comedy_metrics_snapshot: { bullets: [] },
          strengths_to_preserve: [],
          whats_getting_in_the_way: [],
          recommended_fixes: [],
          punch_up_suggestions: [],
          how_to_revise_this_efficiently: {
            revision_plan: {
              mode: 'time_boxed',
              steps: [{ step: 'Review', timebox_minutes: 30 }],
            },
          },
        },
      };

      const multiPassData = {
        sections: {
          comedy_metrics_snapshot: { bullets: [] },
          strengths_to_preserve: [],
          whats_getting_in_the_way: [],
          recommended_fixes: [],
          punch_up_suggestions: [],
          how_to_revise_this_efficiently: {
            revision_plan: {
              mode: 'multi_pass',
              steps: [{ step: 'Pass 1', pass: 'character' }],
            },
          },
        },
      };

      expect(() => PromptBOutputSchema.parse(timeBoxedData)).not.toThrow();
      expect(() => PromptBOutputSchema.parse(multiPassData)).not.toThrow();
    });

    it('should reject negative timebox_minutes', () => {
      const invalidData = {
        sections: {
          comedy_metrics_snapshot: { bullets: [] },
          strengths_to_preserve: [],
          whats_getting_in_the_way: [],
          recommended_fixes: [],
          punch_up_suggestions: [],
          how_to_revise_this_efficiently: {
            revision_plan: {
              mode: 'time_boxed',
              steps: [{ step: 'Review', timebox_minutes: -30 }],
            },
          },
        },
      };
      expect(() => PromptBOutputSchema.parse(invalidData)).toThrow();
    });
  });

  describe('RunMetadataSchema', () => {
    it('should accept valid run metadata', () => {
      const validData = {
        run_id: '123e4567-e89b-12d3-a456-426614174000',
        created_at: '2024-01-01T12:00:00Z',
        tier_config: {
          depth_level: 'pro',
          max_issues: 5,
          punch_up_moments: 3,
          options_per_moment: 2,
          metrics_verbosity: 'interpretive',
          revision_guidance_level: 'time_boxed',
        },
        script_fingerprint: {
          input_hash: 'abc123',
          word_count: 15000,
          estimated_pages: 60,
          inferred_format: 'feature',
          tier_compatibility: 'ok',
        },
      };
      expect(() => RunMetadataSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid UUID for run_id', () => {
      const invalidData = {
        run_id: 'not-a-uuid',
        created_at: '2024-01-01T12:00:00Z',
        tier_config: {
          depth_level: 'pro',
          max_issues: 5,
          punch_up_moments: 3,
          options_per_moment: 2,
          metrics_verbosity: 'interpretive',
          revision_guidance_level: 'time_boxed',
        },
        script_fingerprint: {
          input_hash: 'abc123',
          word_count: 15000,
          estimated_pages: 60,
          inferred_format: 'feature',
          tier_compatibility: 'ok',
        },
      };
      expect(() => RunMetadataSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid datetime format', () => {
      const invalidData = {
        run_id: '123e4567-e89b-12d3-a456-426614174000',
        created_at: '2024-01-01 12:00:00', // Invalid format
        tier_config: {
          depth_level: 'pro',
          max_issues: 5,
          punch_up_moments: 3,
          options_per_moment: 2,
          metrics_verbosity: 'interpretive',
          revision_guidance_level: 'time_boxed',
        },
        script_fingerprint: {
          input_hash: 'abc123',
          word_count: 15000,
          estimated_pages: 60,
          inferred_format: 'feature',
          tier_compatibility: 'ok',
        },
      };
      expect(() => RunMetadataSchema.parse(invalidData)).toThrow();
    });
  });

  describe('FinalOutputSchema', () => {
    it('should accept valid final output with all fields', () => {
      const validData = {
        schema_version: '1.0.0',
        run: {
          run_id: '123e4567-e89b-12d3-a456-426614174000',
          created_at: '2024-01-01T12:00:00Z',
          tier_config: {
            depth_level: 'pro',
            max_issues: 5,
            punch_up_moments: 3,
            options_per_moment: 2,
            metrics_verbosity: 'interpretive',
            revision_guidance_level: 'time_boxed',
          },
          script_fingerprint: {
            input_hash: 'abc123',
            word_count: 15000,
            estimated_pages: 60,
            inferred_format: 'feature',
            tier_compatibility: 'ok',
          },
        },
        prompt_a: {
          classification: {
            inferred_format: 'feature',
            word_count: 15000,
            estimated_pages: 60,
            tier_compatibility: 'ok',
          },
          metrics: {
            overall_score: 75,
            lpm_intermediate_plus: 2.5,
            lines_per_joke: 5.5,
            peak_moments: [],
            character_balance: {
              ensemble_balance: 0.8,
              dominant_character: 'Alice',
              characters: [],
            },
            retention_risk: { overall_risk: 'low', indicators: [] },
          },
          issue_candidates: [],
        },
        prompt_b: {
          sections: {
            comedy_metrics_snapshot: { bullets: [] },
            strengths_to_preserve: [],
            whats_getting_in_the_way: [],
            recommended_fixes: [],
            punch_up_suggestions: [],
            how_to_revise_this_efficiently: {
              revision_plan: { mode: 'time_boxed', steps: [] },
            },
          },
        },
        errors: [],
        warnings: [],
      };
      expect(() => FinalOutputSchema.parse(validData)).not.toThrow();
    });

    it('should accept minimal valid final output', () => {
      const validData = {
        schema_version: '1.0.0',
        run: {
          run_id: '123e4567-e89b-12d3-a456-426614174000',
          created_at: '2024-01-01T12:00:00Z',
          tier_config: {
            depth_level: 'pro',
            max_issues: 5,
            punch_up_moments: 3,
            options_per_moment: 2,
            metrics_verbosity: 'interpretive',
            revision_guidance_level: 'time_boxed',
          },
          script_fingerprint: {
            input_hash: 'abc123',
            word_count: 15000,
            estimated_pages: 60,
            inferred_format: 'feature',
            tier_compatibility: 'ok',
          },
        },
      };
      expect(() => FinalOutputSchema.parse(validData)).not.toThrow();
    });

    it('should reject incorrect schema_version', () => {
      const invalidData = {
        schema_version: '2.0.0', // Must be exactly "1.0.0"
        run: {
          run_id: '123e4567-e89b-12d3-a456-426614174000',
          created_at: '2024-01-01T12:00:00Z',
          tier_config: {
            depth_level: 'pro',
            max_issues: 5,
            punch_up_moments: 3,
            options_per_moment: 2,
            metrics_verbosity: 'interpretive',
            revision_guidance_level: 'time_boxed',
          },
          script_fingerprint: {
            input_hash: 'abc123',
            word_count: 15000,
            estimated_pages: 60,
            inferred_format: 'feature',
            tier_compatibility: 'ok',
          },
        },
      };
      expect(() => FinalOutputSchema.parse(invalidData)).toThrow();
    });

    it('should accept output with errors but no prompt_a/prompt_b', () => {
      const validData = {
        schema_version: '1.0.0',
        run: {
          run_id: '123e4567-e89b-12d3-a456-426614174000',
          created_at: '2024-01-01T12:00:00Z',
          tier_config: {
            depth_level: 'pro',
            max_issues: 5,
            punch_up_moments: 3,
            options_per_moment: 2,
            metrics_verbosity: 'interpretive',
            revision_guidance_level: 'time_boxed',
          },
          script_fingerprint: {
            input_hash: 'abc123',
            word_count: 15000,
            estimated_pages: 60,
            inferred_format: 'feature',
            tier_compatibility: 'ok',
          },
        },
        errors: [
          {
            code: 'LLM_ERROR',
            message: 'LLM failed',
            stage: 'prompt_a',
            retryable: true,
            request_id: 'req-123',
            details: {},
          },
        ],
      };
      expect(() => FinalOutputSchema.parse(validData)).not.toThrow();
    });

    it('should reject missing run field', () => {
      const invalidData = {
        schema_version: '1.0.0',
        // Missing run
      };
      expect(() => FinalOutputSchema.parse(invalidData)).toThrow();
    });
  });
});
