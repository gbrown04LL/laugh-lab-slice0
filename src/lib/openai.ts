import OpenAI from "openai";

// Default timeout of 120 seconds per OpenAI call
const DEFAULT_TIMEOUT_MS = 120_000;

/**
 * Get OpenAI client with validated API key.
 * Throws a clear error if OPENAI_API_KEY is not configured.
 */
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY environment variable is not set. " +
      "Please configure it in your Vercel project settings."
    );
  }

  return new OpenAI({ apiKey });
}

/**
 * Call OpenAI with a system prompt and user content.
 * Includes timeout handling to prevent hung requests on Vercel.
 *
 * @param systemPrompt - The system prompt for the LLM
 * @param userContent - User content (string or object to be JSON-stringified)
 * @param timeoutMs - Request timeout in milliseconds (default: 120s)
 */
export async function callOpenAI(
  systemPrompt: string,
  userContent: unknown,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<unknown> {
  const openai = getOpenAIClient();

  // Create AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await openai.chat.completions.create(
      {
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: typeof userContent === "string"
              ? userContent
              : JSON.stringify(userContent)
          },
        ],
        response_format: { type: "json_object" },
      },
      { signal: controller.signal }
    );

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("OpenAI returned an empty response");
    }

    return JSON.parse(content);
  } catch (error) {
    // Provide clearer error message for timeout
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `OpenAI request timed out after ${timeoutMs / 1000} seconds. ` +
        "The script may be too long or the API is experiencing delays."
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
