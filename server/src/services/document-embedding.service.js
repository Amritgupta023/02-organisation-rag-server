import { randomUUID } from "node:crypto";
import { EMBEDDING_CONFIG } from "../config/embedding.config.js";
import Document from "../models/Document.js";
import DocumentChunk from "../models/DocumentChunk.js";
import { createDocumentEmbedding } from "./embedding.service.js";
import {
  ensureQdrantCollection,
  upsertChunkVector,
} from "./qdrant.service.js";

async function processSingleChunk({
  chunk,
  document,
}) {
  const pointId =
    chunk.qdrantPointId || randomUUID();

  try {
    await DocumentChunk.findByIdAndUpdate(
      chunk._id,
      {
        $set: {
          embeddingStatus: "processing",
          embeddingError: null,
        },
      },
    );

    const vector =
      await createDocumentEmbedding(
        chunk.content,
      );

    await upsertChunkVector({
      pointId,
      vector,
      chunk,
      document,
    });

    await DocumentChunk.findByIdAndUpdate(
      chunk._id,
      {
        $set: {
          embeddingStatus: "completed",
          embeddingModel:
            EMBEDDING_CONFIG.MODEL,
          embeddingDimensions:
            EMBEDDING_CONFIG.VECTOR_SIZE,
          qdrantPointId: pointId,
          embeddedAt: new Date(),
          embeddingError: null,
        },
      },
    );

    return {
      chunkId: chunk._id,
      success: true,
    };
  } catch (error) {
    await DocumentChunk.findByIdAndUpdate(
      chunk._id,
      {
        $set: {
          embeddingStatus: "failed",
          embeddingError:
            error.message ||
            "Embedding generation failed",
        },
      },
    );

    return {
      chunkId: chunk._id,
      success: false,
      error:
        error.message ||
        "Embedding generation failed",
    };
  }
}

export async function embedDocumentChunks(
  documentId,
  {
    force = false,
  } = {},
) {
  await ensureQdrantCollection();

  const document =
    await Document.findById(documentId);

  if (!document) {
    const error = new Error(
      "Document not found",
    );

    error.statusCode = 404;

    throw error;
  }

  if (document.status !== "processed") {
    const error = new Error(
      "Only processed documents can be embedded",
    );

    error.statusCode = 409;

    throw error;
  }

  const chunkFilter = {
    documentId: document._id,
  };

  if (!force) {
    chunkFilter.embeddingStatus = {
      $in: ["pending", "failed"],
    };
  }

  const chunks = await DocumentChunk.find(
    chunkFilter,
  ).sort({
    chunkIndex: 1,
  });

  if (!chunks.length) {
    const existingCompletedCount =
      await DocumentChunk.countDocuments({
        documentId: document._id,
        embeddingStatus: "completed",
      });

    return {
      documentId: document._id,
      totalChunks: document.chunkCount,
      processedNow: 0,
      completedChunks:
        existingCompletedCount,
      failedChunks: 0,
      status:
        existingCompletedCount ===
        document.chunkCount
          ? "completed"
          : document.embeddingStatus,
    };
  }

  await Document.findByIdAndUpdate(
    document._id,
    {
      $set: {
        embeddingStatus: "processing",
        embeddingModel:
          EMBEDDING_CONFIG.MODEL,
        embeddingDimensions:
          EMBEDDING_CONFIG.VECTOR_SIZE,
      },
    },
  );

  const results = [];

  /*
   * Small batches process karenge.
   * Batch ke andar parallel calls.
   */
  for (
    let index = 0;
    index < chunks.length;
    index += EMBEDDING_CONFIG.BATCH_SIZE
  ) {
    const batch = chunks.slice(
      index,
      index +
        EMBEDDING_CONFIG.BATCH_SIZE,
    );

    const batchResults =
      await Promise.all(
        batch.map((chunk) =>
          processSingleChunk({
            chunk,
            document,
          }),
        ),
      );

    results.push(...batchResults);
  }

  const completedChunkCount =
    await DocumentChunk.countDocuments({
      documentId: document._id,
      embeddingStatus: "completed",
    });

  const failedChunkCount =
    await DocumentChunk.countDocuments({
      documentId: document._id,
      embeddingStatus: "failed",
    });

  let finalStatus = "completed";

  if (completedChunkCount === 0) {
    finalStatus = "failed";
  } else if (failedChunkCount > 0) {
    finalStatus = "partially_failed";
  }

  await Document.findByIdAndUpdate(
    document._id,
    {
      $set: {
        embeddingStatus: finalStatus,

        embeddedChunkCount:
          completedChunkCount,

        failedChunkCount,

        embeddingModel:
          EMBEDDING_CONFIG.MODEL,

        embeddingDimensions:
          EMBEDDING_CONFIG.VECTOR_SIZE,

        embeddedAt:
          finalStatus === "completed"
            ? new Date()
            : null,
      },
    },
  );

  return {
    documentId: document._id,
    totalChunks: document.chunkCount,
    processedNow: results.length,
    completedChunks:
      completedChunkCount,
    failedChunks: failedChunkCount,
    status: finalStatus,
    errors: results
      .filter((result) => !result.success)
      .map((result) => ({
        chunkId: result.chunkId,
        message: result.error,
      })),
  };
}