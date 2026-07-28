import { GoogleGenAI } from "@google/genai";
import { AI_CONFIG } from "../config/ai.config.js";
import { SYSTEM_PROMPT } from "../prompts/system.prompt.js";
import {
  buildConversationContents,
} from "./promptBuilder.js";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY is missing in the .env file",
  );
}

const ai = new GoogleGenAI({
  apiKey,
});

export async function generateGeminiResponse({
  message,
  history = [],
}) {
  const contents = buildConversationContents(
    history,
    message,
  );

  const response = await ai.models.generateContent({
    model: AI_CONFIG.MODEL,

    contents,

    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: AI_CONFIG.TEMPERATURE,
      topP: AI_CONFIG.TOP_P,
      topK: AI_CONFIG.TOP_K,
      maxOutputTokens: AI_CONFIG.MAX_OUTPUT_TOKENS,
    },
  });

  const answer = response.text?.trim();

  if (!answer) {
    throw new Error("Gemini returned an empty response");
  }

  return answer;
}