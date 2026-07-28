import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";

export function isValidConversationId(conversationId) {
  return mongoose.Types.ObjectId.isValid(conversationId);
}

export async function createConversation({
  title = "New conversation",
} = {}) {
  const conversation = await Conversation.create({
    title,
    messages: [],
  });

  return conversation;
}

export async function getAllConversations() {
  return Conversation.find()
    .select("title createdAt updatedAt messages")
    .sort({
      updatedAt: -1,
    })
    .lean();
}

export async function getConversationById(
  conversationId,
) {
  if (!isValidConversationId(conversationId)) {
    return null;
  }

  return Conversation.findById(conversationId).lean();
}

export async function addMessageToConversation({
  conversationId,
  role,
  content,
}) {
  if (!isValidConversationId(conversationId)) {
    return null;
  }

  return Conversation.findByIdAndUpdate(
    conversationId,
    {
      $push: {
        messages: {
          role,
          content,
        },
      },

      $set: {
        updatedAt: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );
}

export async function addMessagesToConversation({
  conversationId,
  messages,
}) {
  if (!isValidConversationId(conversationId)) {
    return null;
  }

  return Conversation.findByIdAndUpdate(
    conversationId,
    {
      $push: {
        messages: {
          $each: messages,
        },
      },

      $set: {
        updatedAt: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );
}

export async function updateConversationTitle({
  conversationId,
  title,
}) {
  if (!isValidConversationId(conversationId)) {
    return null;
  }

  return Conversation.findByIdAndUpdate(
    conversationId,
    {
      title,
    },
    {
      new: true,
      runValidators: true,
    },
  );
}

export async function deleteConversationById(
  conversationId,
) {
  if (!isValidConversationId(conversationId)) {
    return null;
  }

  return Conversation.findByIdAndDelete(
    conversationId,
  );
}