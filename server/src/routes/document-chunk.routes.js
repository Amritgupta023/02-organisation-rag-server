import express from "express";
import {
  getDocumentChunksController,
} from "../controllers/document-chunk.controller.js";

const router = express.Router();

router.get(
  "/documents/:documentId/chunks",
  getDocumentChunksController,
);

export default router;