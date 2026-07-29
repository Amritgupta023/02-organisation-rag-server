import {
  qdrantClient,
  QDRANT_COLLECTION_NAME,
} from "../config/qdrant.config.js";
import { EMBEDDING_CONFIG } from "../config/embedding.config.js";

export async function ensureQdrantCollection() {
  const collections =
    await qdrantClient.getCollections();

  const exists =
    collections.collections.some(
      (collection) =>
        collection.name ===
        QDRANT_COLLECTION_NAME,
    );

  if (!exists) {
    await qdrantClient.createCollection(
      QDRANT_COLLECTION_NAME,
      {
        vectors: {
          size:
            EMBEDDING_CONFIG.VECTOR_SIZE,
          distance: "Cosine",
        },
      },
    );

    console.log(
      `Created Qdrant collection: ${QDRANT_COLLECTION_NAME}`,
    );

    return;
  }

  const collectionInfo =
    await qdrantClient.getCollection(
      QDRANT_COLLECTION_NAME,
    );

  const configuredVectorSize =
    collectionInfo.config?.params
      ?.vectors?.size;

  if (
    configuredVectorSize &&
    configuredVectorSize !==
      EMBEDDING_CONFIG.VECTOR_SIZE
  ) {
    throw new Error(
      `Qdrant vector size mismatch. Expected ${EMBEDDING_CONFIG.VECTOR_SIZE}, found ${configuredVectorSize}.`,
    );
  }
}

export async function upsertChunkVector({
  pointId,
  vector,
  chunk,
  document,
}) {
  if (
    !Array.isArray(vector) ||
    vector.length !==
      EMBEDDING_CONFIG.VECTOR_SIZE
  ) {
    throw new Error(
      `Vector must contain ${EMBEDDING_CONFIG.VECTOR_SIZE} dimensions.`,
    );
  }

  await ensureQdrantCollection();

  return qdrantClient.upsert(
    QDRANT_COLLECTION_NAME,
    {
      wait: true,

      points: [
        {
          id: pointId,

          vector,

          payload: {
            chunkId:
              chunk._id.toString(),

            documentId:
              document._id.toString(),

            chunkIndex:
              chunk.chunkIndex,

            content:
              chunk.content,

            originalName:
              document.originalName,

            sourceType:
              document.sourceType,

            pageNumber:
              chunk.metadata
                ?.pageNumber ?? null,

            characterCount:
              chunk.characterCount,

            startCharacter:
              chunk.startCharacter,

            endCharacter:
              chunk.endCharacter,

            embeddingModel:
              EMBEDDING_CONFIG.MODEL,
          },
        },
      ],
    },
  );
}

export async function searchSimilarChunks({
  vector,
  limit = 5,
  scoreThreshold = 0.3,
  documentId,
}) {
  await ensureQdrantCollection();

  const query = {
    query: vector,

    limit,

    score_threshold:
      scoreThreshold,

    with_payload: true,

    with_vector: false,
  };

  if (documentId) {
    query.filter = {
      must: [
        {
          key: "documentId",

          match: {
            value:
              documentId.toString(),
          },
        },
      ],
    };
  }

  const response =
    await qdrantClient.query(
      QDRANT_COLLECTION_NAME,
      query,
    );

  const points =
    response?.points ||
    response?.result?.points ||
    response?.result ||
    [];

  return points.map((point) => ({
    pointId:
      point.id?.toString(),

    score:
      Number(point.score) || 0,

    chunkId:
      point.payload.chunkId,

    documentId:
      point.payload.documentId,

    chunkIndex:
      point.payload.chunkIndex,

    content:
      point.payload.content,

    originalName:
      point.payload.originalName,

    sourceType:
      point.payload.sourceType,

    pageNumber:
      point.payload.pageNumber,

    startCharacter:
      point.payload.startCharacter,

    endCharacter:
      point.payload.endCharacter,
  }));
}

export async function getQdrantCollectionInfo() {
  await ensureQdrantCollection();

  return qdrantClient.getCollection(
    QDRANT_COLLECTION_NAME,
  );
}

export async function getQdrantPoints({
  limit = 5,
} = {}) {
  await ensureQdrantCollection();

  const response =
    await qdrantClient.scroll(
      QDRANT_COLLECTION_NAME,
      {
        limit,

        with_payload: true,

        with_vector: true,
      },
    );

  const points =
    response.points ||
    response.result?.points ||
    [];

  return points.map((point) => ({
    id: point.id,

    payload:
      point.payload,

    vector:
      point.vector,

    vectorDimensions:
      Array.isArray(point.vector)
        ? point.vector.length
        : 0,
  }));
}

export async function deleteDocumentVectors(
  documentId,
) {
  await ensureQdrantCollection();

  return qdrantClient.delete(
    QDRANT_COLLECTION_NAME,
    {
      wait: true,

      filter: {
        must: [
          {
            key: "documentId",

            match: {
              value:
                documentId.toString(),
            },
          },
        ],
      },
    },
  );
}