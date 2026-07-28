import { AI_CONFIG } from "../config/ai.config.js";
import { generateGeminiResponse } from "../services/gemini.service.js";
import {
  sanitizeHistory,
  sanitizeMessage,
} from "../utils/conversation.utils.js";

export async function chatController(req, res) {
  try {
    const { message, history } = req.body;

    const sanitizedMessage =
      sanitizeMessage(message);

    const sanitizedHistory =
      sanitizeHistory(history);

    const answer = await generateGeminiResponse({
      message: sanitizedMessage,
      history: sanitizedHistory,
    });

    return res.status(200).json({
      success: true,

      data: {
        question: sanitizedMessage,
        answer,
        model: AI_CONFIG.MODEL,
        historyMessagesUsed:
          sanitizedHistory.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Chat controller error:", error);

    const validationErrors = [
      "Message must be a string",
      "Message is required",
      "Message cannot exceed",
      "History must be an array",
    ];

    const isValidationError =
      validationErrors.some((validationError) =>
        error.message.startsWith(validationError),
      );

    return res
      .status(isValidationError ? 400 : 500)
      .json({
        success: false,
        message: isValidationError
          ? error.message
          : "Unable to generate Gemini response",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      });
  }
}