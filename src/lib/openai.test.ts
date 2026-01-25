import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import OpenAI from 'openai';

// Mock OpenAI module
const mockCreate = vi.fn();

vi.mock('openai', () => {
  // Create a mock APIError class
  class MockAPIError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'APIError';
    }
  }

  const mockCreateFn = vi.fn();
  return {
    default: class MockOpenAI {
      static APIError = MockAPIError;
      chat = {
        completions: {
          create: mockCreateFn,
        },
      };
    },
    __mockCreate: mockCreateFn,
    __MockAPIError: MockAPIError,
  };
});

import { callOpenAI, isRetryableError } from './openai';
// @ts-ignore
import { __mockCreate, __MockAPIError } from 'openai';

describe('OpenAI Client with Retry Logic', () => {
  const mockCreate = __mockCreate;
  const MockAPIError = __MockAPIError;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Mock console.warn to avoid noise in tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('isRetryableError', () => {
    it('should return true for rate limit errors (429)', () => {
      const error = new MockAPIError(429, 'Rate limit exceeded');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for server errors (500)', () => {
      const error = new MockAPIError(500, 'Internal server error');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for server errors (502)', () => {
      const error = new MockAPIError(502, 'Bad gateway');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for server errors (503)', () => {
      const error = new MockAPIError(503, 'Service unavailable');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for server errors (504)', () => {
      const error = new MockAPIError(504, 'Gateway timeout');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for client errors (400)', () => {
      const error = new MockAPIError(400, 'Bad request');
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for auth errors (401)', () => {
      const error = new MockAPIError(401, 'Unauthorized');
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for forbidden errors (403)', () => {
      const error = new MockAPIError(403, 'Forbidden');
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for not found errors (404)', () => {
      const error = new MockAPIError(404, 'Not found');
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return true for timeout errors', () => {
      const error = new Error('Connection timeout');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for connection reset errors', () => {
      const error = new Error('ECONNRESET');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for connection refused errors', () => {
      const error = new Error('ECONNREFUSED');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for network errors', () => {
      const error = new Error('Network error occurred');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for socket errors', () => {
      const error = new Error('Socket hang up');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for generic errors', () => {
      const error = new Error('Some random error');
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for non-Error values', () => {
      expect(isRetryableError('string error')).toBe(false);
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(undefined)).toBe(false);
    });
  });

  describe('callOpenAI - Successful Calls', () => {
    it('should return parsed JSON on success', async () => {
      const responseData = { analysis: 'test', score: 85 };
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(responseData) } }],
      });

      const result = await callOpenAI('System prompt', 'User content');

      expect(result).toEqual(responseData);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should call OpenAI with correct parameters', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '{"result": true}' } }],
      });

      await callOpenAI('Test system prompt', 'Test user content');

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'Test system prompt' },
          { role: 'user', content: 'Test user content' },
        ],
        response_format: { type: 'json_object' },
      });
    });

    it('should stringify non-string user content', async () => {
      const userContent = { key: 'value', nested: { data: true } };
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '{"result": true}' } }],
      });

      await callOpenAI('System', userContent);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            { role: 'user', content: JSON.stringify(userContent) },
          ]),
        })
      );
    });
  });

  describe('callOpenAI - Retry Logic', () => {
    it('should retry on rate limit errors (429)', async () => {
      const error = new MockAPIError(429, 'Rate limit exceeded');
      mockCreate
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          choices: [{ message: { content: '{"success": true}' } }],
        });

      const resultPromise = callOpenAI('System', 'User');

      // Fast-forward through the retry delay
      await vi.advanceTimersByTimeAsync(1000);

      const result = await resultPromise;
      expect(result).toEqual({ success: true });
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should retry on server errors (500)', async () => {
      const error = new MockAPIError(500, 'Internal server error');
      mockCreate
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          choices: [{ message: { content: '{"success": true}' } }],
        });

      const resultPromise = callOpenAI('System', 'User');

      await vi.advanceTimersByTimeAsync(1000);

      const result = await resultPromise;
      expect(result).toEqual({ success: true });
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff for retries', async () => {
      const error = new MockAPIError(503, 'Service unavailable');
      mockCreate
        .mockRejectedValueOnce(error) // First attempt fails
        .mockRejectedValueOnce(error) // Second attempt fails
        .mockResolvedValueOnce({
          choices: [{ message: { content: '{"success": true}' } }],
        });

      const resultPromise = callOpenAI('System', 'User');

      // First retry delay: 1000ms
      await vi.advanceTimersByTimeAsync(1000);
      expect(mockCreate).toHaveBeenCalledTimes(2);

      // Second retry delay: 2000ms (exponential backoff)
      await vi.advanceTimersByTimeAsync(2000);
      expect(mockCreate).toHaveBeenCalledTimes(3);

      const result = await resultPromise;
      expect(result).toEqual({ success: true });
    });

    it('should stop retrying after max retries', async () => {
      const error = new MockAPIError(500, 'Persistent server error');
      mockCreate.mockRejectedValue(error);

      // Catch the rejection immediately to avoid unhandled rejection warnings
      let caughtError: Error | undefined;
      const resultPromise = callOpenAI('System', 'User').catch((e) => {
        caughtError = e;
      });

      // Advance through all retries
      await vi.advanceTimersByTimeAsync(10000);
      await resultPromise;

      expect(caughtError).toBeDefined();
      expect(caughtError!.message).toBe('Persistent server error');
      // 1 initial + 3 retries = 4 total calls
      expect(mockCreate).toHaveBeenCalledTimes(4);
    });

    it('should not retry on non-retryable errors', async () => {
      const error = new MockAPIError(400, 'Bad request');
      mockCreate.mockRejectedValue(error);

      await expect(callOpenAI('System', 'User')).rejects.toThrow('Bad request');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should not retry on auth errors (401)', async () => {
      const error = new MockAPIError(401, 'Invalid API key');
      mockCreate.mockRejectedValue(error);

      await expect(callOpenAI('System', 'User')).rejects.toThrow('Invalid API key');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should retry on timeout errors', async () => {
      const timeoutError = new Error('Connection timeout');
      mockCreate
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce({
          choices: [{ message: { content: '{"success": true}' } }],
        });

      const resultPromise = callOpenAI('System', 'User');

      await vi.advanceTimersByTimeAsync(1000);

      const result = await resultPromise;
      expect(result).toEqual({ success: true });
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should retry on network errors', async () => {
      const networkError = new Error('Network error');
      mockCreate
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          choices: [{ message: { content: '{"success": true}' } }],
        });

      const resultPromise = callOpenAI('System', 'User');

      await vi.advanceTimersByTimeAsync(1000);

      const result = await resultPromise;
      expect(result).toEqual({ success: true });
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should log warnings for each retry attempt', async () => {
      const warnSpy = vi.spyOn(console, 'warn');
      const error = new MockAPIError(429, 'Rate limit');
      mockCreate
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          choices: [{ message: { content: '{"success": true}' } }],
        });

      const resultPromise = callOpenAI('System', 'User');

      await vi.advanceTimersByTimeAsync(1000);
      await resultPromise;

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[OpenAI] Transient error'),
        expect.any(String)
      );
    });
  });

  describe('callOpenAI - Error Handling', () => {
    it('should throw on empty response', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      await expect(callOpenAI('System', 'User')).rejects.toThrow(
        'OpenAI returned an empty response'
      );
    });

    it('should throw on invalid JSON response', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'not valid json' } }],
      });

      await expect(callOpenAI('System', 'User')).rejects.toThrow();
    });
  });
});
