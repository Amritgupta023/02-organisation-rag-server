import { UPLOAD_CONFIG } from "../config/upload.config.js";
import {
  createDocument,
  deleteDocumentById,
  getAllDocuments,
  getDocumentById,
} from "../services/document.service.js";
import { extractTextFromPdf } from "../services/pdf.service.js";

function createTextPreview(text) {
  if (
    text.length <=
    UPLOAD_CONFIG.TEXT_PREVIEW_LENGTH
  ) {
    return text;
  }

  return `${text.slice(
    0,
    UPLOAD_CONFIG.TEXT_PREVIEW_LENGTH,
  )}...`;
}

export async function uploadDocumentController(
  req,
  res,
) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "PDF document is required",
      });
    }

    const pdfResult =
      await extractTextFromPdf(
        req.file.buffer,
      );

    const document = await createDocument({
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      pageCount: pdfResult.pageCount,
      extractedText: pdfResult.text,
      characterCount:
        pdfResult.characterCount,
    });

    return res.status(201).json({
      success: true,

      data: {
        id: document._id,
        originalName: document.originalName,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        pageCount: document.pageCount,
        characterCount:
          document.characterCount,
        status: document.status,
        sourceType: document.sourceType,
        textPreview: createTextPreview(
          document.extractedText,
        ),
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Upload document error:",
      error,
    );

    return res
      .status(error.statusCode || 500)
      .json({
        success: false,
        message:
          error.statusCode
            ? error.message
            : "Unable to process PDF document",
        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
  }
}

export async function getDocumentsController(
  req,
  res,
) {
  try {
    const documents =
      await getAllDocuments();

    const documentSummaries = documents.map(
      (document) => ({
        id: document._id,
        originalName: document.originalName,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        pageCount: document.pageCount,
        characterCount:
          document.characterCount,
        status: document.status,
        sourceType: document.sourceType,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      }),
    );

    return res.status(200).json({
      success: true,
      data: documentSummaries,
    });
  } catch (error) {
    console.error(
      "Get documents error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load documents",
    });
  }
}

export async function getDocumentController(
  req,
  res,
) {
  try {
    const { documentId } = req.params;

    const document =
      await getDocumentById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    return res.status(200).json({
      success: true,

      data: {
        id: document._id,
        originalName: document.originalName,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        pageCount: document.pageCount,
        characterCount:
          document.characterCount,
        extractedText:
          document.extractedText,
        status: document.status,
        sourceType: document.sourceType,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Get document error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load document",
    });
  }
}

export async function deleteDocumentController(
  req,
  res,
) {
  try {
    const { documentId } = req.params;

    const deletedDocument =
      await deleteDocumentById(documentId);

    if (!deletedDocument) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Document deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete document error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Unable to delete document",
    });
  }
}