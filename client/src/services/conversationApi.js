const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

async function parseResponse(response) {
  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Request failed",
    );
  }

  return result.data;
}

export async function createConversation() {
  const response = await fetch(
    `${API_BASE_URL}/conversations`,
    {
      method: "POST",
    },
  );

  return parseResponse(response);
}

export async function getConversations() {
  const response = await fetch(
    `${API_BASE_URL}/conversations`,
  );

  return parseResponse(response);
}

export async function getConversation(
  conversationId,
) {
  const response = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}`,
  );

  return parseResponse(response);
}

export async function deleteConversation(
  conversationId,
) {
  const response = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}`,
    {
      method: "DELETE",
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Unable to delete conversation",
    );
  }

  return result;
}
