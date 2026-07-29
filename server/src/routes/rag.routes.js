import express from "express";
import {
  askRagQuestionController,
} from "../controllers/rag.controller.js";

const router = express.Router();

router.post(
  "/ask",
  askRagQuestionController,
);

export default router;