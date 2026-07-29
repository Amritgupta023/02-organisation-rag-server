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
    chunk.qdrantPointId ||
    randomUUID();

  try {
    await DocumentChunk.findByIdAndUpdate(
      chunk._id,
      {
        $set: {
          embeddingStatus:
            "processing",

          embeddingError: null,
        },
      },
      {
        runValidators: true,
      },
    );

    const vector =
      await createDocumentEmbedding({
        content: chunk.content,

        title:
          document.originalName,
      });

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
          embeddingStatus:
            "completed",

          embeddingModel:
            EMBEDDING_CONFIG.MODEL,

          embeddingDimensions:
            EMBEDDING_CONFIG.VECTOR_SIZE,

          qdrantPointId: pointId,

          embeddedAt: new Date(),

          embeddingError: null,
        },
      },
      {
        runValidators: true,
      },
    );

    return {
      chunkId:
        chunk._id.toString(),

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
      {
        runValidators: true,
      },
    );

    return {
      chunkId:
        chunk._id.toString(),

      success: false,

      error:
        error.message ||
        "Embedding generation failed",
    };
  }
}

async function updateDocumentEmbeddingSummary(
  documentId,
) {
  const [
    completedChunkCount,
    failedChunkCount,
    totalChunkCount,
  ] = await Promise.all([
    DocumentChunk.countDocuments({
      documentId,
      embeddingStatus: "completed",
    }),

    DocumentChunk.countDocuments({
      documentId,
      embeddingStatus: "failed",
    }),

    DocumentChunk.countDocuments({
      documentId,
    }),
  ]);

  let finalStatus = "completed";

  if (
    totalChunkCount === 0 ||
    completedChunkCount === 0
  ) {
    finalStatus = "failed";
  } else if (
    completedChunkCount <
    totalChunkCount
  ) {
    finalStatus =
      "partially_failed";
  }

  await Document.findByIdAndUpdate(
    documentId,
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
    {
      runValidators: true,
    },
  );

  return {
    totalChunkCount,
    completedChunkCount,
    failedChunkCount,
    finalStatus,
  };
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

  if (
    document.status !== "processed"
  ) {
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
      $in: [
        "pending",
        "failed",
        "processing",
      ],
    };
  }

  const chunks =
    await DocumentChunk.find(
      chunkFilter,
    ).sort({
      chunkIndex: 1,
    });

  if (!chunks.length) {
    const summary =
      await updateDocumentEmbeddingSummary(
        document._id,
      );

    return {
      documentId:
        document._id.toString(),

      totalChunks:
        summary.totalChunkCount,

      processedNow: 0,

      completedChunks:
        summary.completedChunkCount,

      failedChunks:
        summary.failedChunkCount,

      status:
        summary.finalStatus,

      errors: [],
    };
  }

  await Document.findByIdAndUpdate(
    document._id,
    {
      $set: {
        embeddingStatus:
          "processing",

        embeddingModel:
          EMBEDDING_CONFIG.MODEL,

        embeddingDimensions:
          EMBEDDING_CONFIG.VECTOR_SIZE,

        failedChunkCount: 0,
      },
    },
    {
      runValidators: true,
    },
  );

  const results = [];

  for (
    let index = 0;
    index < chunks.length;
    index +=
      EMBEDDING_CONFIG.BATCH_SIZE
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

  const summary =
    await updateDocumentEmbeddingSummary(
      document._id,
    );

  return {
    documentId:
      document._id.toString(),

    totalChunks:
      summary.totalChunkCount,

    processedNow: results.length,

    completedChunks:
      summary.completedChunkCount,

    failedChunks:
      summary.failedChunkCount,

    status:
      summary.finalStatus,

    errors: results
      .filter(
        (result) =>
          !result.success,
      )
      .map((result) => ({
        chunkId:
          result.chunkId,

        message:
          result.error,
      })),
  };
}