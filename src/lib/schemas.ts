/**
 * JSON Schema exports for OpenAI Structured Outputs.
 *
 * These schemas are derived from the Zod schemas in types.ts using zod-to-json-schema.
 * They're used with callOpenAIWithSchema to enforce Truth Contract compliance at the API layer.
 */

import { zodToJsonSchema } from "zod-to-json-schema";
import {
  PromptAOutputSchema,
  PromptBOutputSchema,
} from "./types";
import type { JsonSchema } from "./openai";

/**
 * JSON Schema for Prompt A output.
 * Enforces: classification, metrics, issue_candidates structure.
 */
export const PromptAJsonSchema: JsonSchema = zodToJsonSchema(
  PromptAOutputSchema,
  { name: "PromptAResult", $refStrategy: "none" }
);

/**
 * JSON Schema for Prompt B output.
 * Enforces: sections structure with all required fields.
 */
export const PromptBJsonSchema: JsonSchema = zodToJsonSchema(
  PromptBOutputSchema,
  { name: "PromptBResult", $refStrategy: "none" }
);

/**
 * Get the schema definition portion (without wrapper metadata).
 * OpenAI Structured Outputs expects the raw schema object, not the zod-to-json-schema wrapper.
 */
export function getSchemaDefinition(schema: JsonSchema): JsonSchema {
  // zod-to-json-schema wraps the schema in a definitions object when using $refStrategy: "none"
  // We need to extract the actual schema
  if (schema && typeof schema === "object" && "definitions" in schema) {
    const defs = schema.definitions as Record<string, JsonSchema>;
    const firstKey = Object.keys(defs)[0];
    if (firstKey) {
      return defs[firstKey];
    }
  }
  // If no definitions wrapper, return as-is (already a raw schema)
  return schema;
}

/**
 * Prompt A schema ready for OpenAI Structured Outputs.
 */
export const PromptASchemaForOpenAI: JsonSchema = getSchemaDefinition(PromptAJsonSchema);

/**
 * Prompt B schema ready for OpenAI Structured Outputs.
 */
export const PromptBSchemaForOpenAI: JsonSchema = getSchemaDefinition(PromptBJsonSchema);
