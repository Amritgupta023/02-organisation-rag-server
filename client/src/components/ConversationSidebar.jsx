function ConversationSidebar({
  conversations,
  selectedConversationId,
  isLoading,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Chats</h2>

        <button
          type="button"
          className="new-chat-button"
          onClick={onNewConversation}
          disabled={isLoading}
        >
          + New chat
        </button>
      </div>

      <div className="conversation-list">
        {conversations.length === 0 && (
          <p className="no-conversations">
            No saved conversations
          </p>
        )}

        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`conversation-item ${
              selectedConversationId ===
              conversation.id
                ? "conversation-item--active"
                : ""
            }`}
          >
            <button
              type="button"
              className="conversation-select-button"
              onClick={() =>
                onSelectConversation(
                  conversation.id,
                )
              }
              disabled={isLoading}
            >
              <span className="conversation-title">
                {conversation.title}
              </span>

              <span className="conversation-message-count">
                {conversation.messageCount} messages
              </span>
            </button>

            <button
              type="button"
              className="conversation-delete-button"
              aria-label={`Delete ${conversation.title}`}
              onClick={() =>
                onDeleteConversation(
                  conversation.id,
                )
              }
              disabled={isLoading}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default ConversationSidebar;