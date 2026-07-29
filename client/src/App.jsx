import {
  useState,
} from "react";
import DocumentManager from "./components/DocumentManager";
import RagChat from "./components/RagChat";
import "./App.css";

function App() {
  const [
    activeSection,
    setActiveSection,
  ] = useState("chat");

  return (
    <main className="app">
      <header className="app__header">
        <div>
          <h1>
            Organisation RAG
            Assistant
          </h1>

          <p>
            Upload organisation
            documents and ask grounded
            questions.
          </p>
        </div>
      </header>

      <nav className="app__navigation">
        <button
          type="button"
          className={
            activeSection === "chat"
              ? "app__nav-button app__nav-button--active"
              : "app__nav-button"
          }
          onClick={() =>
            setActiveSection("chat")
          }
        >
          RAG Chat
        </button>

        <button
          type="button"
          className={
            activeSection ===
            "documents"
              ? "app__nav-button app__nav-button--active"
              : "app__nav-button"
          }
          onClick={() =>
            setActiveSection(
              "documents",
            )
          }
        >
          Documents
        </button>
      </nav>

      <section className="app__content">
        {activeSection === "chat" && (
          <RagChat />
        )}

        {activeSection ===
          "documents" && (
          <DocumentManager />
        )}
      </section>
    </main>
  );
}

export default App;