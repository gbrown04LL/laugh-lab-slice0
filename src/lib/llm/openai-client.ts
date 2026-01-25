import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (openaiClient) {
    return openaiClient;
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required.');
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

const DEFAULT_MODEL = process.env.LAUGHLAB_LLM_MODEL || 'gpt-4o';

// Retry configuration
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determines if an error is transient and should be retried
 */
function isRetryableError(error: unknown): boolean {
  // Check for OpenAI API errors with status codes
  // Handle both real OpenAI.APIError and error-like objects with status
  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  ) {
    const status = (error as { status: number }).status;
    // Rate limit errors (429)
    if (status === 429) return true;
    // Server errors (500, 502, 503, 504)
    if (status >= 500 && status < 600) return true;
    // Connection/timeout errors
    if (status === 408) return true;
  }

  // Network errors often don't have a status
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('socket hang up') ||
      message.includes('network')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate exponential backoff delay with jitter
 */
function getBackoffDelay(attempt: number, baseDelay: number): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  // Add jitter (±25%) to prevent thundering herd
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  const delay = Math.min(exponentialDelay + jitter, MAX_DELAY_MS);
  return Math.round(delay);
}

export interface LLMResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export async function callLLM<T>(
  systemPrompt: string,
  userContent: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'json' | 'text';
    maxRetries?: number;
    baseDelayMs?: number;
  }
): Promise<LLMResponse<T>> {
  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelay = options?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const openai = getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 4096,
        response_format: options?.responseFormat === 'json'
          ? { type: 'json_object' }
          : undefined,
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        return { success: false, error: 'Empty response from LLM' };
      }

      // Parse JSON if expected
      if (options?.responseFormat === 'json') {
        try {
          const parsed = JSON.parse(content) as T;
          return {
            success: true,
            data: parsed,
            usage: {
              promptTokens: response.usage?.prompt_tokens ?? 0,
              completionTokens: response.usage?.completion_tokens ?? 0,
              totalTokens: response.usage?.total_tokens ?? 0,
            },
          };
        } catch {
          return { success: false, error: 'Failed to parse JSON response' };
        }
      }

      return {
        success: true,
        data: content as T,
        usage: {
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens: response.usage?.completion_tokens ?? 0,
          totalTokens: response.usage?.total_tokens ?? 0,
        },
      };
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt < maxRetries && isRetryableError(error)) {
        const delay = getBackoffDelay(attempt, baseDelay);
        console.warn(
          `[LLM Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed with retryable error. ` +
          `Retrying in ${delay}ms...`,
          error instanceof Error ? error.message : error
        );
        await sleep(delay);
        continue;
      }

      // Non-retryable error or max retries exceeded
      break;
    }
  }

  // All retries exhausted or non-retryable error
  const message = lastError instanceof Error ? lastError.message : 'Unknown LLM error';
  console.error('[LLM Error] All retries exhausted or non-retryable error:', message);
  return { success: false, error: message };
}
