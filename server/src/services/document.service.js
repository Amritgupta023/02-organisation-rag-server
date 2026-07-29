import mongoose from "mongoose";
import { CHUNK_CONFIG } from "../config/chunk.config.js";
import Document from "../models/Document.js";
import DocumentChunk from "../models/DocumentChunk.js";
import {
  deleteDocumentVectors,
} from "./qdrant.service.js";

export function isValidDocumentId(documentId) {
  return mongoose.Types.ObjectId.isValid(
    documentId,
  );
}

export async function createDocument({
  originalName,
  mimeType,
  fileSize,
  pageCount,
  extractedText,
  characterCount,
}) {
  return Document.create({
    originalName,
    mimeType,
    fileSize,
    pageCount,
    extractedText,
    characterCount,

    chunkCount: 0,

    chunkSize:
      CHUNK_CONFIG.CHUNK_SIZE,

    chunkOverlap:
      CHUNK_CONFIG.CHUNK_OVERLAP,

    sourceType: "pdf",

    status: "processing",

    embeddingStatus: "pending",

    embeddedChunkCount: 0,

    failedChunkCount: 0,
  });
}

export async function createDocumentChunks({
  documentId,
  originalName,
  chunks,
}) {
  if (!chunks.length) {
    return [];
  }

  const chunkDocuments = chunks.map(
    (chunk) => ({
      documentId,

      chunkIndex:
        chunk.chunkIndex,

      content:
        chunk.content,

      characterCount:
        chunk.characterCount,

      startCharacter:
        chunk.startCharacter,

      endCharacter:
        chunk.endCharacter,

      metadata: {
        originalName,
        sourceType: "pdf",
        pageNumber: null,
      },

      embeddingStatus: "pending",

      embeddingModel: null,

      embeddingDimensions: null,

      qdrantPointId: null,

      embeddedAt: null,

      embeddingError: null,
    }),
  );

  return DocumentChunk.insertMany(
    chunkDocuments,
    {
      ordered: true,
    },
  );
}

export async function markDocumentProcessed({
  documentId,
  chunkCount,
}) {
  return Document.findByIdAndUpdate(
    documentId,
    {
      $set: {
        status: "processed",

        chunkCount,

        processingError: null,

        embeddingStatus: "pending",
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );
}

export async function markDocumentFailed({
  documentId,
  errorMessage,
}) {
  return Document.findByIdAndUpdate(
    documentId,
    {
      $set: {
        status: "failed",

        processingError:
          errorMessage,

        embeddingStatus: "failed",
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );
}

export async function getAllDocuments() {
  return Document.find()
    .select(
      [
        "originalName",
        "mimeType",
        "fileSize",
        "pageCount",
        "characterCount",
        "chunkCount",
        "chunkSize",
        "chunkOverlap",
        "status",
        "processingError",
        "embeddingStatus",
        "embeddedChunkCount",
        "failedChunkCount",
        "embeddingModel",
        "embeddingDimensions",
        "embeddedAt",
        "sourceType",
        "createdAt",
        "updatedAt",
      ].join(" "),
    )
    .sort({
      createdAt: -1,
    })
    .lean();
}

export async function getDocumentById(
  documentId,
) {
  if (!isValidDocumentId(documentId)) {
    return null;
  }

  return Document.findById(
    documentId,
  ).lean();
}

export async function getChunksByDocumentId(
  documentId,
) {
  if (!isValidDocumentId(documentId)) {
    return [];
  }

  return DocumentChunk.find({
    documentId,
  })
    .sort({
      chunkIndex: 1,
    })
    .lean();
}

export async function deleteChunksByDocumentId(
  documentId,
) {
  if (!isValidDocumentId(documentId)) {
    return {
      deletedCount: 0,
    };
  }

  return DocumentChunk.deleteMany({
    documentId,
  });
}

export async function deleteDocumentById(
  documentId,
) {
  if (!isValidDocumentId(documentId)) {
    return null;
  }

  const document =
    await Document.findById(documentId);

  if (!document) {
    return null;
  }

  try {
    await deleteDocumentVectors(
      documentId,
    );
  } catch (error) {
    console.error(
      "Unable to delete Qdrant vectors:",
      error.message,
    );

    /*
     * MongoDB records ko delete nahi karenge
     * agar vector cleanup fail ho jaye.
     */
    throw new Error(
      "Unable to delete document vectors from Qdrant",
    );
  }

  await DocumentChunk.deleteMany({
    documentId,
  });

  await document.deleteOne();

  return document;
}