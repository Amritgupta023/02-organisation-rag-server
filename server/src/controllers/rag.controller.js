import { askRagQuestion } from "../services/rag.service.js";
import {
  addMessagesToConversation,
  createConversation,
  getConversationById,
  updateConversationTitle,
} from "../services/conversation.service.js";

function createConversationTitle(question) {
  return question.length <= 50
    ? question
    : `${question.slice(0, 50)}...`;
}

export async function askRagQuestionController(
  req,
  res,
) {
  try {
    const {
      question,
      documentId,
      conversationId,
    } = req.body;

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
      conversation = await createConversation();
    }

    const result =
      await askRagQuestion({
        question,
        documentId,
      });

    await addMessagesToConversation({
      conversationId: conversation._id,
      messages: [
        {
          role: "user",
          content: question.trim(),
        },
        {
          role: "assistant",
          content: result.answer,
          sources: result.sources,
          grounded: result.grounded,
        },
      ],
    });

    let title = conversation.title;

    if (title === "New conversation") {
      title = createConversationTitle(question.trim());
      await updateConversationTitle({
        conversationId: conversation._id,
        title,
      });
    }

    return res.status(200).json({
      success: true,

      data: {
        ...result,
        conversationId: conversation._id,
        title,
      },
    });
  } catch (error) {
    console.error(
      "RAG question error:",
      error,
    );

    return res
      .status(
        error.statusCode || 500,
      )
      .json({
        success: false,

        message:
          error.statusCode
            ? error.message
            : "Unable to answer the question from documents",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
  }
}
