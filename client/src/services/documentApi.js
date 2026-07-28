const API_BASE_URL =
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

export async function uploadDocument(
  file,
) {
  const formData = new FormData();

  formData.append("document", file);

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

export async function deleteDocument(
  documentId,
) {
  const response = await fetch(
    `${API_BASE_URL}/documents/${documentId}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    const result = await response.json();

    throw new Error(
      result.message ||
        "Unable to delete document",
    );
  }
}