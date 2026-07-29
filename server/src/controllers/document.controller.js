import { UPLOAD_CONFIG } from "../config/upload.config.js";
import {
  createDocument,
  createDocumentChunks,
  deleteChunksByDocumentId,
  deleteDocumentById,
  getAllDocuments,
  getDocumentById,
  markDocumentFailed,
  markDocumentProcessed,
} from "../services/document.service.js";
import { extractTextFromPdf } from "../services/pdf.service.js";
import { splitTextIntoChunks } from "../services/chunk.service.js";
import {
  embedDocumentChunks,
} from "../services/document-embedding.service.js";

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

function formatDocumentSummary(document) {
  return {
    id: document._id,

    originalName:
      document.originalName,

    mimeType:
      document.mimeType,

    fileSize:
      document.fileSize,

    pageCount:
      document.pageCount,

    characterCount:
      document.characterCount,

    chunkCount:
      document.chunkCount,

    chunkSize:
      document.chunkSize,

    chunkOverlap:
      document.chunkOverlap,

    status:
      document.status,

    processingError:
      document.processingError,

    embeddingStatus:
      document.embeddingStatus ||
      "pending",

    embeddedChunkCount:
      document.embeddedChunkCount || 0,

    failedChunkCount:
      document.failedChunkCount || 0,

    embeddingModel:
      document.embeddingModel,

    embeddingDimensions:
      document.embeddingDimensions,

    embeddedAt:
      document.embeddedAt,

    sourceType:
      document.sourceType,

    createdAt:
      document.createdAt,

    updatedAt:
      document.updatedAt,
  };
}

export async function uploadDocumentController(
  req,
  res,
) {
  let createdDocument = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "PDF document is required",
      });
    }

    const pdfResult =
      await extractTextFromPdf(
        req.file.buffer,
      );

    createdDocument =
      await createDocument({
        originalName:
          req.file.originalname,

        mimeType:
          req.file.mimetype,

        fileSize:
          req.file.size,

        pageCount:
          pdfResult.pageCount,

        extractedText:
          pdfResult.text,

        characterCount:
          pdfResult.characterCount,
      });

    const chunks =
      splitTextIntoChunks(
        pdfResult.text,
      );

    if (!chunks.length) {
      const error = new Error(
        "Unable to create chunks from the document",
      );

      error.statusCode = 422;

      throw error;
    }

    await createDocumentChunks({
      documentId:
        createdDocument._id,

      originalName:
        createdDocument.originalName,

      chunks,
    });

    const processedDocument =
      await markDocumentProcessed({
        documentId:
          createdDocument._id,

        chunkCount:
          chunks.length,
      });

    /*
     * Level 7:
     * Chunking ke baad embeddings automatically
     * generate ho kar Qdrant mein save hongi.
     */
    const embeddingResult =
      await embedDocumentChunks(
        processedDocument._id,
      );

    const finalDocument =
      await getDocumentById(
        processedDocument._id,
      );

    return res.status(201).json({
      success: true,

      data: {
        ...formatDocumentSummary(
          finalDocument,
        ),

        textPreview:
          createTextPreview(
            finalDocument.extractedText,
          ),

        embeddingResult,
      },
    });
  } catch (error) {
    console.error(
      "Upload document error:",
      error,
    );

    if (createdDocument?._id) {
      try {
        await deleteChunksByDocumentId(
          createdDocument._id,
        );

        await markDocumentFailed({
          documentId:
            createdDocument._id,

          errorMessage:
            error.message,
        });
      } catch (cleanupError) {
        console.error(
          "Document cleanup error:",
          cleanupError,
        );
      }
    }

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

    return res.status(200).json({
      success: true,

      data: documents.map(
        formatDocumentSummary,
      ),
    });
  } catch (error) {
    console.error(
      "Get documents error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load documents",
    });
  }
}

export async function getDocumentController(
  req,
  res,
) {
  try {
    const { documentId } =
      req.params;

    const document =
      await getDocumentById(
        documentId,
      );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    return res.status(200).json({
      success: true,

      data: {
        ...formatDocumentSummary(
          document,
        ),

        extractedText:
          document.extractedText,
      },
    });
  } catch (error) {
    console.error(
      "Get document error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load document",
    });
  }
}

export async function deleteDocumentController(
  req,
  res,
) {
  try {
    const { documentId } =
      req.params;

    const deletedDocument =
      await deleteDocumentById(
        documentId,
      );

    if (!deletedDocument) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    return res.status(200).json({
      success: true,

      message:
        "Document, chunks and vectors deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete document error:",
      error,
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Unable to delete document",
    });
  }
}