import { useEffect, useState } from "react";
import {
  deleteDocument,
  getDocument,
  getDocuments,
  uploadDocument,
} from "../services/documentApi";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(
      1,
    )} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function DocumentManager() {
  const [selectedFile, setSelectedFile] =
    useState(null);

  const [documents, setDocuments] =
    useState([]);

  const [selectedDocument, setSelectedDocument] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(false);

  const [isUploading, setIsUploading] =
    useState(false);

  const [error, setError] = useState("");

  async function loadDocuments() {
    const result = await getDocuments();

    setDocuments(result);

    return result;
  }

  useEffect(() => {
    async function initializeDocuments() {
      try {
        setIsLoading(true);

        await loadDocuments();
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    }

    initializeDocuments();
  }, []);

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    setError("");
    setSelectedFile(null);

    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Please select a PDF file");
      event.target.value = "";
      return;
    }

    if (
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("File must have a .pdf extension");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(
        "PDF cannot exceed 5 MB",
      );
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  }

  async function handleUpload(event) {
    event.preventDefault();

    if (!selectedFile || isUploading) {
      return;
    }

    try {
      setIsUploading(true);
      setError("");

      const uploadedDocument =
        await uploadDocument(selectedFile);

      setSelectedFile(null);

      const fileInput =
        document.getElementById(
          "document-upload",
        );

      if (fileInput) {
        fileInput.value = "";
      }

      await loadDocuments();

      const fullDocument =
        await getDocument(
          uploadedDocument.id,
        );

      setSelectedDocument(fullDocument);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleViewDocument(
    documentId,
  ) {
    try {
      setIsLoading(true);
      setError("");

      const document =
        await getDocument(documentId);

      setSelectedDocument(document);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteDocument(
    documentId,
  ) {
    try {
      setIsLoading(true);
      setError("");

      await deleteDocument(documentId);

      setDocuments((previous) =>
        previous.filter(
          (item) => item.id !== documentId,
        ),
      );

      if (
        selectedDocument?.id === documentId
      ) {
        setSelectedDocument(null);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="document-manager">
      <header className="document-header">
        <div>
          <h2>Knowledge Documents</h2>

          <p>
            Upload organisation PDF documents.
          </p>
        </div>
      </header>

      <form
        className="upload-form"
        onSubmit={handleUpload}
      >
        <label
          className="file-input-label"
          htmlFor="document-upload"
        >
          Select PDF
        </label>

        <input
          id="document-upload"
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        {selectedFile && (
          <div className="selected-file">
            <strong>
              {selectedFile.name}
            </strong>

            <span>
              {formatFileSize(
                selectedFile.size,
              )}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={
            !selectedFile || isUploading
          }
        >
          {isUploading
            ? "Processing PDF..."
            : "Upload and extract text"}
        </button>
      </form>

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}

      <div className="document-content">
        <div className="document-list">
          <h3>Uploaded documents</h3>

          {isLoading &&
            documents.length === 0 && (
              <p>Loading documents...</p>
            )}

          {!isLoading &&
            documents.length === 0 && (
              <p className="empty-document-text">
                No documents uploaded.
              </p>
            )}

          {documents.map((item) => (
            <article
              key={item.id}
              className={`document-card ${
                selectedDocument?.id ===
                item.id
                  ? "document-card--active"
                  : ""
              }`}
            >
              <button
                type="button"
                className="document-view-button"
                onClick={() =>
                  handleViewDocument(item.id)
                }
                disabled={isLoading}
              >
                <strong>
                  {item.originalName}
                </strong>

                <span>
                  {item.pageCount} pages
                </span>

                <span>
                  {formatFileSize(
                    item.fileSize,
                  )}
                </span>

                <span>
                  {item.characterCount.toLocaleString()}
                  {" characters"}
                </span>
              </button>

              <button
                type="button"
                className="document-delete-button"
                onClick={() =>
                  handleDeleteDocument(
                    item.id,
                  )
                }
                disabled={isLoading}
                aria-label={`Delete ${item.originalName}`}
              >
                Delete
              </button>
            </article>
          ))}
        </div>

        <div className="document-preview">
          <h3>Extracted text preview</h3>

          {!selectedDocument && (
            <p className="empty-document-text">
              Select a document to inspect its
              extracted text.
            </p>
          )}

          {selectedDocument && (
            <>
              <div className="document-metadata">
                <strong>
                  {
                    selectedDocument.originalName
                  }
                </strong>

                <span>
                  {selectedDocument.pageCount}
                  {" pages"}
                </span>

                <span>
                  {selectedDocument.characterCount.toLocaleString()}
                  {" characters"}
                </span>
              </div>

              <pre className="extracted-text">
                {
                  selectedDocument.extractedText
                }
              </pre>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default DocumentManager;