import express from "express";
import {
  deleteDocumentController,
  getDocumentController,
  getDocumentsController,
  uploadDocumentController,
} from "../controllers/document.controller.js";
import {
  uploadSinglePdf,
} from "../middlewares/upload.middleware.js";

const router = express.Router();

router.post(
  "/upload",
  uploadSinglePdf,
  uploadDocumentController,
);

router.get(
  "/",
  getDocumentsController,
);

router.get(
  "/:documentId",
  getDocumentController,
);

router.delete(
  "/:documentId",
  deleteDocumentController,
);

export default router;