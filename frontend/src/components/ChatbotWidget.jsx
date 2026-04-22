import { useEffect, useRef, useState } from "react";
import "./clientCss/ChatbotWidget.css";

const API_URL =
  "https://greenscape-webapp-efbeayamacendzfg.canadacentral-01.azurewebsites.net/core/chatbot/";

const QUICK_ACTIONS = [
  "Winterization pricing",
  "Irrigation installation",
  "Landscape lighting",
  "Backflow testing",
];

function TypingDots() {
  return (
    <div className="iri-typing" aria-label="Iri is typing">
      <span />
      <span />
      <span />
    </div>
  );
}

function normalizeAssistantText(text) {
  if (!text) return "";

  return text
    .replace(/^\s*-\s+/gm, "• ")
    .replace(/^\s*\*\s+/gm, "• ")
    .trim();
}

function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi, I’m Iri. I can help with irrigation, lighting, winterization, maintenance, and pricing. What would you like help with today?",
    },
  ]);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const autoResizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  useEffect(() => {
    autoResizeTextarea();
  }, [input]);

  const parseResponseSafely = async (response) => {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return response.json();
    }

    const text = await response.text();
    return { error: text };
  };

  const buildHistoryPayload = (nextMessages) => {
    return nextMessages.slice(-10).map((message) => ({
      role: message.role,
      content: message.content,
    }));
  };

  const appendAssistantMessage = (content) => {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: normalizeAssistantText(content),
      },
    ]);
  };

  const getFriendlyFallbackMessage = (errorMessage) => {
    const raw = String(errorMessage || "");

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return "It looks like you’re offline right now. Please check your internet connection and try again.";
    }

    if (/404/i.test(raw)) {
      return "I’m having trouble reaching the chat service right now. Please try again in a moment.";
    }

    if (/timeout|network|failed to fetch|503|502|504/i.test(raw)) {
      return "I’m having trouble connecting right now. Please try again in a moment.";
    }

    if (/api|key|traceback|exception|azure|html|doctype|server/i.test(raw)) {
      return "Sorry, something went wrong on our side. Please try again in a moment.";
    }

    return raw || "Sorry, I couldn’t complete that request right now.";
  };

  const sendMessage = async (messageOverride = null) => {
    const trimmed = (messageOverride ?? input).trim();
    if (!trimmed || isLoading) return;

    const userMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];

    setMessages((prev) => [
      ...prev,
      userMessage,
      { role: "assistant", content: "" },
    ]);
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
          history: buildHistoryPayload(nextMessages),
        }),
      });

      if (!response.ok) {
        const data = await parseResponseSafely(response);
        throw new Error(data?.error || "Request failed");
      }

      if (!response.body) {
        throw new Error("No response stream available.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;

      while (!finished) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";

        for (const chunk of chunks) {
          const line = chunk
            .split("\n")
            .find((l) => l.startsWith("data: "));

          if (!line) continue;

          let payload;
          try {
            payload = JSON.parse(line.slice(6));
          } catch {
            continue;
          }

          if (payload.type === "delta") {
            setMessages((prev) => {
              const updated = [...prev];
              const lastIndex = updated.length - 1;

              if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
                updated[lastIndex] = {
                  ...updated[lastIndex],
                  content: updated[lastIndex].content + payload.text,
                };
              }

              return updated;
            });
          }

          if (payload.type === "done") {
            finished = true;
            break;
          }
        }
      }

      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;

        if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: normalizeAssistantText(updated[lastIndex].content),
          };
        }

        return updated;
      });
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;

        if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: getFriendlyFallbackMessage(error?.message),
          };
        }

        return updated;
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
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

  const handleQuickAction = async (label) => {
    await sendMessage(label);
  };

  return (
    <>
      <button
        className="iri-fab"
        onClick={toggleChat}
        aria-label={isOpen ? "Close Iri chat" : "Open Iri chat"}
        type="button"
      >
        <span className="iri-fab-inner">I</span>
      </button>

      {isOpen && (
        <section className="iri-panel" aria-label="Iri chat panel">
          <header className="iri-header">
            <div className="iri-header-left">
              <div className="iri-avatar" aria-hidden="true">
                I
              </div>

              <div>
                <h3 className="iri-title">Iri</h3>
                <p className="iri-subtitle">Greenscape Irrigation Assistant</p>
              </div>
            </div>

            <button
              className="iri-close"
              onClick={toggleChat}
              aria-label="Close chatbot"
              type="button"
            >
              ×
            </button>
          </header>

          <div className="iri-messages">
            <div className="iri-welcome-card">
              <div className="iri-welcome-badge">Iri</div>
              <div className="iri-welcome-text">
                Ask about irrigation, winterization, lighting, maintenance, pricing, and service options.
              </div>

              <div className="iri-quick-actions">
                {QUICK_ACTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="iri-chip"
                    onClick={() => handleQuickAction(item)}
                    disabled={isLoading}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`iri-message ${message.role}`}
              >
                {message.role === "assistant" && (
                  <div className="iri-message-avatar" aria-hidden="true">
                    I
                  </div>
                )}

                <div className="iri-bubble">{message.content}</div>
              </div>
            ))}

            {isLoading && (
              <div className="iri-message assistant">
                <div className="iri-message-avatar" aria-hidden="true">
                  I
                </div>
                <div className="iri-bubble iri-bubble-thinking">
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="iri-input-row" onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              className="iri-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Iri about Greenscape services..."
              rows="1"
            />

            <button
              className="iri-send"
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              →
            </button>
          </form>
        </section>
      )}
    </>
  );
}

export default ChatbotWidget;