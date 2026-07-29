import { GoogleGenAI } from "@google/genai";
import mongoose from "mongoose";
import { RAG_CONFIG } from "../config/rag.config.js";
import { createQueryEmbedding } from "./embedding.service.js";
import { searchSimilarChunks } from "./qdrant.service.js";

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

function validateQuestion(question) {
  if (
    typeof question !== "string" ||
    !question.trim()
  ) {
    const error = new Error(
      "Question is required",
    );

    error.statusCode = 400;

    throw error;
  }

  if (
    question.trim().length > 2000
  ) {
    const error = new Error(
      "Question cannot exceed 2000 characters",
    );

    error.statusCode = 400;

    throw error;
  }

  return question.trim();
}

function validateDocumentId(
  documentId,
) {
  if (!documentId) {
    return null;
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      documentId,
    )
  ) {
    const error = new Error(
      "Invalid document ID",
    );

    error.statusCode = 400;

    throw error;
  }

  return documentId;
}

function buildContext(chunks) {
  let currentLength = 0;

  const selectedChunks = [];

  for (const chunk of chunks) {
    const sourceHeader = [
      `Source: ${chunk.originalName}`,
      `Chunk: ${chunk.chunkIndex + 1}`,
      chunk.pageNumber
        ? `Page: ${chunk.pageNumber}`
        : null,
      `Similarity: ${chunk.score.toFixed(4)}`,
    ]
      .filter(Boolean)
      .join(" | ");

    const contextPart =
      `[${sourceHeader}]\n${chunk.content}`;

    if (
      currentLength +
        contextPart.length >
      RAG_CONFIG.MAX_CONTEXT_CHARACTERS
    ) {
      break;
    }

    selectedChunks.push({
      ...chunk,
      contextPart,
    });

    currentLength +=
      contextPart.length;
  }

  return {
    context: selectedChunks
      .map(
        (chunk) =>
          chunk.contextPart,
      )
      .join("\n\n---\n\n"),

    selectedChunks,
  };
}

function buildPrompt({
  question,
  context,
}) {
  return `
You are an organisation knowledge assistant.

Your job is to answer the user's question only from the supplied document context.

Rules:
1. Use only information explicitly present in the context.
2. Do not use outside knowledge.
3. Do not invent policies, dates, contacts, amounts or procedures.
4. If the context does not contain enough information, reply exactly:
"${RAG_CONFIG.FALLBACK_ANSWER}"
5. Answer in the same language as the user's question.
6. Keep the answer clear and direct.
7. Do not mention similarity scores.
8. Do not create fake citations.
9. When useful, mention the source document name naturally.

DOCUMENT CONTEXT:
${context}

USER QUESTION:
${question}

ANSWER:
`.trim();
}

function formatSource(chunk) {
  return {
    pointId: chunk.pointId,

    chunkId: chunk.chunkId,

    documentId:
      chunk.documentId,

    documentName:
      chunk.originalName,

    chunkIndex:
      chunk.chunkIndex,

    pageNumber:
      chunk.pageNumber,

    score: Number(
      chunk.score.toFixed(4),
    ),

    preview:
      chunk.content.length > 300
        ? `${chunk.content.slice(
            0,
            300,
          )}...`
        : chunk.content,
  };
}

export async function askRagQuestion({
  question,
  documentId,
}) {
  const cleanQuestion =
    validateQuestion(question);

  const cleanDocumentId =
    validateDocumentId(
      documentId,
    );

  const queryVector =
    await createQueryEmbedding(
      cleanQuestion,
    );

  const retrievedChunks =
    await searchSimilarChunks({
      vector: queryVector,

      limit: RAG_CONFIG.TOP_K,

      scoreThreshold:
        RAG_CONFIG.SCORE_THRESHOLD,

      documentId:
        cleanDocumentId,
    });

  if (!retrievedChunks.length) {
    return {
      answer:
        RAG_CONFIG.FALLBACK_ANSWER,

      grounded: false,

      sources: [],

      retrieval: {
        searchedChunks: 0,

        topK:
          RAG_CONFIG.TOP_K,

        scoreThreshold:
          RAG_CONFIG.SCORE_THRESHOLD,

        documentId:
          cleanDocumentId,
      },
    };
  }

  const {
    context,
    selectedChunks,
  } = buildContext(
    retrievedChunks,
  );

  if (!context) {
    return {
      answer:
        RAG_CONFIG.FALLBACK_ANSWER,

      grounded: false,

      sources: [],

      retrieval: {
        searchedChunks:
          retrievedChunks.length,

        topK:
          RAG_CONFIG.TOP_K,

        scoreThreshold:
          RAG_CONFIG.SCORE_THRESHOLD,

        documentId:
          cleanDocumentId,
      },
    };
  }

  const prompt = buildPrompt({
    question: cleanQuestion,
    context,
  });

  

  const response =
    await ai.models.generateContent({
      model:
        RAG_CONFIG.CHAT_MODEL,

      contents: prompt,

      config: {
        temperature: 0.1,

        maxOutputTokens: 1000,
      },
    });

  const answer =
    response.text?.trim() ||
    RAG_CONFIG.FALLBACK_ANSWER;

  const grounded =
    answer !==
    RAG_CONFIG.FALLBACK_ANSWER;

  return {
    answer,

    grounded,

    sources: grounded
      ? selectedChunks.map(
          formatSource,
        )
      : [],

    retrieval: {
      searchedChunks:
        retrievedChunks.length,

      usedChunks:
        selectedChunks.length,

      topK:
        RAG_CONFIG.TOP_K,

      scoreThreshold:
        RAG_CONFIG.SCORE_THRESHOLD,

      documentId:
        cleanDocumentId,

      model:
        RAG_CONFIG.CHAT_MODEL,
    },
  };
}