import OpenAI from "openai";
import { SCHEMA_VERSION } from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function callOpenAI(systemPrompt: string, userContent: any) {
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
