import { QdrantClient } from "@qdrant/js-client-rest";

const qdrantUrl =
  process.env.QDRANT_URL ||
  "http://localhost:6333";

const qdrantApiKey =
  process.env.QDRANT_API_KEY || undefined;

export const QDRANT_COLLECTION_NAME =
  process.env.QDRANT_COLLECTION_NAME ||
  "organisation_document_chunks";

export const qdrantClient =
  new QdrantClient({
    url: qdrantUrl,
    apiKey: qdrantApiKey,
    checkCompatibility: false,
  });