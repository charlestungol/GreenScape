import { useState } from "react";
import "./clientCss/ChatbotWidget.css";

const API_URL = "https://greenscape-webapp-efbeayamacendzfg.canadacentral-01.azurewebsites.net/core/chatbot/";

function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm the Greenscape assistant. Ask me about irrigation, lighting, maintenance, pricing guidance, or other Greenscape services.",
    },
  ]);

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response || "I couldn't generate a response.",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error.message ||
            "Sorry, I couldn't connect to the server right now.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendMessage();
  };

  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await sendMessage();
    }
  };

  return (
    <>
      <button
        className="chatbot-fab"
        onClick={toggleChat}
        aria-label="Open Greenscape chatbot"
        type="button"
      >
        💬
      </button>

      {isOpen && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <div>
              <h3 className="chatbot-title">Greenscape Assistant</h3>
              <p className="chatbot-subtitle">Ask about Greenscape services</p>
            </div>

            <button
              className="chatbot-close"
              onClick={toggleChat}
              aria-label="Close chatbot"
              type="button"
            >
              ×
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`chatbot-message ${message.role}`}
              >
                <div className="chatbot-bubble">{message.content}</div>
              </div>
            ))}

            {isLoading && (
              <div className="chatbot-message assistant">
                <div className="chatbot-bubble chatbot-thinking">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <form className="chatbot-input-row" onSubmit={handleSubmit}>
            <textarea
              className="chatbot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question here..."
              rows="2"
            />
            <button
              className="chatbot-send"
              type="submit"
              disabled={isLoading || !input.trim()}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default ChatbotWidget;