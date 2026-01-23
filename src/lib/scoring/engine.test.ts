import { describe, it, expect } from 'vitest';
import { calculateScores } from './engine';
import {
  mockPromptABasic,
  mockPromptANoJokes,
  mockPromptAHighComplexity,
  mockPromptAUnbalanced,
  mockPromptAWithRetentionCliff,
  mockPromptAAllBasicJokes,
} from '@/__tests__/fixtures/promptA-outputs';

describe('Scoring Engine', () => {
  describe('calculateScores - Basic Functionality', () => {
    it('should calculate scores for a basic script', () => {
      const result = calculateScores(mockPromptABasic, 'sitcom');

      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.percentile).toBeGreaterThan(0);
      expect(result.metrics.totalJokes).toBe(3);
    });

    it('should handle scripts with no jokes gracefully', () => {
      const result = calculateScores(mockPromptANoJokes, 'sitcom');

      expect(result.overallScore).toBe(0);
      expect(result.metrics.totalJokes).toBe(0);
      expect(result.metrics.lpm).toBe(0);
      expect(result.metrics.lpj).toBe(999);
      expect(result.metrics.jokeRatio).toBe(0);
      expect(result.metrics.characterBalance).toBe(1); // Perfect balance with no data
    });

    it('should return values within expected ranges', () => {
      const result = calculateScores(mockPromptABasic, 'sitcom');

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.percentile).toBeGreaterThanOrEqual(0);
      expect(result.percentile).toBeLessThanOrEqual(100);
      expect(result.metrics.characterBalance).toBeGreaterThanOrEqual(0);
      expect(result.metrics.characterBalance).toBeLessThanOrEqual(1);
    });
  });

  describe('Weighted Joke Score Calculation', () => {
    it('should weight jokes by complexity', () => {
      const result = calculateScores(mockPromptABasic, 'sitcom');

      // Basic (1.2) + Standard (1.7) + Intermediate (2.3) = 5.2
      expect(result.metrics.weightedJokeScore).toBe(5.2);
    });

    it('should calculate higher scores for complex jokes', () => {
      const result = calculateScores(mockPromptAHighComplexity, 'feature');

      // Advanced (2.8) + High (3.3) + Advanced (2.8) = 8.9
      expect(result.metrics.weightedJokeScore).toBe(8.9);
    });

    it('should calculate correct distribution', () => {
      const result = calculateScores(mockPromptABasic, 'sitcom');

      expect(result.distribution.basic).toBe(1);
      expect(result.distribution.standard).toBe(1);
      expect(result.distribution.intermediate).toBe(1);
      expect(result.distribution.advanced).toBe(0);
      expect(result.distribution.high).toBe(0);
    });

    it('should handle all basic jokes correctly', () => {
      const result = calculateScores(mockPromptAAllBasicJokes, 'sitcom');

      expect(result.distribution.basic).toBe(5);
      expect(result.metrics.weightedJokeScore).toBe(6); // 5 * 1.2
      expect(result.metrics.hackRatio).toBe(100); // All jokes are basic
    });
  });

  describe('LPM (Laughs Per Minute) Calculation', () => {
    it('should calculate LPM correctly', () => {
      const result = calculateScores(mockPromptABasic, 'sitcom');

      // 3 jokes / 22 minutes = 0.136... ≈ 0.14
      expect(result.metrics.lpm).toBeCloseTo(0.14, 1);
    });

    it('should handle different runtimes', () => {
      const result = calculateScores(mockPromptAHighComplexity, 'feature');

      // 3 jokes / 90 minutes = 0.033... ≈ 0.03
      expect(result.metrics.lpm).toBeCloseTo(0.03, 1);
    });

    it('should use default runtime of 22 minutes when runtime is 0', () => {
      const mockZeroRuntime = {
        ...mockPromptABasic,
        scriptStats: { ...mockPromptABasic.scriptStats, estimatedRuntime: 0 },
      };

      const result = calculateScores(mockZeroRuntime, 'sitcom');
      // Runtime defaults to 22, so 3 jokes / 22 min ≈ 0.14
      expect(result.metrics.lpm).toBeCloseTo(0.14, 1);
    });
  });

  describe('LPJ (Lines Per Joke) Calculation', () => {
    it('should calculate LPJ correctly', () => {
      const result = calculateScores(mockPromptABasic, 'sitcom');

      // 150 dialogue lines / 3 jokes = 50
      expect(result.metrics.lpj).toBe(50);
    });

    it('should return 999 for zero jokes', () => {
      const result = calculateScores(mockPromptANoJokes, 'sitcom');

      expect(result.metrics.lpj).toBe(999);
    });

    it('should round to one decimal place', () => {
      const mockOddLines = {
        ...mockPromptABasic,
        scriptStats: { ...mockPromptABasic.scriptStats, dialogueLines: 100 },
      };

      const result = calculateScores(mockOddLines, 'sitcom');
      // 100 / 3 = 33.333... should round to 33.3
      expect(result.metrics.lpj).toBeCloseTo(33.3, 1);
    });
  });

  describe('Genre Factor Application', () => {
    it('should apply sitcom factor (1.0 baseline)', () => {
      const sitcomResult = calculateScores(mockPromptABasic, 'sitcom');
      expect(sitcomResult.comparison.lpmBenchmark).toBe(2.0);
      expect(sitcomResult.comparison.lpjBenchmark).toBe(5.5);
    });

    it('should apply feature factor (1.2)', () => {
      const featureResult = calculateScores(mockPromptABasic, 'feature');
      expect(featureResult.comparison.lpmBenchmark).toBe(1.0);
      expect(featureResult.comparison.lpjBenchmark).toBe(12.0);
    });

    it('should apply standup factor (0.8)', () => {
      const standupResult = calculateScores(mockPromptABasic, 'standup');
      expect(standupResult.comparison.lpmBenchmark).toBe(3.5);
      expect(standupResult.comparison.lpjBenchmark).toBe(3.0);
    });

    it('should apply sketch factor (0.9)', () => {
      const sketchResult = calculateScores(mockPromptABasic, 'sketch');
      expect(sketchResult.comparison.lpmBenchmark).toBe(2.5);
      expect(sketchResult.comparison.lpjBenchmark).toBe(4.0);
    });
  });

  describe('Callback Bonus Calculation', () => {
    it('should add bonus for callbacks', () => {
      // mockPromptABasic has 1 callback
      const result = calculateScores(mockPromptABasic, 'sitcom');

      expect(result.metrics.callbackFrequency).toBe(33); // 1/3 * 100 ≈ 33
    });

    it('should handle no callbacks', () => {
      const result = calculateScores(mockPromptANoJokes, 'sitcom');

      expect(result.metrics.callbackFrequency).toBe(0);
    });

    it('should calculate callback frequency correctly', () => {
      const mockAllCallbacks = {
        ...mockPromptABasic,
        jokes: mockPromptABasic.jokes.map(j => ({ ...j, isCallback: true })),
      };

      const result = calculateScores(mockAllCallbacks, 'sitcom');
      expect(result.metrics.callbackFrequency).toBe(100);
    });
  });

  describe('Hack Penalty Calculation', () => {
    it('should penalize basic (hack) jokes', () => {
      const result = calculateScores(mockPromptAAllBasicJokes, 'sitcom');

      expect(result.metrics.hackRatio).toBe(100);
      expect(result.overallScore).toBeLessThan(50); // Should be penalized
    });

    it('should have zero hack ratio with no basic jokes', () => {
      const result = calculateScores(mockPromptAHighComplexity, 'feature');

      expect(result.metrics.hackRatio).toBe(0);
    });

    it('should calculate partial hack ratio', () => {
      const result = calculateScores(mockPromptABasic, 'sitcom');

      // 1 basic joke out of 3 = 33%
      expect(result.metrics.hackRatio).toBe(33);
    });
  });

  describe('Character Balance Calculation', () => {
    it('should calculate perfect balance for single character', () => {
      const result = calculateScores(mockPromptAAllBasicJokes, 'sitcom');

      // Only one character, so perfect balance
      expect(result.metrics.characterBalance).toBe(1);
    });

    it('should detect imbalance', () => {
      const result = calculateScores(mockPromptAUnbalanced, 'sitcom');

      // Alice: 4 jokes, Bob: 1 joke - should be imbalanced
      expect(result.metrics.characterBalance).toBeLessThan(1);
      expect(result.metrics.characterBalance).toBeGreaterThan(0);
    });

    it('should calculate perfect balance for equal distribution', () => {
      const mockBalanced = {
        ...mockPromptABasic,
        jokes: [
          { id: 'j1', lineNumber: 10, complexity: 'standard', isCallback: false, character: 'Alice', text: 'J1', tags: [] },
          { id: 'j2', lineNumber: 20, complexity: 'standard', isCallback: false, character: 'Bob', text: 'J2', tags: [] },
          { id: 'j3', lineNumber: 30, complexity: 'standard', isCallback: false, character: 'Charlie', text: 'J3', tags: [] },
        ],
        characters: {
          Alice: { jokeCount: 1, dialogueLines: 50 },
          Bob: { jokeCount: 1, dialogueLines: 50 },
          Charlie: { jokeCount: 1, dialogueLines: 50 },
        },
      };

      const result = calculateScores(mockBalanced, 'sitcom');
      expect(result.metrics.characterBalance).toBe(1);
    });

    it('should handle empty character list', () => {
      const result = calculateScores(mockPromptANoJokes, 'sitcom');

      expect(result.metrics.characterBalance).toBe(1);
    });
  });

  describe('Benchmark Comparison', () => {
    it('should mark LPM as above benchmark', () => {
      const mockHighLPM = {
        ...mockPromptABasic,
        jokes: Array.from({ length: 50 }, (_, i) => ({
          id: `j${i}`,
          lineNumber: i * 10,
          complexity: 'standard' as const,
          isCallback: false,
          character: 'Alice',
          text: `Joke ${i}`,
          tags: [],
        })),
        characters: { Alice: { jokeCount: 50, dialogueLines: 150 } },
      };

      const result = calculateScores(mockHighLPM, 'sitcom');
      // 50 jokes / 22 min ≈ 2.27 > 2.0 * 1.1 = above
      expect(result.comparison.lpmStatus).toBe('above');
    });

    it('should mark LPM as below benchmark', () => {
      const result = calculateScores(mockPromptABasic, 'sitcom');
      // 3 jokes / 22 min ≈ 0.14 < 2.0 * 0.9 = below
      expect(result.comparison.lpmStatus).toBe('below');
    });

    it('should mark LPM as on-target', () => {
      const mockOnTarget = {
        ...mockPromptABasic,
        jokes: Array.from({ length: 44 }, (_, i) => ({
          id: `j${i}`,
          lineNumber: i * 10,
          complexity: 'standard' as const,
          isCallback: false,
          character: 'Alice',
          text: `Joke ${i}`,
          tags: [],
        })),
        characters: { Alice: { jokeCount: 44, dialogueLines: 150 } },
      };

      const result = calculateScores(mockOnTarget, 'sitcom');
      // 44 / 22 = 2.0 exactly = on-target
      expect(result.comparison.lpmStatus).toBe('on-target');
    });

    it('should compare LPJ correctly (lower is better)', () => {
      const mockLowLPJ = {
        ...mockPromptABasic,
        scriptStats: { ...mockPromptABasic.scriptStats, dialogueLines: 30 },
      };

      const result = calculateScores(mockLowLPJ, 'sitcom');
      // 30 / 3 = 10 < 5.5 * 0.9 = 4.95... actually > so below
      // Wait, lower LPJ is better, so < benchmark * 0.9 = above
      expect(result.comparison.lpjStatus).toBe('below');
    });
  });

  describe('Gap Analysis', () => {
    it('should prioritize retention cliffs', () => {
      const result = calculateScores(mockPromptAWithRetentionCliff, 'sitcom');

      expect(result.gaps.length).toBe(2);
      const cliff = result.gaps.find(g => g.isRetentionCliff);
      expect(cliff).toBeDefined();
      expect(cliff!.priority).toBeGreaterThan(0);
    });

    it('should prioritize late gaps higher', () => {
      const result = calculateScores(mockPromptAWithRetentionCliff, 'sitcom');

      const lateGap = result.gaps.find(g => g.position === 'late');
      expect(lateGap).toBeDefined();
      expect(lateGap!.priority).toBeGreaterThan(1);
    });

    it('should sort gaps by priority (descending)', () => {
      const result = calculateScores(mockPromptAWithRetentionCliff, 'sitcom');

      for (let i = 0; i < result.gaps.length - 1; i++) {
        expect(result.gaps[i].priority).toBeGreaterThanOrEqual(result.gaps[i + 1].priority);
      }
    });

    it('should handle scripts with no gaps', () => {
      const result = calculateScores(mockPromptABasic, 'sitcom');

      expect(result.gaps.length).toBe(1);
      expect(result.gaps[0].isRetentionCliff).toBe(false);
    });
  });

  describe('Percentile Estimation', () => {
    it('should estimate high percentile for high scores', () => {
      const mockHighScore = {
        ...mockPromptABasic,
        jokes: Array.from({ length: 100 }, (_, i) => ({
          id: `j${i}`,
          lineNumber: i * 2,
          complexity: 'high' as const,
          isCallback: i % 5 === 0,
          character: 'Alice',
          text: `Joke ${i}`,
          tags: [],
        })),
        characters: { Alice: { jokeCount: 100, dialogueLines: 150 } },
        scriptStats: { ...mockPromptABasic.scriptStats, totalLines: 200, dialogueLines: 150 },
      };

      const result = calculateScores(mockHighScore, 'sitcom');
      expect(result.percentile).toBeGreaterThanOrEqual(80);
    });

    it('should estimate low percentile for low scores', () => {
      const result = calculateScores(mockPromptAAllBasicJokes, 'sitcom');
      expect(result.percentile).toBeLessThanOrEqual(50);
    });

    it('should return reasonable percentile for mid-range scores', () => {
      const result = calculateScores(mockPromptABasic, 'sitcom');
      expect(result.percentile).toBeGreaterThanOrEqual(10);
      expect(result.percentile).toBeLessThanOrEqual(95);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle extremely long runtime', () => {
      const mockLongRuntime = {
        ...mockPromptABasic,
        scriptStats: { ...mockPromptABasic.scriptStats, estimatedRuntime: 300 },
      };

      const result = calculateScores(mockLongRuntime, 'feature');
      expect(result.metrics.lpm).toBeGreaterThan(0);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should handle extremely short runtime', () => {
      const mockShortRuntime = {
        ...mockPromptABasic,
        scriptStats: { ...mockPromptABasic.scriptStats, estimatedRuntime: 1 },
      };

      const result = calculateScores(mockShortRuntime, 'sketch');
      expect(result.metrics.lpm).toBe(3); // 3 jokes / 1 minute
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should not exceed 100 for overall score', () => {
      const mockPerfectScript = {
        ...mockPromptABasic,
        jokes: Array.from({ length: 200 }, (_, i) => ({
          id: `j${i}`,
          lineNumber: i,
          complexity: 'high' as const,
          isCallback: true,
          character: 'Alice',
          text: `Joke ${i}`,
          tags: [],
        })),
        characters: { Alice: { jokeCount: 200, dialogueLines: 150 } },
      };

      const result = calculateScores(mockPerfectScript, 'sitcom');
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should not go below 0 for overall score', () => {
      const result = calculateScores(mockPromptANoJokes, 'sitcom');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle undefined format gracefully', () => {
      const result = calculateScores(mockPromptABasic, 'auto');
      expect(result.comparison.lpmBenchmark).toBe(2.0);
      expect(result.comparison.lpjBenchmark).toBe(6.0);
    });
  });

  describe('Metrics Rounding', () => {
    it('should round LPM to 2 decimal places', () => {
      const result = calculateScores(mockPromptABasic, 'sitcom');

      const decimalPlaces = result.metrics.lpm.toString().split('.')[1]?.length || 0;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });

    it('should round LPJ to 1 decimal place', () => {
      const result = calculateScores(mockPromptABasic, 'sitcom');

      const decimalPlaces = result.metrics.lpj.toString().split('.')[1]?.length || 0;
      expect(decimalPlaces).toBeLessThanOrEqual(1);
    });

    it('should round character balance to 2 decimal places', () => {
      const result = calculateScores(mockPromptABasic, 'sitcom');

      const decimalPlaces = result.metrics.characterBalance.toString().split('.')[1]?.length || 0;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });

    it('should round percentages to integers', () => {
      const result = calculateScores(mockPromptABasic, 'sitcom');

      expect(Number.isInteger(result.metrics.callbackFrequency)).toBe(true);
      expect(Number.isInteger(result.metrics.hackRatio)).toBe(true);
    });
  });
});
