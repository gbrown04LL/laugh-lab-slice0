import { PromptAOutput } from '../llm/promptA';

// Complexity multipliers (from v2.0.0-canonical spec)
const COMPLEXITY_WEIGHTS = {
  basic: 1.2,
  standard: 1.7,
  intermediate: 2.3,
  advanced: 2.8,
  high: 3.3,
} as const;

// Genre calibration factors
const GENRE_FACTORS = {
  standup: 0.80,
  sketch: 0.90,
  sitcom_multicam: 0.95,
  sitcom: 1.00, // single-cam baseline
  feature: 1.20,
  auto: 1.00,
} as const;

// Industry benchmarks
const FORMAT_BENCHMARKS = {
  sitcom: { lpm: 2.0, lpj: 5.5 },
  feature: { lpm: 1.0, lpj: 12.0 },
  sketch: { lpm: 2.5, lpj: 4.0 },
  standup: { lpm: 3.5, lpj: 3.0 },
  auto: { lpm: 2.0, lpj: 6.0 },
} as const;

export interface ScoringOutput {
  overallScore: number;
  percentile: number;
  metrics: {
    lpm: number;
    lpj: number;
    totalJokes: number;
    weightedJokeScore: number;
    jokeRatio: number;
    callbackFrequency: number;
    hackRatio: number;
    characterBalance: number;
  };
  distribution: {
    basic: number;
    standard: number;
    intermediate: number;
    advanced: number;
    high: number;
  };
  comparison: {
    lpmStatus: 'above' | 'on-target' | 'below';
    lpjStatus: 'above' | 'on-target' | 'below';
    lpmBenchmark: number;
    lpjBenchmark: number;
  };
  gaps: Array<{
    startLine: number;
    endLine: number;
    duration: number;
    priority: number;
    isRetentionCliff: boolean;
  }>;
}

export function calculateScores(
  promptAOutput: PromptAOutput,
  format: keyof typeof FORMAT_BENCHMARKS = 'sitcom'
): ScoringOutput {
  const { scriptStats, jokes, gaps } = promptAOutput;
  const totalJokes = jokes.length;
  const runtime = scriptStats.estimatedRuntime || 22; // Default to sitcom length
  
  // 1. Calculate weighted joke score
  let weightedJokeScore = 0;
  const distribution = { basic: 0, standard: 0, intermediate: 0, advanced: 0, high: 0 };
  
  for (const joke of jokes) {
    weightedJokeScore += COMPLEXITY_WEIGHTS[joke.complexity];
    distribution[joke.complexity]++;
  }
  
  // 2. Calculate joke ratio
  const maxPossibleScore = totalJokes * COMPLEXITY_WEIGHTS.high; // 3.3 per joke
  const jokeRatio = maxPossibleScore > 0 ? weightedJokeScore / maxPossibleScore : 0;
  
  // 3. Calculate runtime factor (sqrt normalization)
  const baselineRuntime = 30; // 30 minutes baseline
  const runtimeFactor = Math.sqrt(baselineRuntime / runtime);
  
  // 4. Get genre factor
  const genreFactor = GENRE_FACTORS[format] ?? 1.0;
  
  // 5. Calculate bonuses and penalties
  const callbackCount = jokes.filter(j => j.isCallback).length;
  const callbackBonus = callbackCount * 0.07;
  
  const hackCount = distribution.basic;
  const hackPenalty = (hackCount / Math.max(totalJokes, 1)) * 0.05 * totalJokes;
  
  // 6. Calculate overall score
  const adjustedScore = (jokeRatio * 100 * runtimeFactor * genreFactor) + callbackBonus - hackPenalty;
  const overallScore = Math.min(100, Math.max(0, Math.round(adjustedScore)));
  
  // 7. Calculate metrics
  const lpm = runtime > 0 ? totalJokes / runtime : 0;
  const lpj = totalJokes > 0 ? scriptStats.dialogueLines / totalJokes : 999;
  
  const callbackFrequency = totalJokes > 0 ? (callbackCount / totalJokes) * 100 : 0;
  const hackRatio = totalJokes > 0 ? (hackCount / totalJokes) * 100 : 0;
  
  // 8. Calculate character balance (1 - σ/μ)
  const characterJokeCounts = Object.values(promptAOutput.characters).map(c => c.jokeCount);
  const characterBalance = calculateCharacterBalance(characterJokeCounts);
  
  // 9. Compare to benchmarks
  const benchmark = FORMAT_BENCHMARKS[format];
  const lpmStatus = lpm >= benchmark.lpm * 1.1 ? 'above' : lpm >= benchmark.lpm * 0.9 ? 'on-target' : 'below';
  const lpjStatus = lpj <= benchmark.lpj * 0.9 ? 'above' : lpj <= benchmark.lpj * 1.1 ? 'on-target' : 'below';
  
  // 10. Calculate gap priorities
  const scoredGaps = gaps.map(gap => ({
    ...gap,
    priority: calculateGapPriority(gap, scriptStats.totalLines),
  })).sort((a, b) => b.priority - a.priority);
  
  // 11. Estimate percentile (simplified)
  const percentile = estimatePercentile(overallScore, format);
  
  return {
    overallScore,
    percentile,
    metrics: {
      lpm: Math.round(lpm * 100) / 100,
      lpj: Math.round(lpj * 10) / 10,
      totalJokes,
      weightedJokeScore: Math.round(weightedJokeScore * 100) / 100,
      jokeRatio: Math.round(jokeRatio * 100) / 100,
      callbackFrequency: Math.round(callbackFrequency),
      hackRatio: Math.round(hackRatio),
      characterBalance: Math.round(characterBalance * 100) / 100,
    },
    distribution,
    comparison: {
      lpmStatus,
      lpjStatus,
      lpmBenchmark: benchmark.lpm,
      lpjBenchmark: benchmark.lpj,
    },
    gaps: scoredGaps,
  };
}

function calculateCharacterBalance(jokeCounts: number[]): number {
  if (jokeCounts.length < 2) return 1.0;
  
  const mean = jokeCounts.reduce((a, b) => a + b, 0) / jokeCounts.length;
  if (mean === 0) return 1.0;
  
  const variance = jokeCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / jokeCounts.length;
  const stdDev = Math.sqrt(variance);
  
  return Math.max(0, 1 - (stdDev / mean));
}

function calculateGapPriority(
  gap: { duration: number; position: string; isRetentionCliff: boolean },
  totalLines: number
): number {
  // Duration weight (longer gaps = higher priority)
  const durationWeight = Math.min(gap.duration / 20, 2.0);
  
  // Position weight (late gaps are worse)
  const positionWeight = gap.position === 'late' ? 1.5 : gap.position === 'middle' ? 1.2 : 1.0;
  
  // Retention cliff multiplier
  const cliffMultiplier = gap.isRetentionCliff ? 2.0 : 1.0;
  
  return durationWeight * positionWeight * cliffMultiplier;
}

function estimatePercentile(score: number, format: string): number {
  // Simplified percentile estimation based on score ranges
  // In production, this would use actual database percentiles
  if (score >= 85) return 95;
  if (score >= 75) return 80;
  if (score >= 65) return 65;
  if (score >= 55) return 50;
  if (score >= 45) return 35;
  if (score >= 35) return 20;
  return 10;
}
