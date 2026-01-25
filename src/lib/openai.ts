import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

function getOpenAIClient(): OpenAI {
  if (openaiClient) {
    return openaiClient;
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required.");
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determine if an error is retryable (transient)
 * Retryable errors include:
 * - Rate limit errors (429)
 * - Server errors (500, 502, 503, 504)
 * - Connection/timeout errors
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof OpenAI.APIError) {
    const status = error.status;
    // Rate limit or server errors
    if (status === 429 || (status >= 500 && status < 600)) {
      return true;
    }
  }

  // Check for network/connection errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("timeout") ||
      message.includes("econnreset") ||
      message.includes("econnrefused") ||
      message.includes("network") ||
      message.includes("socket")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Execute an async function with exponential backoff retry logic
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  initialDelayMs: number = INITIAL_DELAY_MS
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if it's not a retryable error or we've exhausted retries
      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = initialDelayMs * Math.pow(2, attempt);
      console.warn(
        `[OpenAI] Transient error (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`,
        error instanceof Error ? error.message : String(error)
      );

      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

export async function callOpenAI(systemPrompt: string, userContent: unknown) {
  const openai = getOpenAIClient();

  const response = await withRetry(async () => {
    return openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: typeof userContent === "string" ? userContent : JSON.stringify(userContent) },
      ],
      response_format: { type: "json_object" },
    });
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  return JSON.parse(content);
}
