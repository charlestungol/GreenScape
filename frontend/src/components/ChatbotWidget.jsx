import { useEffect, useRef, useState } from "react";
import "./clientCss/ChatbotWidget.css";

const API_URL =
  "https://greenscape-webapp-efbeayamacendzfg.canadacentral-01.azurewebsites.net/core/chatbot/";

function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I’m the Greenscape assistant. Ask me about irrigation, lighting, maintenance, pricing, winterization, or other Greenscape services.",
    },
  ]);

  const messagesEndRef = useRef(null);

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  const buildHistoryPayload = () => {
    return messages.slice(-8).map((message) => ({
      role: message.role,
      content: message.content,
    }));
  };

  const parseResponseSafely = async (response) => {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return response.json();
    }

    const text = await response.text();
    return { error: text };
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          history: nextMessages.slice(-10).map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const data = await parseResponseSafely(response);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Sorry, I couldn’t complete that request right now. Please try again in a moment."
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data?.response ||
            "Sorry, I couldn’t generate a response right now.",
        },
      ]);
    } catch (error) {
      const fallbackMessage =
        typeof navigator !== "undefined" && navigator.onLine === false
          ? "It looks like you’re offline right now. Please check your internet connection and try again."
          : "Sorry, I’m having trouble connecting right now. Please try again in a moment.";

      const safeMessage =
        error?.message &&
        !/404|500|502|503|504|traceback|html|doctype|azure_openai|api_key/i.test(
          error.message
        )
          ? error.message
          : fallbackMessage;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: safeMessage,
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
              <p className="chatbot-subtitle">
                Ask about Greenscape services
              </p>
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
                  Thinking…
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
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