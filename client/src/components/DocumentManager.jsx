import {
  useEffect,
  useState,
} from "react";
import {
  ArrowClockwiseIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import {
  deleteDocument,
  generateDocumentEmbeddings,
  getDocument,
  getDocumentChunks,
  getDocuments,
  uploadDocument,
} from "../services/documentApi";

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) {
    return "Unknown size";
  }

  if (bytes < 1024) {
    return `${bytes} bytes`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Not available";
  }

  return new Date(
    dateValue,
  ).toLocaleString();
}

function DocumentManager() {
  const [
    selectedFile,
    setSelectedFile,
  ] = useState(null);

  const [
    documents,
    setDocuments,
  ] = useState([]);

  const [
    selectedDocument,
    setSelectedDocument,
  ] = useState(null);

  const [
    chunks,
    setChunks,
  ] = useState([]);

  const [
    previewMode,
    setPreviewMode,
  ] = useState("text");

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    isUploading,
    setIsUploading,
  ] = useState(false);

  const [
    embeddingDocumentId,
    setEmbeddingDocumentId,
  ] = useState(null);

  const [
    deletingDocumentId,
    setDeletingDocumentId,
  ] = useState(null);

  const [error, setError] =
    useState("");

  async function loadDocuments() {
    const result =
      await getDocuments();

    setDocuments(result);

    return result;
  }

  async function loadDocumentDetails(
    documentId,
  ) {
    const [
      documentResult,
      chunkResult,
    ] = await Promise.all([
      getDocument(documentId),

      getDocumentChunks(
        documentId,
      ),
    ]);

    setSelectedDocument(
      documentResult,
    );

    setChunks(
      chunkResult.chunks || [],
    );
  }

  useEffect(() => {
    const abortController =
      new AbortController();

    async function initializeDocuments() {
      try {
        setIsLoading(true);
        setError("");

        await loadDocuments();
      } catch (requestError) {
        if (
          !abortController.signal
            .aborted
        ) {
          setError(
            requestError.message,
          );
        }
      } finally {
        if (
          !abortController.signal
            .aborted
        ) {
          setIsLoading(false);
        }
      }
    }

    initializeDocuments();

    return () => {
      abortController.abort();
    };
  }, []);

  function handleFileChange(event) {
    const file =
      event.target.files?.[0];

    setError("");
    setSelectedFile(null);

    if (!file) {
      return;
    }

    if (
      file.type !==
      "application/pdf"
    ) {
      setError(
        "Please select a PDF file",
      );

      event.target.value = "";

      return;
    }

    if (
      !file.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      setError(
        "File must have a .pdf extension",
      );

      event.target.value = "";

      return;
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      setError(
        "PDF cannot exceed 5 MB",
      );

      event.target.value = "";

      return;
    }

    setSelectedFile(file);
  }

  async function handleUpload(
    event,
  ) {
    event.preventDefault();

    if (
      !selectedFile ||
      isUploading
    ) {
      return;
    }

    try {
      setIsUploading(true);
      setError("");

      const uploadedDocument =
        await uploadDocument(
          selectedFile,
        );

      setSelectedFile(null);

      const fileInput =
        document.getElementById(
          "document-upload",
        );

      if (fileInput) {
        fileInput.value = "";
      }

      await loadDocuments();

      await loadDocumentDetails(
        uploadedDocument.id,
      );

      setPreviewMode("chunks");
    } catch (requestError) {
      setError(
        requestError.message,
      );
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

      await loadDocumentDetails(
        documentId,
      );
    } catch (requestError) {
      setError(
        requestError.message,
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerateEmbeddings(
    documentId,
    force = false,
  ) {
    try {
      setEmbeddingDocumentId(
        documentId,
      );

      setError("");

      await generateDocumentEmbeddings(
        documentId,
        {
          force,
        },
      );

      await loadDocuments();

      await loadDocumentDetails(
        documentId,
      );

      setPreviewMode("chunks");
    } catch (requestError) {
      setError(
        requestError.message,
      );
    } finally {
      setEmbeddingDocumentId(
        null,
      );
    }
  }

  async function handleDeleteDocument(
    documentId,
  ) {
    try {
      setDeletingDocumentId(
        documentId,
      );

      setError("");

      await deleteDocument(
        documentId,
      );

      setDocuments((previous) =>
        previous.filter(
          (item) =>
            item.id !==
            documentId,
        ),
      );

      if (
        selectedDocument?.id ===
        documentId
      ) {
        setSelectedDocument(null);
        setChunks([]);
      }
    } catch (requestError) {
      setError(
        requestError.message,
      );
    } finally {
      setDeletingDocumentId(
        null,
      );
    }
  }

  return (
    <section className="document-manager">
      <header className="document-header">
        <div>
          <h2>
            Knowledge Documents
          </h2>

          <p>
            Upload organisation PDFs,
            create chunks and store
            semantic vectors in Qdrant.
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
          onChange={
            handleFileChange
          }
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
            !selectedFile ||
            isUploading
          }
        >
          {isUploading
            ? "Extracting, chunking and embedding..."
            : "Upload and process"}
        </button>
      </form>

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}

      <div className="document-content">
        <div className="document-list">
          <h3>
            Uploaded documents
          </h3>

          {isLoading &&
            documents.length ===
              0 && (
              <p>
                Loading documents...
              </p>
            )}

          {!isLoading &&
            documents.length ===
              0 && (
              <p className="empty-document-text">
                No documents
                uploaded.
              </p>
            )}

          {documents.map(
            (item) => {
              const embeddingStatus =
                item.embeddingStatus ||
                "pending";

              const isEmbedding =
                embeddingDocumentId ===
                item.id;

              const isDeleting =
                deletingDocumentId ===
                item.id;

              return (
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
                      handleViewDocument(
                        item.id,
                      )
                    }
                    disabled={
                      isLoading ||
                      isEmbedding ||
                      isDeleting
                    }
                  >
                    <strong>
                      {
                        item.originalName
                      }
                    </strong>
                  </button>

                  <div className="document-card-actions">
                    {embeddingStatus !==
                      "completed" && (
                      <button
                        type="button"
                        className="embedding-button"
                        onClick={() =>
                          handleGenerateEmbeddings(
                            item.id,
                          )
                        }
                        disabled={
                          isEmbedding ||
                          isDeleting
                        }
                      >
                        <ArrowClockwiseIcon
                          size={16}
                          weight="bold"
                          aria-hidden="true"
                        />
                        {isEmbedding
                          ? "Generating..."
                          : embeddingStatus ===
                              "partially_failed" ||
                            embeddingStatus ===
                              "failed"
                            ? "Retry embeddings"
                            : "Generate embeddings"}
                      </button>
                    )}

                    {embeddingStatus ===
                      "completed" && (
                      <button
                        type="button"
                        className="embedding-button"
                        onClick={() =>
                          handleGenerateEmbeddings(
                            item.id,
                            true,
                          )
                        }
                        disabled={
                          isEmbedding ||
                          isDeleting
                        }
                      >
                        <ArrowClockwiseIcon
                          size={16}
                          weight="bold"
                          aria-hidden="true"
                        />
                        {isEmbedding
                          ? "Regenerating..."
                          : "Regenerate"}
                      </button>
                    )}

                    <button
                      type="button"
                      className="document-delete-button"
                      onClick={() =>
                        handleDeleteDocument(
                          item.id,
                        )
                      }
                      disabled={
                        isDeleting ||
                        isEmbedding
                      }
                    >
                      <TrashIcon
                        size={16}
                        weight="bold"
                        aria-hidden="true"
                      />
                      {isDeleting
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </article>
              );
            },
          )}
        </div>

        <div className="document-preview">
          <h3>
            Document preview
          </h3>

          {!selectedDocument && (
            <p className="empty-document-text">
              Select a document to
              inspect it.
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
                  {
                    selectedDocument.pageCount
                  }{" "}
                  pages
                </span>

                <span>
                  {
                    selectedDocument.chunkCount
                  }{" "}
                  chunks
                </span>

                <span>
                  Chunk size:{" "}
                  {
                    selectedDocument.chunkSize
                  }
                </span>

                <span>
                  Overlap:{" "}
                  {
                    selectedDocument.chunkOverlap
                  }
                </span>

                <span>
                  Embeddings:{" "}
                  {selectedDocument.embeddingStatus ||
                    "pending"}
                </span>

                <span>
                  Model:{" "}
                  {selectedDocument.embeddingModel ||
                    "Not generated"}
                </span>

                <span>
                  Dimensions:{" "}
                  {selectedDocument.embeddingDimensions ||
                    "Not available"}
                </span>

                <span>
                  Embedded at:{" "}
                  {formatDate(
                    selectedDocument.embeddedAt,
                  )}
                </span>
              </div>

              <div className="preview-tabs">
                <button
                  type="button"
                  className={
                    previewMode ===
                    "text"
                      ? "preview-tab preview-tab--active"
                      : "preview-tab"
                  }
                  onClick={() =>
                    setPreviewMode(
                      "text",
                    )
                  }
                >
                  Extracted text
                </button>

                <button
                  type="button"
                  className={
                    previewMode ===
                    "chunks"
                      ? "preview-tab preview-tab--active"
                      : "preview-tab"
                  }
                  onClick={() =>
                    setPreviewMode(
                      "chunks",
                    )
                  }
                >
                  Chunks (
                  {chunks.length})
                </button>
              </div>

              {previewMode ===
                "text" && (
                <pre className="extracted-text">
                  {
                    selectedDocument.extractedText
                  }
                </pre>
              )}

              {previewMode ===
                "chunks" && (
                <div className="chunk-list">
                  {chunks.length ===
                    0 && (
                    <p>
                      No chunks found
                      for this
                      document.
                    </p>
                  )}

                  {chunks.map(
                    (chunk) => (
                      <article
                        key={chunk.id}
                        className="chunk-card"
                      >
                        <div className="chunk-header">
                          <strong>
                            Chunk{" "}
                            {chunk.chunkIndex +
                              1}
                          </strong>

                          <span>
                            {
                              chunk.characterCount
                            }{" "}
                            characters
                          </span>

                          <span>
                            Position:{" "}
                            {
                              chunk.startCharacter
                            }
                            {" - "}
                            {
                              chunk.endCharacter
                            }
                          </span>

                          <span>
                            Embedding:{" "}
                            {
                              chunk.embeddingStatus
                            }
                          </span>

                          {chunk.embeddingModel && (
                            <span>
                              Model:{" "}
                              {
                                chunk.embeddingModel
                              }
                            </span>
                          )}

                          {chunk.embeddingDimensions && (
                            <span>
                              Dimensions:{" "}
                              {
                                chunk.embeddingDimensions
                              }
                            </span>
                          )}

                          {chunk.qdrantPointId && (
                            <span>
                              Vector stored:
                              Yes
                            </span>
                          )}
                        </div>

                        {chunk.embeddingError && (
                          <p className="chunk-error">
                            Error:{" "}
                            {
                              chunk.embeddingError
                            }
                          </p>
                        )}

                        <p>
                          {chunk.content}
                        </p>
                      </article>
                    ),
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default DocumentManager;
