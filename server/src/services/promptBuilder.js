import {
  convertHistoryToGeminiContents,
} from "../utils/conversation.utils.js";

/**
 * Gemini ke liye complete multi-turn contents array banata hai.
 */
export function buildConversationContents(
  history,
  currentMessage,
) {
  const previousContents =
    convertHistoryToGeminiContents(history);

  const currentUserContent = {
    role: "user",
    parts: [
      {
        text: currentMessage,
      },
    ],
  };

  return [
    ...previousContents,
    currentUserContent,
  ];
}