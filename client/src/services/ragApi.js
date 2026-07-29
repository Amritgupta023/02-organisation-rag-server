const API_BASE_URL =
  import.meta.env
    .VITE_API_BASE_URL ||
  "http://localhost:5000/api";

async function parseResponse(
  response,
) {
  let result;

  try {
    result =
      await response.json();
  } catch {
    throw new Error(
      "Server returned an invalid response",
    );
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
        "RAG request failed",
    );
  }

  return result.data;
}

export async function askDocumentQuestion({
  question,
  documentId,
}) {
  const response = await fetch(
    `${API_BASE_URL}/rag/ask`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        question,

        documentId:
          documentId || null,
      }),
    },
  );

  return parseResponse(response);
}