import {
  createConversation,
  deleteConversationById,
  getAllConversations,
  getConversationById,
} from "../services/conversation.service.js";

export async function createConversationController(
  req,
  res,
) {
  try {
    const conversation = await createConversation();

    return res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error(
      "Create conversation error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Unable to create conversation",
    });
  }
}

export async function getConversationsController(
  req,
  res,
) {
  try {
    const conversations =
      await getAllConversations();

    const conversationSummaries =
      conversations.map((conversation) => ({
        id: conversation._id,
        title: conversation.title,
        messageCount:
          conversation.messages?.length ?? 0,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      }));

    return res.status(200).json({
      success: true,
      data: conversationSummaries,
    });
  } catch (error) {
    console.error(
      "Get conversations error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load conversations",
    });
  }
}

export async function getConversationController(
  req,
  res,
) {
  try {
    const { conversationId } = req.params;

    const conversation =
      await getConversationById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error(
      "Get conversation error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load conversation",
    });
  }
}

export async function deleteConversationController(
  req,
  res,
) {
  try {
    const { conversationId } = req.params;

    const deletedConversation =
      await deleteConversationById(conversationId);

    if (!deletedConversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete conversation error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Unable to delete conversation",
    });
  }
}