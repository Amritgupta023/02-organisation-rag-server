import { CHUNK_CONFIG } from "../config/chunk.config.js";

function normalizeTextForChunking(text) {
  if (typeof text !== "string") {
    throw new Error(
      "Document text must be a string",
    );
  }

  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findPreferredSplitPosition(
  text,
  maximumLength,
) {
  if (text.length <= maximumLength) {
    return text.length;
  }

  const minimumPreferredPosition =
    Math.floor(maximumLength * 0.6);

  const candidateText = text.slice(
    0,
    maximumLength + 1,
  );

  const separators = [
    "\n\n",
    "\n",
    ". ",
    "? ",
    "! ",
    "; ",
    ", ",
    " ",
  ];

  for (const separator of separators) {
    const position =
      candidateText.lastIndexOf(separator);

    if (
      position >= minimumPreferredPosition
    ) {
      return position + separator.length;
    }
  }

  return maximumLength;
}

function createChunkRecord({
  content,
  chunkIndex,
  startCharacter,
}) {
  const normalizedContent = content.trim();

  return {
    chunkIndex,
    content: normalizedContent,
    characterCount:
      normalizedContent.length,
    startCharacter,
    endCharacter:
      startCharacter +
      normalizedContent.length,
  };
}

export function splitTextIntoChunks(
  inputText,
  {
    chunkSize = CHUNK_CONFIG.CHUNK_SIZE,
    chunkOverlap =
      CHUNK_CONFIG.CHUNK_OVERLAP,
  } = {},
) {
  const text =
    normalizeTextForChunking(inputText);

  if (!text) {
    return [];
  }

  if (
    !Number.isInteger(chunkSize) ||
    chunkSize <= 0
  ) {
    throw new Error(
      "Chunk size must be a positive integer",
    );
  }

  if (
    !Number.isInteger(chunkOverlap) ||
    chunkOverlap < 0
  ) {
    throw new Error(
      "Chunk overlap cannot be negative",
    );
  }

  if (chunkOverlap >= chunkSize) {
    throw new Error(
      "Chunk overlap must be smaller than chunk size",
    );
  }

  const chunks = [];

  let cursor = 0;
  let chunkIndex = 0;

  while (cursor < text.length) {
    const remainingText = text.slice(cursor);

    const splitLength =
      findPreferredSplitPosition(
        remainingText,
        chunkSize,
      );

    const rawChunk = remainingText.slice(
      0,
      splitLength,
    );

    const trimmedChunk = rawChunk.trim();

    if (
      trimmedChunk.length >=
        CHUNK_CONFIG.MIN_CHUNK_LENGTH ||
      chunks.length === 0
    ) {
      const leadingWhitespaceLength =
        rawChunk.length -
        rawChunk.trimStart().length;

      const actualStart =
        cursor + leadingWhitespaceLength;

      chunks.push(
        createChunkRecord({
          content: trimmedChunk,
          chunkIndex,
          startCharacter: actualStart,
        }),
      );

      chunkIndex += 1;
    }

    if (
      chunks.length >
      CHUNK_CONFIG.MAX_CHUNKS_PER_DOCUMENT
    ) {
      throw new Error(
        `Document exceeds the maximum limit of ${CHUNK_CONFIG.MAX_CHUNKS_PER_DOCUMENT} chunks`,
      );
    }

    if (cursor + splitLength >= text.length) {
      break;
    }

    const nextCursor =
      cursor + splitLength - chunkOverlap;

    /*
     * Defensive condition:
     * cursor hamesha forward move karna chahiye.
     */
    cursor = Math.max(
      cursor + 1,
      nextCursor,
    );
  }

  return chunks;
}