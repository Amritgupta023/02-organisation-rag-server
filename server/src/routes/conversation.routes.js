import express from "express";
import {
  createConversationController,
  deleteConversationController,
  getConversationController,
  getConversationsController,
} from "../controllers/conversation.controller.js";

const router = express.Router();

router.post("/", createConversationController);

router.get("/", getConversationsController);

router.get(
  "/:conversationId",
  getConversationController,
);

router.delete(
  "/:conversationId",
  deleteConversationController,
);

export default router;