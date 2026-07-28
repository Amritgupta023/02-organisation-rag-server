import {
  useCallback,
  useEffect,
  useState,
} from "react";
import ConversationSidebar from "./components/ConversationSidebar";
import { sendChatMessage } from "./services/chatApi";
import {
  createConversation,
  deleteConversation,
  getConversation,
  getConversations,
} from "./services/conversationApi";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");

  const [conversation, setConversation] =
    useState([]);

  const [
    conversations,
    setConversations,
  ] = useState([]);

  const [
    selectedConversationId,
    setSelectedConversationId,
  ] = useState(null);

  const [isLoading, setIsLoading] =
    useState(false);

  const [
    isInitialLoading,
    setIsInitialLoading,
  ] = useState(true);

  const [error, setError] = useState("");

  const loadConversationList =
    useCallback(async () => {
      const savedConversations =
        await getConversations();

      setConversations(savedConversations);

      return savedConversations;
    }, []);

  const loadConversation = useCallback(
    async (conversationId) => {
      const savedConversation =
        await getConversation(conversationId);

      const formattedMessages =
        savedConversation.messages.map(
          (item) => ({
            id: item._id,
            role: item.role,
            content: item.content,
          }),
        );

      setSelectedConversationId(
        savedConversation._id,
      );

      setConversation(formattedMessages);
      setError("");
    },
    [],
  );

  useEffect(() => {
    async function initializeApplication() {
      try {
        const savedConversations =
          await loadConversationList();

        if (savedConversations.length > 0) {
          await loadConversation(
            savedConversations[0].id,
          );
        }
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsInitialLoading(false);
      }
    }

    initializeApplication();
  }, [loadConversation, loadConversationList]);

  async function handleNewConversation() {
    if (isLoading) {
      return;
    }

    setMessage("");
    setConversation([]);
    setSelectedConversationId(null);
    setError("");
  }

  async function handleSelectConversation(
    conversationId,
  ) {
    if (
      isLoading ||
      conversationId === selectedConversationId
    ) {
      return;
    }

    try {
      setIsLoading(true);
      await loadConversation(conversationId);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteConversation(
    conversationId,
  ) {
    if (isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      await deleteConversation(conversationId);

      const remainingConversations =
        conversations.filter(
          (item) => item.id !== conversationId,
        );

      setConversations(
        remainingConversations,
      );

      if (
        selectedConversationId ===
        conversationId
      ) {
        if (
          remainingConversations.length > 0
        ) {
          await loadConversation(
            remainingConversations[0].id,
          );
        } else {
          setSelectedConversationId(null);
          setConversation([]);
        }
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || isLoading) {
      return;
    }

    if (trimmedMessage.length > 2000) {
      setError(
        "Message cannot exceed 2000 characters",
      );
      return;
    }

    const temporaryUserMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedMessage,
    };

    setConversation((previous) => [
      ...previous,
      temporaryUserMessage,
    ]);

    setMessage("");
    setError("");
    setIsLoading(true);

    try {
      const result = await sendChatMessage({
        message: trimmedMessage,
        conversationId:
          selectedConversationId,
      });

      setSelectedConversationId(
        result.conversationId,
      );

      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.answer,
      };

      setConversation((previous) => [
        ...previous,
        assistantMessage,
      ]);

      await loadConversationList();
    } catch (requestError) {
      setConversation((previous) =>
        previous.filter(
          (item) =>
            item.id !==
            temporaryUserMessage.id,
        ),
      );

      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      event.currentTarget.form?.requestSubmit();
    }
  }

  if (isInitialLoading) {
    return (
      <main className="loading-screen">
        Loading conversations...
      </main>
    );
  }

  return (
    <main className="app-layout">
      <ConversationSidebar
        conversations={conversations}
        selectedConversationId={
          selectedConversationId
        }
        isLoading={isLoading}
        onNewConversation={
          handleNewConversation
        }
        onSelectConversation={
          handleSelectConversation
        }
        onDeleteConversation={
          handleDeleteConversation
        }
      />

      <section className="chat-container">
        <header className="chat-header">
          <div>
            <h1>
              ABC Organisation Assistant
            </h1>

            <p>
              Level 4: MongoDB persistent
              conversation history
            </p>
          </div>
        </header>

        <div className="messages">
          {conversation.length === 0 && (
            <div className="empty-state">
              <h2>Start a new conversation</h2>

              <p>
                Your conversation will be saved
                automatically.
              </p>
            </div>
          )}

          {conversation.map((item) => (
            <article
              key={item.id}
              className={`message message--${item.role}`}
            >
              <strong>
                {item.role === "user"
                  ? "You"
                  : "Assistant"}
              </strong>

              <p>{item.content}</p>
            </article>
          ))}

          {isLoading && (
            <article className="message message--assistant">
              <strong>Assistant</strong>
              <p>
                Assistant is thinking...
              </p>
            </article>
          )}
        </div>

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

        <form
          className="chat-form"
          onSubmit={handleSubmit}
        >
          <div className="input-wrapper">
            <textarea
              value={message}
              onChange={(event) => {
                setMessage(
                  event.target.value,
                );

                if (error) {
                  setError("");
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask something..."
              rows={3}
              maxLength={2000}
              disabled={isLoading}
            />

            <span className="character-count">
              {message.length}/2000
            </span>
          </div>

          <button
            type="submit"
            disabled={
              !message.trim() || isLoading
            }
          >
            {isLoading
              ? "Sending..."
              : "Send"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default App;