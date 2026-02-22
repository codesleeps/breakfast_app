import { type JSONSchema7 } from "json-schema";
import { integrationsClient, showFakeData } from "@/client-lib/shared";

type ReasoningEffort = "low" | "medium" | "high";
type ModelProvider = "openai" | "google";

/**
 * @param reasoningEffort - The reasoning effort to use for the AI API (default: 'low')
 * 'low' - Faster but less accurate
 * 'medium' - Balanced speed and accuracy
 * 'high' - Slowest but most accurate - only use if user explicitly asks for it
 * @param modelProvider - The model provider to use for the AI API (default: 'openai')
 * 'openai' - to set the model to gpt-5 or equivalent
 * 'google' - to set the model to gemini-2.5-pro or equivalent
 */
export function generateText(
  prompt: string,
  enableWebSearch = false,
  enableDeepResearch = false,
  reasoningEffort: ReasoningEffort = "low",
  modelProvider: ModelProvider = "openai",
) {
  if (showFakeData) {
    return Promise.resolve("Generated text will be displayed here (unavailable in development mode)");
  }
  return integrationsClient
    .post<string>("/integrations/ai/generate-text", {
      prompt,
      enableWebSearch,
      enableDeepResearch,
      reasoningEffort,
      modelProvider,
    })
    .then((res) => res.data);
}

/**
 * Generate an object using the AI API
 *
 * @param prompt - The prompt to generate the object
 * @param jsonSchemaInput - The JSON schema input
 * @example See `fakeJsonShcemaInput` in `@/fake-data/integrations/ai.ts`
 * @param reasoningEffort - The reasoning effort to use for the AI API (default: 'low')
 * 'low' - Faster but less accurate
 * 'medium' - Balanced speed and accuracy
 * 'high' - Slowest but most accurate - only use if user explicitly asks for it
 * @param modelProvider - The model provider to use for the AI API (default: 'openai')
 * 'openai' - to set the model to gpt-5 or equivalent
 * 'google' - to set the model to gemini-2.5-pro or equivalent
 *
 * @returns The generated object
 * @example See `fakeJsonShcemaOutput` in `@/fake-data/integrations/ai.ts`
 */
export function generateObject<T>(
  prompt: string,
  jsonSchemaInput: JSONSchema7,
  reasoningEffort: ReasoningEffort = "low",
  modelProvider: ModelProvider = "openai",
): Promise<T> {
  if (showFakeData) {
    return Promise.resolve({
      email: "test@test.com",
      interest: 3,
      painPoints: ["Pain point 1", "Pain point 2"],
      goals: ["Goal 1", "Goal 2"],
      notes: "Suggested notes for closing the deal",
    } as T);
  }
  return integrationsClient
    .post<T>("/integrations/ai/generate-object", {
      prompt,
      jsonSchemaInput,
      reasoningEffort,
      modelProvider,
    })
    .then((res) => res.data);
}
