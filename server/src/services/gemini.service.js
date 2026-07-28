import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "../prompts/system.prompt.js";
import { AI_CONFIG } from "../config/ai.config.js";
import { buildPrompt } from "./promptBuilder.js";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

export async function generateGeminiResponse(message) {

const prompt = buildPrompt(message);

    const response =
        await ai.models.generateContent({

            model: AI_CONFIG.MODEL,

            contents: prompt,

            config: {

                temperature: AI_CONFIG.TEMPERATURE,

                topP: AI_CONFIG.TOP_P,

                topK: AI_CONFIG.TOP_K,

                maxOutputTokens:
                    AI_CONFIG.MAX_OUTPUT_TOKENS
            }

        });

    return response.text;
}