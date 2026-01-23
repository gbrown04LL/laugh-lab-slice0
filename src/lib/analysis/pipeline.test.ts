import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { runAnalysisPipeline, PipelineProgress } from './pipeline';
import * as openaiClient from '../llm/openai-client';
import {
  mockPromptABasic,
  mockPromptANoJokes,
  mockPromptAHighComplexity,
} from '@/__tests__/fixtures/promptA-outputs';
import {
  mockPromptBBasic,
  mockPromptBError,
  mockPromptBHighScore,
} from '@/__tests__/fixtures/promptB-outputs';
import {
  createMockLLMSuccess,
  createMockLLMError,
  createSequentialMockLLM,
  createFailingMockLLM,
} from '@/__tests__/mocks/llm';

// Mock the openai-client module
vi.mock('../llm/openai-client', () => ({
  callLLM: vi.fn(),
}));

describe('Analysis Pipeline', () => {
  const mockCallLLM = openaiClient.callLLM as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Successful Pipeline Execution', () => {
    it('should complete full pipeline successfully', async () => {
      // Setup: Mock both LLM calls to succeed
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptBBasic));

      const result = await runAnalysisPipeline(
        'Sample script text',
        'sitcom',
        'Test Script'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.title).toBe('Test Script');
        expect(result.data.format).toBe('sitcom');
        expect(result.data.scriptStats).toEqual(mockPromptABasic.scriptStats);
        expect(result.data.jokes).toEqual(mockPromptABasic.jokes);
        expect(result.data.scores).toBeDefined();
        expect(result.data.feedback).toEqual(mockPromptBBasic);
        expect(result.data.timeline).toBeDefined();
        expect(result.data.id).toBeDefined();
        expect(result.data.timestamp).toBeDefined();
      }
    });

    it('should call LLM twice (Prompt A and Prompt B)', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptBBasic));

      await runAnalysisPipeline('Sample script', 'sitcom', 'Test');

      expect(mockCallLLM).toHaveBeenCalledTimes(2);

      // Verify Prompt A call
      expect(mockCallLLM).toHaveBeenNthCalledWith(
        1,
        expect.any(String), // PROMPT_A_SYSTEM
        'Sample script',
        { responseFormat: 'json', temperature: 0.2, maxTokens: 8000 }
      );

      // Verify Prompt B call
      expect(mockCallLLM).toHaveBeenNthCalledWith(
        2,
        expect.any(String), // PROMPT_B_SYSTEM
        expect.any(String), // JSON string with scores
        { responseFormat: 'json', temperature: 0.7, maxTokens: 4000 }
      );
    });

    it('should handle different script formats', async () => {
      const formats = ['sitcom', 'feature', 'sketch', 'standup', 'auto'] as const;

      for (const format of formats) {
        mockCallLLM
          .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
          .mockResolvedValueOnce(createMockLLMSuccess(mockPromptBBasic));

        const result = await runAnalysisPipeline('Script', format, 'Test');

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.format).toBe(format);
        }

        vi.clearAllMocks();
      }
    });

    it('should default to "auto" format when not specified', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptBBasic));

      const result = await runAnalysisPipeline('Script');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.format).toBe('auto');
      }
    });

    it('should default to "Untitled Script" when title not provided', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptBBasic));

      const result = await runAnalysisPipeline('Script');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Untitled Script');
      }
    });

    it('should generate valid UUID for result id', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptBBasic));

      const result = await runAnalysisPipeline('Script', 'sitcom', 'Test');

      expect(result.success).toBe(true);
      if (result.success) {
        // UUID v4 regex
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(result.data.id).toMatch(uuidRegex);
      }
    });

    it('should generate valid ISO timestamp', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptBBasic));

      const result = await runAnalysisPipeline('Script', 'sitcom', 'Test');

      expect(result.success).toBe(true);
      if (result.success) {
        const timestamp = new Date(result.data.timestamp);
        expect(timestamp.toISOString()).toBe(result.data.timestamp);
        expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
      }
    });
  });

  describe('Progress Callbacks', () => {
    it('should call progress callback at each stage', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptBBasic));

      const progressUpdates: PipelineProgress[] = [];
      const onProgress = (progress: PipelineProgress) => {
        progressUpdates.push(progress);
      };

      await runAnalysisPipeline('Script', 'sitcom', 'Test', onProgress);

      expect(progressUpdates.length).toBeGreaterThan(0);

      // Verify we get updates for all stages
      const stages = progressUpdates.map((p) => p.stage);
      expect(stages).toContain('extracting');
      expect(stages).toContain('scoring');
      expect(stages).toContain('coaching');
      expect(stages).toContain('complete');
    });

    it('should report progress with correct percentages', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptBBasic));

      const progressUpdates: PipelineProgress[] = [];
      const onProgress = (progress: PipelineProgress) => {
        progressUpdates.push(progress);
      };

      await runAnalysisPipeline('Script', 'sitcom', 'Test', onProgress);

      // Progress should be monotonically increasing (except error stage)
      for (let i = 1; i < progressUpdates.length; i++) {
        if (progressUpdates[i].stage !== 'error') {
          expect(progressUpdates[i].percent).toBeGreaterThanOrEqual(
            progressUpdates[i - 1].percent
          );
        }
      }

      // Last progress should be 100%
      const lastProgress = progressUpdates[progressUpdates.length - 1];
      expect(lastProgress.percent).toBe(100);
      expect(lastProgress.stage).toBe('complete');
    });

    it('should include joke count in progress message', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptBBasic));

      const progressUpdates: PipelineProgress[] = [];
      const onProgress = (progress: PipelineProgress) => {
        progressUpdates.push(progress);
      };

      await runAnalysisPipeline('Script', 'sitcom', 'Test', onProgress);

      // Should mention number of jokes found
      const jokeMessage = progressUpdates.find((p) =>
        p.message.includes('jokes')
      );
      expect(jokeMessage).toBeDefined();
      expect(jokeMessage?.message).toContain('3'); // mockPromptABasic has 3 jokes
    });

    it('should include overall score in progress message', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptBBasic));

      const progressUpdates: PipelineProgress[] = [];
      const onProgress = (progress: PipelineProgress) => {
        progressUpdates.push(progress);
      };

      await runAnalysisPipeline('Script', 'sitcom', 'Test', onProgress);

      // Should mention overall score
      const scoreMessage = progressUpdates.find(
        (p) => p.stage === 'scoring' && p.message.includes('score')
      );
      expect(scoreMessage).toBeDefined();
      expect(scoreMessage?.message).toMatch(/\d+\/100/);
    });

    it('should not crash when progress callback is not provided', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptBBasic));

      const result = await runAnalysisPipeline('Script', 'sitcom', 'Test');

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling - Prompt A Failures', () => {
    it('should handle Prompt A LLM failure', async () => {
      mockCallLLM.mockResolvedValueOnce(
        createMockLLMError('OpenAI API error')
      );

      const result = await runAnalysisPipeline('Script', 'sitcom', 'Test');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('OpenAI API error');
      }
    });

    it('should handle Prompt A empty response', async () => {
      mockCallLLM.mockResolvedValueOnce({
        success: true,
        data: undefined,
      });

      const result = await runAnalysisPipeline('Script', 'sitcom', 'Test');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Failed to analyze script');
      }
    });

    it('should not call Prompt B if Prompt A fails', async () => {
      mockCallLLM.mockResolvedValueOnce(
        createMockLLMError('Prompt A failed')
      );

      await runAnalysisPipeline('Script', 'sitcom', 'Test');

      expect(mockCallLLM).toHaveBeenCalledTimes(1);
    });

    it('should not call progress callback with error stage on Prompt A failure (returns early)', async () => {
      mockCallLLM.mockResolvedValueOnce(
        createMockLLMError('Prompt A failed')
      );

      const progressUpdates: PipelineProgress[] = [];
      const onProgress = (progress: PipelineProgress) => {
        progressUpdates.push(progress);
      };

      await runAnalysisPipeline('Script', 'sitcom', 'Test', onProgress);

      // When Prompt A returns an error (not throws), pipeline returns early without error stage
      const errorUpdate = progressUpdates.find((p) => p.stage === 'error');
      expect(errorUpdate).toBeUndefined();

      // Should have started extracting stage
      const extractingUpdate = progressUpdates.find((p) => p.stage === 'extracting');
      expect(extractingUpdate).toBeDefined();
    });
  });

  describe('Error Handling - Prompt B Failures', () => {
    it('should handle Prompt B LLM failure', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
        .mockResolvedValueOnce(createMockLLMError('Prompt B failed'));

      const result = await runAnalysisPipeline('Script', 'sitcom', 'Test');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Prompt B failed');
      }
    });

    it('should handle Prompt B empty response', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
        .mockResolvedValueOnce({
          success: true,
          data: undefined,
        });

      const result = await runAnalysisPipeline('Script', 'sitcom', 'Test');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Failed to generate feedback');
      }
    });

    it('should have completed Prompt A before Prompt B fails', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
        .mockResolvedValueOnce(createMockLLMError('Prompt B failed'));

      const progressUpdates: PipelineProgress[] = [];
      const onProgress = (progress: PipelineProgress) => {
        progressUpdates.push(progress);
      };

      await runAnalysisPipeline('Script', 'sitcom', 'Test', onProgress);

      const stages = progressUpdates.map((p) => p.stage);
      expect(stages).toContain('extracting');
      expect(stages).toContain('scoring');
      expect(stages).toContain('coaching');

      // When Prompt B returns an error (not throws), pipeline returns early without error stage
      expect(stages).not.toContain('error');
    });
  });

  describe('Error Handling - Exceptions', () => {
    it('should handle unexpected exceptions', async () => {
      mockCallLLM.mockRejectedValueOnce(new Error('Unexpected error'));

      const result = await runAnalysisPipeline('Script', 'sitcom', 'Test');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unexpected error');
      }
    });

    it('should handle non-Error exceptions', async () => {
      mockCallLLM.mockRejectedValueOnce('String error');

      const result = await runAnalysisPipeline('Script', 'sitcom', 'Test');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unknown error');
      }
    });

    it('should call progress callback with error on exception', async () => {
      mockCallLLM.mockRejectedValueOnce(new Error('Exception thrown'));

      const progressUpdates: PipelineProgress[] = [];
      const onProgress = (progress: PipelineProgress) => {
        progressUpdates.push(progress);
      };

      await runAnalysisPipeline('Script', 'sitcom', 'Test', onProgress);

      const errorUpdate = progressUpdates.find((p) => p.stage === 'error');
      expect(errorUpdate).toBeDefined();
      expect(errorUpdate?.percent).toBe(0);
      expect(errorUpdate?.message).toBe('Exception thrown');
    });
  });

  describe('Timeline Generation', () => {
    it('should generate timeline data', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptBBasic));

      const result = await runAnalysisPipeline('Script', 'sitcom', 'Test');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timeline).toBeDefined();
        expect(Array.isArray(result.data.timeline)).toBe(true);
        expect(result.data.timeline.length).toBeGreaterThan(0);
      }
    });

    it('should include line number in timeline', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptBBasic));

      const result = await runAnalysisPipeline('Script', 'sitcom', 'Test');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timeline[0]).toHaveProperty('line');
        expect(result.data.timeline[0]).toHaveProperty('density');
        expect(typeof result.data.timeline[0].line).toBe('number');
        expect(typeof result.data.timeline[0].density).toBe('number');
      }
    });

    it('should mark lines with jokes in timeline', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptBBasic));

      const result = await runAnalysisPipeline('Script', 'sitcom', 'Test');

      expect(result.success).toBe(true);
      if (result.success) {
        // Line 10 has a joke in mockPromptABasic
        const line10 = result.data.timeline.find((t) => t.line === 10);
        expect(line10).toBeDefined();
        expect(line10?.joke).toBeDefined();
        expect(line10?.joke).toBe('A simple joke');
      }
    });

    it('should calculate density for each line', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptBBasic));

      const result = await runAnalysisPipeline('Script', 'sitcom', 'Test');

      expect(result.success).toBe(true);
      if (result.success) {
        // Density should be between 0 and 1 (jokes in window / window size)
        for (const point of result.data.timeline) {
          expect(point.density).toBeGreaterThanOrEqual(0);
          expect(point.density).toBeLessThanOrEqual(1);
        }
      }
    });

    it('should have higher density near jokes', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptBBasic));

      const result = await runAnalysisPipeline('Script', 'sitcom', 'Test');

      expect(result.success).toBe(true);
      if (result.success) {
        // Line 10 has a joke, so density should be > 0
        const line10 = result.data.timeline.find((t) => t.line === 10);
        expect(line10?.density).toBeGreaterThan(0);

        // Lines far from jokes should have lower density
        // mockPromptABasic has jokes at lines 10, 30, 50
        // So line 150 should have density 0
        const line150 = result.data.timeline.find((t) => t.line === 150);
        expect(line150?.density).toBe(0);
      }
    });

    it('should generate timeline matching script length', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptBBasic));

      const result = await runAnalysisPipeline('Script', 'sitcom', 'Test');

      expect(result.success).toBe(true);
      if (result.success) {
        // mockPromptABasic has totalLines = 200
        expect(result.data.timeline.length).toBe(200);
      }
    });
  });

  describe('Integration with Different Script Types', () => {
    it('should handle scripts with no jokes', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptANoJokes))
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptBError));

      const result = await runAnalysisPipeline('Script', 'sitcom', 'Test');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.jokes.length).toBe(0);
        expect(result.data.scores.overallScore).toBe(0);
        expect(result.data.timeline.length).toBe(100); // mockPromptANoJokes has 100 lines
      }
    });

    it('should handle high-quality scripts', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptAHighComplexity))
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptBHighScore));

      const result = await runAnalysisPipeline('Script', 'feature', 'Test');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.jokes.length).toBe(3);
        expect(result.data.scores.overallScore).toBeGreaterThan(0);
        expect(result.data.feedback).toEqual(mockPromptBHighScore);
      }
    });

    it('should pass correct format to scoring engine', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptBBasic));

      const result = await runAnalysisPipeline('Script', 'feature', 'Test');

      expect(result.success).toBe(true);
      if (result.success) {
        // Feature format should use different benchmarks
        expect(result.data.scores.comparison.lpmBenchmark).toBe(1.0); // Feature LPM
        expect(result.data.scores.comparison.lpjBenchmark).toBe(12.0); // Feature LPJ
      }
    });
  });

  describe('Prompt B Input Construction', () => {
    it('should pass scoring results to Prompt B', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptBBasic));

      await runAnalysisPipeline('Script', 'sitcom', 'Test');

      // Check the second call (Prompt B)
      const promptBCall = mockCallLLM.mock.calls[1];
      const promptBInput = JSON.parse(promptBCall[1]);

      expect(promptBInput).toHaveProperty('scriptStats');
      expect(promptBInput).toHaveProperty('jokes');
      expect(promptBInput).toHaveProperty('scores');
      expect(promptBInput).toHaveProperty('format');
      expect(promptBInput.format).toBe('sitcom');
    });

    it('should include all scoring metrics in Prompt B input', async () => {
      mockCallLLM
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptABasic))
        .mockResolvedValueOnce(createMockLLMSuccess(mockPromptBBasic));

      await runAnalysisPipeline('Script', 'sitcom', 'Test');

      const promptBCall = mockCallLLM.mock.calls[1];
      const promptBInput = JSON.parse(promptBCall[1]);

      expect(promptBInput.scores).toHaveProperty('overallScore');
      expect(promptBInput.scores).toHaveProperty('percentile');
      expect(promptBInput.scores).toHaveProperty('metrics');
      expect(promptBInput.scores).toHaveProperty('distribution');
      expect(promptBInput.scores).toHaveProperty('comparison');
      expect(promptBInput.scores).toHaveProperty('gaps');
    });
  });
});
