import OpenAI from 'openai';

// Lazy-initialize OpenAI client to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

const DEFAULT_MODEL = process.env.LAUGHLAB_LLM_MODEL || 'gpt-4o';

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
  }
): Promise<LLMResponse<T>> {
  try {
    const openai = getOpenAI();
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
    const message = error instanceof Error ? error.message : 'Unknown LLM error';
    console.error('[LLM Error]', message);
    return { success: false, error: message };
  }
}
