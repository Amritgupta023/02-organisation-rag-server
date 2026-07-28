import { SYSTEM_PROMPT }
from "../prompts/system.prompt.js";

export function buildPrompt(userMessage){

return `
${SYSTEM_PROMPT}

User:

${userMessage}
`;
}