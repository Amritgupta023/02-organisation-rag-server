export const AI_CONFIG = {
    MODEL: process.env.GEMINI_MODEL || "gemini-3.6-flash",

    TEMPERATURE: 0.2,  

    MAX_OUTPUT_TOKENS: 2048,

    TOP_P: 0.95, 

    TOP_K: 20
};