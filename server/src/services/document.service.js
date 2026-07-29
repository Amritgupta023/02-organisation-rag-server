import mongoose from "mongoose";
import { CHUNK_CONFIG } from "../config/chunk.config.js";
import Document from "../models/Document.js";
import DocumentChunk from "../models/DocumentChunk.js";

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
    chunkSize: CHUNK_CONFIG.CHUNK_SIZE,
    chunkOverlap:
      CHUNK_CONFIG.CHUNK_OVERLAP,
    sourceType: "pdf",
    status: "processing",
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
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      characterCount:
        chunk.characterCount,
      startCharacter:
        chunk.startCharacter,
      endCharacter: chunk.endCharacter,

      metadata: {
        originalName,
        sourceType: "pdf",

        /*
         * Current pdf parser se exact page mapping
         * preserve nahi ho rahi, isliye null.
         */
        pageNumber: null,
      },

      embeddingStatus: "pending",
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
        processingError: errorMessage,
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

  return Document.findById(documentId).lean();
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

  /*
   * Pehle related chunks delete karenge,
   * uske baad parent document.
   */
  await deleteChunksByDocumentId(
    documentId,
  );

  await document.deleteOne();

  return document;
}