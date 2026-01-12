import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.trim(),
});

/**
 * JSON Schema type for OpenAI Structured Outputs.
 * Must be a valid JSON Schema object.
 */
export type JsonSchema = Record<string, unknown>;

/**
 * Legacy JSON-mode call (returns valid JSON but not schema-enforced).
 * Kept for backwards compatibility; prefer callOpenAIWithSchema for contract enforcement.
 */
export async function callOpenAI(systemPrompt: string, userContent: unknown): Promise<unknown> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: typeof userContent === "string" ? userContent : JSON.stringify(userContent) },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  return JSON.parse(content);
}

/**
 * Contract-first OpenAI call using Structured Outputs.
 *
 * Uses `response_format: { type: "json_schema", json_schema: {..., strict: true} }`
 * to enforce the model returns JSON matching the provided schema exactly.
 *
 * This is the preferred method for Truth Contract compliance.
 *
 * @see https://platform.openai.com/docs/api-reference/chat/create#chat-create-response_format
 */
export async function callOpenAIWithSchema<T>({
  model = "gpt-4o",
  system,
  user,
  schemaName,
  schema,
}: {
  model?: string;
  system: string;
  user: string;
  schemaName: string;
  schema: JsonSchema;
}): Promise<T> {
  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: schemaName,
        schema,
        strict: true,
      },
    },
  });

  const content = response.choices[0]?.message?.content ?? "";
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  return JSON.parse(content) as T;
}
