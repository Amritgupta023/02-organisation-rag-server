import { GoogleGenAI } from "@google/genai";
import { EMBEDDING_CONFIG } from "../config/embedding.config.js";

const geminiApiKey =
  process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error(
    "GEMINI_API_KEY is missing from environment variables",
  );
}

const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
});

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function getErrorStatus(error) {
  return (
    error?.status ||
    error?.statusCode ||
    error?.response?.status ||
    error?.cause?.status
  );
}

function shouldRetryRequest(error) {
  const status = getErrorStatus(error);

  return [
    429,
    500,
    502,
    503,
    504,
  ].includes(status);
}

function validateEmbeddingVector(vector) {
  if (!Array.isArray(vector)) {
    throw new Error(
      "Gemini embedding response does not contain a vector",
    );
  }

  if (
    vector.length !==
    EMBEDDING_CONFIG.VECTOR_SIZE
  ) {
    throw new Error(
      `Expected ${EMBEDDING_CONFIG.VECTOR_SIZE} embedding dimensions but received ${vector.length}`,
    );
  }

  const containsInvalidValue = vector.some(
    (value) =>
      typeof value !== "number" ||
      !Number.isFinite(value),
  );

  if (containsInvalidValue) {
    throw new Error(
      "Gemini returned an invalid embedding vector",
    );
  }
}

async function createEmbedding(input) {
  if (
    typeof input !== "string" ||
    !input.trim()
  ) {
    throw new Error(
      "Embedding input is required",
    );
  }

  let lastError = null;

  for (
    let attempt = 1;
    attempt <= EMBEDDING_CONFIG.MAX_RETRIES;
    attempt += 1
  ) {
    try {
      const response =
        await ai.models.embedContent({
          model:
            EMBEDDING_CONFIG.MODEL,

          contents: input.trim(),

          config: {
            outputDimensionality:
              EMBEDDING_CONFIG.VECTOR_SIZE,
          },
        });

      const vector =
        response.embeddings?.[0]?.values;

      validateEmbeddingVector(vector);

      return vector;
    } catch (error) {
      lastError = error;

      const hasMoreAttempts =
        attempt <
        EMBEDDING_CONFIG.MAX_RETRIES;

      if (
        !hasMoreAttempts ||
        !shouldRetryRequest(error)
      ) {
        break;
      }

      await wait(
        EMBEDDING_CONFIG.RETRY_DELAY_MS *
          attempt,
      );
    }
  }

  throw new Error(
    lastError?.message ||
      "Unable to generate Gemini embedding",
  );
}

export async function createDocumentEmbedding({
  content,
  title,
}) {
  if (
    typeof content !== "string" ||
    !content.trim()
  ) {
    throw new Error(
      "Document content is required for embedding",
    );
  }

  const documentTitle =
    typeof title === "string" &&
    title.trim()
      ? title.trim()
      : "none";

  const formattedDocument =
    `title: ${documentTitle} | text: ${content.trim()}`;

  return createEmbedding(
    formattedDocument,
  );
}

export async function createQueryEmbedding(
  query,
) {
  if (
    typeof query !== "string" ||
    !query.trim()
  ) {
    throw new Error(
      "Question is required for embedding",
    );
  }

  const formattedQuery =
    `task: question answering | query: ${query.trim()}`;

  return createEmbedding(
    formattedQuery,
  );
}