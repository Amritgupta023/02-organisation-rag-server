import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing in the .env file");
}

const ai = new GoogleGenAI({
  apiKey,
});

export async function generateGeminiResponse(message) {
  if (!message || typeof message !== "string") {
    throw new Error("A valid message is required");
  }

  const interaction = await ai.interactions.create({
    model,
    input: message.trim(),
  });

  const answer = interaction.output_text;

  if (!answer) {
    throw new Error("Gemini returned an empty response");
  }

  return answer;
}