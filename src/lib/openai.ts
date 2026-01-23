import OpenAI from "openai";
import { SCHEMA_VERSION } from "./types";

// Lazy-initialize OpenAI client to avoid build-time errors when env vars are missing
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export async function callOpenAI(systemPrompt: string, userContent: any) {
  const openai = getOpenAI();
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
