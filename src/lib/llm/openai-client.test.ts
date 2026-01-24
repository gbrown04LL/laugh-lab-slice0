import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock OpenAI module
const mockCreate = vi.fn();

vi.mock('openai', () => {
  const mockCreateFn = vi.fn();
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: mockCreateFn,
        },
      };
    },
    __mockCreate: mockCreateFn,
  };
});

import { callLLM } from './openai-client';
// @ts-ignore
import { __mockCreate } from 'openai';

describe('OpenAI Client', () => {
  const mockCreate = __mockCreate;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('callLLM - Successful Calls', () => {
    it('should call OpenAI with correct parameters', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Response text',
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      });

      await callLLM('System prompt', 'User message');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
          messages: [
            { role: 'system', content: 'System prompt' },
            { role: 'user', content: 'User message' },
          ],
          temperature: 0.3,
          max_tokens: 4096,
        })
      );
    });

    it('should return successful text response', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Test response',
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      });

      const result = await callLLM('System', 'User');

      expect(result.success).toBe(true);
      expect(result.data).toBe('Test response');
      expect(result.error).toBeUndefined();
    });

    it('should include usage statistics', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Response',
            },
          },
        ],
        usage: {
          prompt_tokens: 123,
          completion_tokens: 456,
          total_tokens: 579,
        },
      });

      const result = await callLLM('System', 'User');

      expect(result.usage).toEqual({
        promptTokens: 123,
        completionTokens: 456,
        totalTokens: 579,
      });
    });

    it('should handle missing usage data gracefully', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Response',
            },
          },
        ],
        usage: undefined,
      });

      const result = await callLLM('System', 'User');

      expect(result.usage).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });
    });
  });

  describe('callLLM - JSON Mode', () => {
    it('should parse JSON response correctly', async () => {
      const jsonData = { key: 'value', number: 123 };

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(jsonData),
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      });

      const result = await callLLM('System', 'User', { responseFormat: 'json' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(jsonData);
    });

    it('should set response_format for JSON mode', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: '{"test": true}',
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      });

      await callLLM('System', 'User', { responseFormat: 'json' });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          response_format: { type: 'json_object' },
        })
      );
    });

    it('should not set response_format for text mode', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Text response',
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      });

      await callLLM('System', 'User', { responseFormat: 'text' });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          response_format: undefined,
        })
      );
    });

    it('should handle invalid JSON response', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Not valid JSON {]',
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      });

      const result = await callLLM('System', 'User', { responseFormat: 'json' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to parse JSON response');
      expect(result.data).toBeUndefined();
    });

    it('should handle complex nested JSON', async () => {
      const complexJson = {
        level1: {
          level2: {
            array: [1, 2, 3],
            bool: true,
          },
        },
      };

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(complexJson),
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      });

      const result = await callLLM('System', 'User', { responseFormat: 'json' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(complexJson);
    });
  });

  describe('callLLM - Options', () => {
    it('should use custom temperature', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      });

      await callLLM('System', 'User', { temperature: 0.8 });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.8,
        })
      );
    });

    it('should use custom maxTokens', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      });

      await callLLM('System', 'User', { maxTokens: 1000 });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 1000,
        })
      );
    });

    it('should use default temperature when not specified', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      });

      await callLLM('System', 'User');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.3,
        })
      );
    });

    it('should use default maxTokens when not specified', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      });

      await callLLM('System', 'User');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 4096,
        })
      );
    });

    it('should accept temperature of 0', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      });

      await callLLM('System', 'User', { temperature: 0 });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0,
        })
      );
    });

    it('should combine all options correctly', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '{"result": "test"}' } }],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      });

      await callLLM('System', 'User', {
        temperature: 0.5,
        maxTokens: 2000,
        responseFormat: 'json',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.5,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
        })
      );
    });
  });

  describe('callLLM - Error Handling', () => {
    it('should handle empty response content', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 0,
          total_tokens: 100,
        },
      });

      const result = await callLLM('System', 'User');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Empty response from LLM');
    });

    it('should handle missing choices array', async () => {
      mockCreate.mockResolvedValue({
        choices: [],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 0,
          total_tokens: 100,
        },
      });

      const result = await callLLM('System', 'User');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Empty response from LLM');
    });

    it('should handle API errors', async () => {
      mockCreate.mockRejectedValue(new Error('API rate limit exceeded'));

      const result = await callLLM('System', 'User');

      expect(result.success).toBe(false);
      expect(result.error).toBe('API rate limit exceeded');
    });

    it('should handle network errors', async () => {
      mockCreate.mockRejectedValue(new Error('Network timeout'));

      const result = await callLLM('System', 'User');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network timeout');
    });

    it('should handle non-Error exceptions', async () => {
      mockCreate.mockRejectedValue('String error');

      const result = await callLLM('System', 'User');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown LLM error');
    });

    it('should log errors to console', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockCreate.mockRejectedValue(new Error('Test error'));

      await callLLM('System', 'User');

      expect(consoleErrorSpy).toHaveBeenCalledWith('[LLM Error]', 'Test error');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('callLLM - Edge Cases', () => {
    it('should handle very long prompts', async () => {
      const longPrompt = 'A'.repeat(10000);

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
        usage: { prompt_tokens: 5000, completion_tokens: 10, total_tokens: 5010 },
      });

      const result = await callLLM('System', longPrompt);

      expect(result.success).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ content: longPrompt }),
          ]),
        })
      );
    });

    it('should handle unicode characters in prompts', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Response 世界' } }],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      });

      const result = await callLLM('System 🎭', 'User 世界');

      expect(result.success).toBe(true);
      expect(result.data).toBe('Response 世界');
    });

    it('should handle empty strings in prompts', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      });

      const result = await callLLM('', '');

      expect(result.success).toBe(true);
    });

    it('should handle whitespace-only responses', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '   ' } }],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      });

      const result = await callLLM('System', 'User');

      expect(result.success).toBe(true);
      expect(result.data).toBe('   ');
    });

    it('should handle zero token usage', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      });

      const result = await callLLM('System', 'User');

      expect(result.usage).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });
    });
  });

  describe('callLLM - Type Safety', () => {
    it('should properly type JSON responses', async () => {
      interface TestType {
        name: string;
        count: number;
      }

      const data: TestType = { name: 'test', count: 5 };

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(data) } }],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      });

      const result = await callLLM<TestType>('System', 'User', {
        responseFormat: 'json',
      });

      if (result.success && result.data) {
        expect(result.data.name).toBe('test');
        expect(result.data.count).toBe(5);
      }
    });

    it('should handle text responses with generic type', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Plain text' } }],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      });

      const result = await callLLM<string>('System', 'User');

      if (result.success) {
        expect(typeof result.data).toBe('string');
      }
    });
  });
});
