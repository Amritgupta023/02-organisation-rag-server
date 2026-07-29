import {
  qdrantClient,
  QDRANT_COLLECTION_NAME,
} from "../config/qdrant.config.js";
import { EMBEDDING_CONFIG } from "../config/embedding.config.js";

export async function ensureQdrantCollection() {
  const collectionsResponse =
    await qdrantClient.getCollections();

  const collectionExists =
    collectionsResponse.collections.some(
      (collection) =>
        collection.name ===
        QDRANT_COLLECTION_NAME,
    );

  if (!collectionExists) {
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
      `Qdrant collection created: ${QDRANT_COLLECTION_NAME}`,
    );

    return;
  }

  const collectionInfo =
    await qdrantClient.getCollection(
      QDRANT_COLLECTION_NAME,
    );

  const vectorConfiguration =
    collectionInfo.config?.params?.vectors;

  const configuredVectorSize =
    vectorConfiguration?.size;

  if (
    configuredVectorSize &&
    configuredVectorSize !==
      EMBEDDING_CONFIG.VECTOR_SIZE
  ) {
    throw new Error(
      `Qdrant collection vector size is ${configuredVectorSize}, but application vector size is ${EMBEDDING_CONFIG.VECTOR_SIZE}`,
    );
  }
}

export async function upsertChunkVector({
  pointId,
  vector,
  chunk,
  document,
}) {
  await qdrantClient.upsert(
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
              chunk.metadata?.pageNumber ??
              null,

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

export async function deleteDocumentVectors(
  documentId,
) {
  await ensureQdrantCollection();

  await qdrantClient.delete(
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