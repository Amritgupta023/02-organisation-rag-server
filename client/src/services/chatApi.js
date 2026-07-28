const API_BASE_URL =
  "http://localhost:5000/api";

export async function sendChatMessage({
  message,
  conversationId,
}) {
  const response = await fetch(
    `${API_BASE_URL}/chat`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        message,
        conversationId,
      }),
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Unable to send message",
    );
  }

  return result.data;
}