export const CHUNK_CONFIG = {
  /*
   * Initial learning configuration.
   *
   * Har chunk approximately 1200 characters ka hoga.
   */
  CHUNK_SIZE: 1200,

  /*
   * Previous chunk ke last 200 characters
   * next chunk mein repeat honge.
   */
  CHUNK_OVERLAP: 200,

  /*
   * Safety limit: ek document se maximum
   * kitne chunks create kiye ja sakte hain.
   */
  MAX_CHUNKS_PER_DOCUMENT: 5000,

  MIN_CHUNK_LENGTH: 50,
};