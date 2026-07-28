import { AI_CONFIG } from "../config/ai.config.js";
import {
  addMessagesToConversation,
  createConversation,
  getConversationById,
  updateConversationTitle,
} from "../services/conversation.service.js";
import { generateGeminiResponse } from "../services/gemini.service.js";
import {
  sanitizeHistory,
  sanitizeMessage,
} from "../utils/conversation.utils.js";

function createConversationTitle(message) {
  const maximumTitleLength = 50;

  if (message.length <= maximumTitleLength) {
    return message;
  }

  return `${message.slice(
    0,
    maximumTitleLength,
  )}...`;
}

export async function chatController(req, res) {
  try {
    const { message, conversationId } = req.body;

    const sanitizedMessage =
      sanitizeMessage(message);

    let conversation;

    if (conversationId) {
      conversation =
        await getConversationById(conversationId);

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }
    } else {
      conversation = await createConversation({
        title: createConversationTitle(
          sanitizedMessage,
        ),
      });
    }

    const history = sanitizeHistory(
      conversation.messages,
    );

    const answer = await generateGeminiResponse({
      message: sanitizedMessage,
      history,
    });

    const updatedConversation =
      await addMessagesToConversation({
        conversationId: conversation._id,
        messages: [
          {
            role: "user",
            content: sanitizedMessage,
          },
          {
            role: "assistant",
            content: answer,
          },
        ],
      });

    if (
      conversation.title === "New conversation"
    ) {
      await updateConversationTitle({
        conversationId: conversation._id,
        title: createConversationTitle(
          sanitizedMessage,
        ),
      });
    }

    return res.status(200).json({
      success: true,

      data: {
        conversationId:
          updatedConversation._id,

        title: updatedConversation.title,

        question: sanitizedMessage,

        answer,

        model: AI_CONFIG.MODEL,

        historyMessagesUsed:
          history.length,

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