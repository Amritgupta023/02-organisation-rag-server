import { useState } from "react";
import { sendChatMessage } from "./services/chatApi";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || isLoading) {
      return;
    }

    setError("");
    setMessage("");
    setIsLoading(true);

    setConversation((previousConversation) => [
      ...previousConversation,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmedMessage,
      },
    ]);

    try {
      const result = await sendChatMessage(trimmedMessage);

      setConversation((previousConversation) => [
        ...previousConversation,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.answer,
        },
      ]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app">
      <section className="chat-container">
        <header className="chat-header">
          <h1>Organisation Assistant</h1>
          <p>Level 1: React, Node.js and Gemini</p>
        </header>

        <div className="messages">
          {conversation.length === 0 && (
            <div className="empty-state">
              <h2>Start a conversation</h2>
              <p>Ask Gemini any question to test the integration.</p>
            </div>
          )}

          {conversation.map((item) => (
            <article
              key={item.id}
              className={`message message--${item.role}`}
            >
              <strong>
                {item.role === "user" ? "You" : "Assistant"}
              </strong>

              <p>{item.content}</p>
            </article>
          ))}

          {isLoading && (
            <article className="message message--assistant">
              <strong>Assistant</strong>
              <p>Thinking...</p>
            </article>
          )}
        </div>

        {error && <p className="error-message">{error}</p>}

        <form className="chat-form" onSubmit={handleSubmit}>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ask something..."
            rows={3}
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={!message.trim() || isLoading}
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default App;