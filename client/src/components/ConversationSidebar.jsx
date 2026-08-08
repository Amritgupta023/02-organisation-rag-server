function ConversationSidebar({
  conversations,
  selectedConversationId,
  activeSection,
  isLoading,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onSelectSection,
}) {
  function openNewChat() {
    onSelectSection("chat");
    onNewConversation();
  }

  function openConversation(conversationId) {
    onSelectSection("chat");
    onSelectConversation(conversationId);
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__top">
        <div className="sidebar__brand">
          <span className="sidebar__brand-mark">O</span>
          <span>Organisation AI</span>
        </div>

        <button
          type="button"
          className="sidebar__primary-action"
          onClick={openNewChat}
          disabled={isLoading}
        >
          <span aria-hidden="true">＋</span>
          New chat
        </button>

        <nav className="sidebar__nav" aria-label="Main navigation">
          <button
            type="button"
            className={activeSection === "chat" ? "sidebar__nav-item sidebar__nav-item--active" : "sidebar__nav-item"}
            onClick={() => onSelectSection("chat")}
          >
            Chat
          </button>

          <button
            type="button"
            className={activeSection === "documents" ? "sidebar__nav-item sidebar__nav-item--active" : "sidebar__nav-item"}
            onClick={() => onSelectSection("documents")}
          >
            Documents
          </button>
        </nav>
      </div>

      <div className="sidebar__recents">
        <p className="sidebar__section-label">Recent</p>

        <div className="conversation-list">
          {conversations.length === 0 && (
            <p className="no-conversations">Your recent chats will appear here.</p>
          )}

          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`conversation-item ${selectedConversationId === conversation.id && activeSection === "chat" ? "conversation-item--active" : ""}`}
            >
              <button
                type="button"
                className="conversation-select-button"
                onClick={() => openConversation(conversation.id)}
                disabled={isLoading}
                title={conversation.title}
              >
                <span className="conversation-title">{conversation.title}</span>
              </button>

              <button
                type="button"
                className="conversation-delete-button"
                aria-label={`Delete ${conversation.title}`}
                title="Delete chat"
                onClick={() => onDeleteConversation(conversation.id)}
                disabled={isLoading}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar__footer">
        <span className="sidebar__avatar">OA</span>
        <div>
          <strong>Organisation</strong>
          <span>Knowledge assistant</span>
        </div>
      </div>
    </aside>
  );
}

export default ConversationSidebar;
