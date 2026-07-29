import express from "express";
import {
  embedDocumentController,
} from "../controllers/document-embedding.controller.js";

const router = express.Router();

router.post(
  "/documents/:documentId/embeddings",
  embedDocumentController,
);

export default router;