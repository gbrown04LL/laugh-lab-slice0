import { PromptAOutput } from '@/lib/llm/promptA';

/**
 * Mock Prompt A outputs for testing
 */

export const mockPromptABasic: PromptAOutput = {
  scriptStats: {
    totalLines: 200,
    dialogueLines: 150,
    estimatedRuntime: 22,
    wordCount: 5000,
    sceneCount: 8,
    characters: ['Alice', 'Bob'],
  },
  jokes: [
    {
      id: 1,
      lineNumber: 10,
      complexity: 'basic',
      isCallback: false,
      character: 'Alice',
      text: 'A simple joke',
      technique: 'wordplay',
      setupLine: null,
    },
    {
      id: 2,
      lineNumber: 30,
      complexity: 'standard',
      isCallback: false,
      character: 'Bob',
      text: 'Another joke',
      technique: 'observational',
      setupLine: null,
    },
    {
      id: 3,
      lineNumber: 50,
      complexity: 'intermediate',
      isCallback: true,
      character: 'Alice',
      text: 'A callback joke',
      technique: 'callback',
      setupLine: 10,
    },
  ],
  characters: {
    Alice: {
      jokeCount: 2,
      complexity: { basic: 1, standard: 0, intermediate: 1, advanced: 0, high: 0 },
    },
    Bob: {
      jokeCount: 1,
      complexity: { basic: 0, standard: 1, intermediate: 0, advanced: 0, high: 0 },
    },
  },
  gaps: [
    {
      startLine: 60,
      endLine: 100,
      duration: 5,
      position: 'middle',
      isRetentionCliff: false,
    },
  ],
};

export const mockPromptANoJokes: PromptAOutput = {
  scriptStats: {
    totalLines: 100,
    dialogueLines: 80,
    estimatedRuntime: 22,
    wordCount: 3000,
    sceneCount: 5,
    characters: [],
  },
  jokes: [],
  characters: {},
  gaps: [],
};

export const mockPromptAHighComplexity: PromptAOutput = {
  scriptStats: {
    totalLines: 300,
    dialogueLines: 250,
    estimatedRuntime: 90,
    wordCount: 25000,
    sceneCount: 30,
    characters: ['Alice', 'Bob', 'Charlie'],
  },
  jokes: [
    {
      id: 1,
      lineNumber: 10,
      complexity: 'advanced',
      isCallback: false,
      character: 'Alice',
      text: 'Complex setup',
      technique: 'misdirection',
      setupLine: null,
    },
    {
      id: 2,
      lineNumber: 50,
      complexity: 'high',
      isCallback: true,
      character: 'Bob',
      text: 'High complexity payoff',
      technique: 'callback',
      setupLine: 10,
    },
    {
      id: 3,
      lineNumber: 100,
      complexity: 'advanced',
      isCallback: false,
      character: 'Charlie',
      text: 'Another advanced joke',
      technique: 'subversion',
      setupLine: null,
    },
  ],
  characters: {
    Alice: {
      jokeCount: 1,
      complexity: { basic: 0, standard: 0, intermediate: 0, advanced: 1, high: 0 },
    },
    Bob: {
      jokeCount: 1,
      complexity: { basic: 0, standard: 0, intermediate: 0, advanced: 0, high: 1 },
    },
    Charlie: {
      jokeCount: 1,
      complexity: { basic: 0, standard: 0, intermediate: 0, advanced: 1, high: 0 },
    },
  },
  gaps: [],
};

export const mockPromptAUnbalanced: PromptAOutput = {
  scriptStats: {
    totalLines: 200,
    dialogueLines: 150,
    estimatedRuntime: 22,
    wordCount: 5000,
    sceneCount: 8,
    characters: ['Alice', 'Bob'],
  },
  jokes: [
    { id: 1, lineNumber: 10, complexity: 'standard', isCallback: false, character: 'Alice', text: 'Joke 1', technique: 'observational', setupLine: null },
    { id: 2, lineNumber: 20, complexity: 'standard', isCallback: false, character: 'Alice', text: 'Joke 2', technique: 'observational', setupLine: null },
    { id: 3, lineNumber: 30, complexity: 'standard', isCallback: false, character: 'Alice', text: 'Joke 3', technique: 'observational', setupLine: null },
    { id: 4, lineNumber: 40, complexity: 'standard', isCallback: false, character: 'Alice', text: 'Joke 4', technique: 'observational', setupLine: null },
    { id: 5, lineNumber: 50, complexity: 'standard', isCallback: false, character: 'Bob', text: 'Joke 5', technique: 'observational', setupLine: null },
  ],
  characters: {
    Alice: {
      jokeCount: 4,
      complexity: { basic: 0, standard: 4, intermediate: 0, advanced: 0, high: 0 },
    },
    Bob: {
      jokeCount: 1,
      complexity: { basic: 0, standard: 1, intermediate: 0, advanced: 0, high: 0 },
    },
  },
  gaps: [],
};

export const mockPromptAWithRetentionCliff: PromptAOutput = {
  scriptStats: {
    totalLines: 500,
    dialogueLines: 400,
    estimatedRuntime: 30,
    wordCount: 12000,
    sceneCount: 15,
    characters: ['Alice', 'Bob'],
  },
  jokes: [
    { id: 1, lineNumber: 10, complexity: 'standard', isCallback: false, character: 'Alice', text: 'Joke 1', technique: 'observational', setupLine: null },
    { id: 2, lineNumber: 20, complexity: 'standard', isCallback: false, character: 'Bob', text: 'Joke 2', technique: 'observational', setupLine: null },
  ],
  characters: {
    Alice: {
      jokeCount: 1,
      complexity: { basic: 0, standard: 1, intermediate: 0, advanced: 0, high: 0 },
    },
    Bob: {
      jokeCount: 1,
      complexity: { basic: 0, standard: 1, intermediate: 0, advanced: 0, high: 0 },
    },
  },
  gaps: [
    {
      startLine: 50,
      endLine: 200,
      duration: 18, // > 3 minutes = retention cliff
      position: 'late',
      isRetentionCliff: true,
    },
    {
      startLine: 250,
      endLine: 300,
      duration: 2,
      position: 'middle',
      isRetentionCliff: false,
    },
  ],
};

export const mockPromptAAllBasicJokes: PromptAOutput = {
  scriptStats: {
    totalLines: 150,
    dialogueLines: 120,
    estimatedRuntime: 22,
    wordCount: 4000,
    sceneCount: 6,
    characters: ['Alice'],
  },
  jokes: [
    { id: 1, lineNumber: 10, complexity: 'basic', isCallback: false, character: 'Alice', text: 'Hack 1', technique: 'pun', setupLine: null },
    { id: 2, lineNumber: 20, complexity: 'basic', isCallback: false, character: 'Alice', text: 'Hack 2', technique: 'pun', setupLine: null },
    { id: 3, lineNumber: 30, complexity: 'basic', isCallback: false, character: 'Alice', text: 'Hack 3', technique: 'pun', setupLine: null },
    { id: 4, lineNumber: 40, complexity: 'basic', isCallback: false, character: 'Alice', text: 'Hack 4', technique: 'pun', setupLine: null },
    { id: 5, lineNumber: 50, complexity: 'basic', isCallback: false, character: 'Alice', text: 'Hack 5', technique: 'pun', setupLine: null },
  ],
  characters: {
    Alice: {
      jokeCount: 5,
      complexity: { basic: 5, standard: 0, intermediate: 0, advanced: 0, high: 0 },
    },
  },
  gaps: [],
};
