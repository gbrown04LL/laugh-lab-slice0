import { callLLM } from '../llm/openai-client';
import { PROMPT_A_SYSTEM, PromptAOutput } from '../llm/promptA';
import { PROMPT_B_SYSTEM, PromptBOutput } from '../llm/promptB';
import { calculateScores, ScoringOutput } from '../scoring/engine';
import crypto from 'crypto';

export interface AnalysisResult {
  id: string;
  timestamp: string;
  title: string;
  format: string;
  
  // From Prompt A
  scriptStats: PromptAOutput['scriptStats'];
  jokes: PromptAOutput['jokes'];
  
  // From Scoring Engine
  scores: ScoringOutput;
  
  // From Prompt B
  feedback: PromptBOutput;
  
  // Computed for visualizations
  timeline: Array<{ line: number; density: number; joke?: string }>;
}

export interface PipelineProgress {
  stage: 'extracting' | 'scoring' | 'coaching' | 'complete' | 'error';
  percent: number;
  message: string;
}

export async function runAnalysisPipeline(
  script: string,
  format: 'sitcom' | 'feature' | 'sketch' | 'standup' | 'auto' = 'auto',
  title: string = 'Untitled Script',
  onProgress?: (progress: PipelineProgress) => void
): Promise<{ success: true; data: AnalysisResult } | { success: false; error: string }> {
  
  const reportProgress = (stage: PipelineProgress['stage'], percent: number, message: string) => {
    onProgress?.({ stage, percent, message });
  };

  try {
    // Stage 1: Prompt A - Extract jokes
    reportProgress('extracting', 10, 'Reading your script...');
    
    const promptAResult = await callLLM<PromptAOutput>(
      PROMPT_A_SYSTEM,
      script,
      { responseFormat: 'json', temperature: 0.2, maxTokens: 8000 }
    );

    if (!promptAResult.success || !promptAResult.data) {
      return { success: false, error: promptAResult.error || 'Failed to analyze script' };
    }

    reportProgress('extracting', 40, `Found ${promptAResult.data.jokes.length} jokes...`);

    // Stage 2: Scoring Engine - Calculate metrics
    reportProgress('scoring', 50, 'Crunching the numbers...');
    
    const scores = calculateScores(promptAResult.data, format);
    
    reportProgress('scoring', 60, `Overall score: ${scores.overallScore}/100`);

    // Stage 3: Prompt B - Generate coaching feedback
    reportProgress('coaching', 70, 'Writing your feedback...');
    
    const promptBInput = JSON.stringify({
      scriptStats: promptAResult.data.scriptStats,
      jokes: promptAResult.data.jokes,
      scores,
      format,
    });

    const promptBResult = await callLLM<PromptBOutput>(
      PROMPT_B_SYSTEM,
      promptBInput,
      { responseFormat: 'json', temperature: 0.7, maxTokens: 4000 }
    );

    if (!promptBResult.success || !promptBResult.data) {
      return { success: false, error: promptBResult.error || 'Failed to generate feedback' };
    }

    reportProgress('coaching', 90, 'Polishing the report...');

    // Stage 4: Build timeline visualization data
    const timeline = buildTimeline(promptAResult.data, scores);

    // Assemble final result
    const result: AnalysisResult = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      title,
      format,
      scriptStats: promptAResult.data.scriptStats,
      jokes: promptAResult.data.jokes,
      scores,
      feedback: promptBResult.data,
      timeline,
    };

    reportProgress('complete', 100, 'Analysis complete!');

    return { success: true, data: result };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    reportProgress('error', 0, message);
    return { success: false, error: message };
  }
}

function buildTimeline(
  promptA: PromptAOutput,
  scores: ScoringOutput
): Array<{ line: number; density: number; joke?: string }> {
  const totalLines = promptA.scriptStats.totalLines;
  const timeline: Array<{ line: number; density: number; joke?: string }> = [];
  
  // Create a map of joke locations
  const jokeMap = new Map<number, string>();
  for (const joke of promptA.jokes) {
    jokeMap.set(joke.lineNumber, joke.text);
  }
  
  // Build timeline with rolling density (5-line window)
  const windowSize = 5;
  for (let line = 1; line <= totalLines; line++) {
    // Count jokes in window
    let jokesInWindow = 0;
    for (let i = Math.max(1, line - windowSize); i <= Math.min(totalLines, line + windowSize); i++) {
      if (jokeMap.has(i)) jokesInWindow++;
    }
    
    const density = jokesInWindow / (windowSize * 2);
    const joke = jokeMap.get(line);
    
    timeline.push({ line, density, joke });
  }
  
  return timeline;
}
