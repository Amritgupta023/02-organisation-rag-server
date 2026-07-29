const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

async function parseResponse(response) {
  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      "Server returned an invalid response",
    );
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Request failed",
    );
  }

  return result.data;
}

export async function uploadDocument(
  file,
) {
  const formData = new FormData();

  formData.append(
    "document",
    file,
  );

  const response = await fetch(
    `${API_BASE_URL}/documents/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  return parseResponse(response);
}

export async function getDocuments() {
  const response = await fetch(
    `${API_BASE_URL}/documents`,
  );

  return parseResponse(response);
}

export async function getDocument(
  documentId,
) {
  const response = await fetch(
    `${API_BASE_URL}/documents/${documentId}`,
  );

  return parseResponse(response);
}

export async function getDocumentChunks(
  documentId,
) {
  const response = await fetch(
    `${API_BASE_URL}/documents/${documentId}/chunks`,
  );

  return parseResponse(response);
}

export async function generateDocumentEmbeddings(
  documentId,
  {
    force = false,
  } = {},
) {
  const response = await fetch(
    `${API_BASE_URL}/documents/${documentId}/embeddings`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        force,
      }),
    },
  );

  return parseResponse(response);
}

export async function deleteDocument(
  documentId,
) {
  const response = await fetch(
    `${API_BASE_URL}/documents/${documentId}`,
    {
      method: "DELETE",
    },
  );

  const result =
    await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Unable to delete document",
    );
  }

  return result;
}