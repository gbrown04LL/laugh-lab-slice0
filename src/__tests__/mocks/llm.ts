import { vi } from 'vitest';
import { LLMResponse } from '@/lib/llm/openai-client';
import { PromptAOutput } from '@/lib/llm/promptA';
import { PromptBOutput } from '@/lib/llm/promptB';

/**
 * Mock LLM response utilities for testing
 */

export function createMockLLMSuccess<T>(data: T): LLMResponse<T> {
  return {
    success: true,
    data,
    usage: {
      promptTokens: 1000,
      completionTokens: 500,
      totalTokens: 1500,
    },
  };
}

export function createMockLLMError(error: string): LLMResponse<any> {
  return {
    success: false,
    error,
  };
}

export function createMockLLMEmpty(): LLMResponse<any> {
  return {
    success: false,
    error: 'Empty response from LLM',
  };
}

/**
 * Creates a mock callLLM function that returns different responses based on call count
 */
export function createSequentialMockLLM<T1, T2>(
  firstResponse: LLMResponse<T1>,
  secondResponse: LLMResponse<T2>
) {
  let callCount = 0;

  return vi.fn().mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      return Promise.resolve(firstResponse);
    } else {
      return Promise.resolve(secondResponse);
    }
  });
}

/**
 * Creates a mock that fails on specific call number
 */
export function createFailingMockLLM(
  failOnCall: number,
  successResponse: LLMResponse<any>,
  errorResponse: LLMResponse<any>
) {
  let callCount = 0;

  return vi.fn().mockImplementation(() => {
    callCount++;
    if (callCount === failOnCall) {
      return Promise.resolve(errorResponse);
    }
    return Promise.resolve(successResponse);
  });
}

/**
 * Creates a mock that always succeeds with the given response
 */
export function createAlwaysSuccessMockLLM<T>(response: LLMResponse<T>) {
  return vi.fn().mockResolvedValue(response);
}

/**
 * Creates a mock that always fails with the given error
 */
export function createAlwaysFailMockLLM(error: string) {
  return vi.fn().mockResolvedValue(createMockLLMError(error));
}

/**
 * Creates a mock that throws an exception
 */
export function createThrowingMockLLM(errorMessage: string) {
  return vi.fn().mockRejectedValue(new Error(errorMessage));
}
