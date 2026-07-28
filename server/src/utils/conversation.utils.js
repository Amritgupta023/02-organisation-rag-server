import { AI_CONFIG } from "../config/ai.config.js";

const ALLOWED_ROLES = new Set(["user", "assistant"]);

/**
 * User message ko normalize aur validate karta hai.
 */
export function sanitizeMessage(message) {
  if (typeof message !== "string") {
    throw new Error("Message must be a string");
  }

  const normalizedMessage = message
    .replace(/\s+/g, " ")
    .trim();

  if (!normalizedMessage) {
    throw new Error("Message is required");
  }

  if (normalizedMessage.length > AI_CONFIG.MAX_MESSAGE_LENGTH) {
    throw new Error(
      `Message cannot exceed ${AI_CONFIG.MAX_MESSAGE_LENGTH} characters`,
    );
  }

  return normalizedMessage;
}

/**
 * Frontend se aayi conversation history ko validate karta hai.
 */
export function sanitizeHistory(history) {
  if (history === undefined) {
    return [];
  }

  if (!Array.isArray(history)) {
    throw new Error("History must be an array");
  }

  const sanitizedHistory = history
    .filter((item) => {
      return (
        item &&
        typeof item === "object" &&
        ALLOWED_ROLES.has(item.role) &&
        typeof item.content === "string" &&
        item.content.trim()
      );
    })
    .map((item) => ({
      role: item.role,
      content: item.content
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, AI_CONFIG.MAX_MESSAGE_LENGTH),
    }));

  return sanitizedHistory.slice(
    -AI_CONFIG.MAX_HISTORY_MESSAGES,
  );
}

/**
 * Application roles ko Gemini roles mein convert karta hai.
 *
 * Application role: assistant
 * Gemini role: model
 */
export function convertHistoryToGeminiContents(history) {
  return history.map((item) => ({
    role: item.role === "assistant" ? "model" : "user",
    parts: [
      {
        text: item.content,
      },
    ],
  }));
}