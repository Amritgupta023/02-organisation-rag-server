export const EMBEDDING_CONFIG = {
  MODEL: "gemini-embedding-2",

  VECTOR_SIZE: 768,

  DOCUMENT_PREFIX:
    "Represent this organisation document passage for retrieval:\n",

  MAX_RETRIES: 3,

  RETRY_DELAY_MS: 1000,

  /*
   * Ek time par bahut saari Gemini calls avoid karenge.
   * Basic learning version mein sequential batches use honge.
   */
  BATCH_SIZE: 5,
};