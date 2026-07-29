import {
  useEffect,
  useRef,
  useState,
} from "react";
import { getDocuments } from "../services/documentApi";
import { askDocumentQuestion } from "../services/ragApi";
import "./RagChat.css";

function createMessage({
  role,
  content,
  sources = [],
  grounded = false,
}) {
  return {
    id:
      globalThis.crypto
        ?.randomUUID?.() ||
      `${Date.now()}-${Math.random()}`,

    role,
    content,
    sources,
    grounded,

    createdAt:
      new Date().toISOString(),
  };
}

function formatScore(score) {
  if (
    typeof score !== "number"
  ) {
    return "N/A";
  }

  return `${(
    score * 100
  ).toFixed(1)}%`;
}

function RagChat() {
  const [
    documents,
    setDocuments,
  ] = useState([]);

  const [
    selectedDocumentId,
    setSelectedDocumentId,
  ] = useState("");

  const [
    question,
    setQuestion,
  ] = useState("");

  const [
    messages,
    setMessages,
  ] = useState([
    createMessage({
      role: "assistant",

      content:
        "Ask me a question about your uploaded organisation documents.",
    }),
  ]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    isLoadingDocuments,
    setIsLoadingDocuments,
  ] = useState(true);

  const [error, setError] =
    useState("");

  const messageEndRef =
    useRef(null);

  useEffect(() => {
    async function loadDocuments() {
      try {
        setIsLoadingDocuments(true);
        setError("");

        const result =
          await getDocuments();

        const embeddedDocuments =
          result.filter(
            (document) =>
              document.embeddingStatus ===
              "completed",
          );

        setDocuments(
          embeddedDocuments,
        );
      } catch (requestError) {
        setError(
          requestError.message,
        );
      } finally {
        setIsLoadingDocuments(
          false,
        );
      }
    }

    loadDocuments();
  }, []);

  useEffect(() => {
    messageEndRef.current
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }, [messages, isLoading]);

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    const cleanQuestion =
      question.trim();

    if (
      !cleanQuestion ||
      isLoading
    ) {
      return;
    }

    const userMessage =
      createMessage({
        role: "user",

        content:
          cleanQuestion,
      });

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setQuestion("");
    setError("");
    setIsLoading(true);

    try {
      const result =
        await askDocumentQuestion({
          question:
            cleanQuestion,

          documentId:
            selectedDocumentId ||
            null,
        });

      const assistantMessage =
        createMessage({
          role: "assistant",

          content:
            result.answer,

          sources:
            result.sources || [],

          grounded:
            result.grounded,
        });

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);
    } catch (requestError) {
      setError(
        requestError.message,
      );

      setMessages((previous) => [
        ...previous,

        createMessage({
          role: "assistant",

          content:
            "Unable to retrieve an answer from the documents.",
        }),
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClearChat() {
    setMessages([
      createMessage({
        role: "assistant",

        content:
          "Chat cleared. Ask me another question about your uploaded documents.",
      }),
    ]);

    setError("");
  }

  return (
    <section className="rag-chat">
      <header className="rag-chat__header">
        <div>
          <h2>
            Organisation RAG Chat
          </h2>

          <p>
            Answers are generated from
            your uploaded document
            chunks.
          </p>
        </div>

        <button
          type="button"
          className="rag-chat__clear-button"
          onClick={handleClearChat}
          disabled={isLoading}
        >
          Clear chat
        </button>
      </header>

      <div className="rag-chat__filter">
        <label htmlFor="rag-document">
          Search scope
        </label>

        <select
          id="rag-document"
          value={
            selectedDocumentId
          }
          onChange={(event) =>
            setSelectedDocumentId(
              event.target.value,
            )
          }
          disabled={
            isLoadingDocuments ||
            isLoading
          }
        >
          <option value="">
            All embedded documents
          </option>

          {documents.map(
            (document) => (
              <option
                key={document.id}
                value={document.id}
              >
                {
                  document.originalName
                }
              </option>
            ),
          )}
        </select>

        {isLoadingDocuments && (
          <span>
            Loading documents...
          </span>
        )}

        {!isLoadingDocuments &&
          documents.length === 0 && (
            <span className="rag-chat__warning">
              Upload and embed at
              least one document.
            </span>
          )}
      </div>

      <div className="rag-chat__messages">
        {messages.map(
          (message) => (
            <article
              key={message.id}
              className={`rag-message rag-message--${message.role}`}
            >
              <div className="rag-message__label">
                {message.role ===
                "user"
                  ? "You"
                  : "Assistant"}
              </div>

              <div className="rag-message__content">
                {message.content}
              </div>

              {message.sources.length >
                0 && (
                <div className="rag-sources">
                  <strong>
                    Sources
                  </strong>

                  {message.sources.map(
                    (
                      source,
                      sourceIndex,
                    ) => (
                      <details
                        key={`${source.pointId}-${sourceIndex}`}
                        className="rag-source"
                      >
                        <summary>
                          <span>
                            {
                              source.documentName
                            }
                          </span>

                          <span>
                            Chunk{" "}
                            {source.chunkIndex +
                              1}
                          </span>

                          <span>
                            Match{" "}
                            {formatScore(
                              source.score,
                            )}
                          </span>
                        </summary>

                        <p>
                          {
                            source.preview
                          }
                        </p>

                        {source.pageNumber && (
                          <small>
                            Page{" "}
                            {
                              source.pageNumber
                            }
                          </small>
                        )}
                      </details>
                    ),
                  )}
                </div>
              )}
            </article>
          ),
        )}

        {isLoading && (
          <article className="rag-message rag-message--assistant">
            <div className="rag-message__label">
              Assistant
            </div>

            <div className="rag-message__content">
              Searching relevant
              document chunks...
            </div>
          </article>
        )}

        <div
          ref={messageEndRef}
        />
      </div>

      {error && (
        <p className="rag-chat__error">
          {error}
        </p>
      )}

      <form
        className="rag-chat__form"
        onSubmit={handleSubmit}
      >
        <textarea
          value={question}
          onChange={(event) =>
            setQuestion(
              event.target.value,
            )
          }
          placeholder="Example: What are the support hours?"
          rows={3}
          maxLength={2000}
          disabled={
            isLoading ||
            documents.length === 0
          }
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey
            ) {
              event.preventDefault();

              event.currentTarget
                .form
                ?.requestSubmit();
            }
          }}
        />

        <button
          type="submit"
          disabled={
            !question.trim() ||
            isLoading ||
            documents.length === 0
          }
        >
          {isLoading
            ? "Searching..."
            : "Ask documents"}
        </button>
      </form>
    </section>
  );
}

export default RagChat;