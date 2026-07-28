export const AI_CONFIG = {
  MODEL: process.env.GEMINI_MODEL || "gemini-3-flash-preview",

  TEMPERATURE: 0.2,

  TOP_P: 0.95,

  TOP_K: 20,

  MAX_OUTPUT_TOKENS: 2048,

  // Sirf latest 20 messages Gemini ko bhejenge.
  MAX_HISTORY_MESSAGES: 20,

  MAX_MESSAGE_LENGTH: 2000,
};