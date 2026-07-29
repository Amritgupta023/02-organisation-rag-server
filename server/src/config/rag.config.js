function parsePositiveInteger(value, fallback) {
  const parsedValue = Number.parseInt(value, 10);

  if (
    Number.isInteger(parsedValue) &&
    parsedValue > 0
  ) {
    return parsedValue;
  }

  return fallback;
}

function parseScoreThreshold(value, fallback) {
  const parsedValue = Number(value);

  if (
    Number.isFinite(parsedValue) &&
    parsedValue >= -1 &&
    parsedValue <= 1
  ) {
    return parsedValue;
  }

  return fallback;
}

export const RAG_CONFIG = {
  TOP_K: parsePositiveInteger(
    process.env.RAG_TOP_K,
    5,
  ),

  SCORE_THRESHOLD: parseScoreThreshold(
    process.env.RAG_SCORE_THRESHOLD,
    0.3,
  ),

  MAX_CONTEXT_CHARACTERS:
    parsePositiveInteger(
      process.env
        .RAG_MAX_CONTEXT_CHARACTERS,
      12000,
    ),

  CHAT_MODEL:
    process.env.GEMINI_CHAT_MODEL ||
    "gemini-3-flash-preview",

  FALLBACK_ANSWER:
    "I could not find this information in the uploaded documents.",
};