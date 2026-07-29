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
      `Expected ${EMBEDDING_CONFIG.VECTOR_SIZE} dimensions but received ${vector.length}`,
    );
  }

  const hasInvalidValue = vector.some(
    (value) =>
      typeof value !== "number" ||
      !Number.isFinite(value),
  );

  if (hasInvalidValue) {
    throw new Error(
      "Gemini returned an invalid embedding vector",
    );
  }
}

export async function createDocumentEmbedding(
  content,
) {
  if (
    typeof content !== "string" ||
    !content.trim()
  ) {
    throw new Error(
      "Chunk content is required for embedding",
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
          model: EMBEDDING_CONFIG.MODEL,

          contents: content.trim(),

          config: {
            taskType:
              EMBEDDING_CONFIG.DOCUMENT_TASK_TYPE,

            outputDimensionality:
              EMBEDDING_CONFIG.VECTOR_SIZE,

            title:
              "Organisation document chunk",
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