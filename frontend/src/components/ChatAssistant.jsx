import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const WELCOME = {
  role: "assistant",
  content:
    "Hi! I can help you find products and answer questions about shipping, returns and payment. " +
    "Try: “a gift for a coffee lover” or “How long does delivery take?”",
};

// Floating AI shopping assistant, shown on every page.
// Talks to POST /api/assistant; product cards use database data from the
// response, never prices written by the AI.
function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]); // { role, content, products?, isError? }
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Keep the newest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    // History for the backend: last 10 real turns, text only.
    // Skips the welcome message and error bubbles.
    const history = messages
      .slice(1)
      .filter((m) => !m.isError)
      .slice(-10)
      .map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setSending(true);

    try {
      const { data } = await api.post("/assistant", { message: text, history });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, products: data.products },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: error.response?.data?.message || "Sorry, something went wrong.",
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 1050 }}>
      {open && (
        <div
          className="card shadow mb-2"
          style={{
            width: 340,
            maxWidth: "calc(100vw - 40px)",
            height: 460,
            maxHeight: "calc(100vh - 100px)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div className="card-header d-flex justify-content-between align-items-center">
            <strong>Shopping assistant</strong>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => setOpen(false)}
            />
          </div>

          <div className="card-body overflow-auto" style={{ flex: 1 }} aria-live="polite">
            {messages.map((m, index) => (
              <div
                key={index}
                className={`mb-2 d-flex ${m.role === "user" ? "justify-content-end" : ""}`}
              >
                <div
                  className={`p-2 rounded ${
                    m.role === "user"
                      ? "bg-primary text-white"
                      : m.isError
                      ? "bg-danger-subtle"
                      : "bg-light"
                  }`}
                  style={{ maxWidth: "85%", whiteSpace: "pre-wrap" }}
                >
                  {m.content}

                  {/* Product cards: data from the DATABASE, not the AI's text */}
                  {m.products?.length > 0 && (
                    <div className="mt-2 d-grid gap-1">
                      {m.products.map((p) => (
                        <Link
                          key={p.id}
                          to={`/products/${p.id}`}
                          className="btn btn-sm btn-outline-secondary text-start"
                          onClick={() => setOpen(false)}
                        >
                          {p.name} · {Number(p.price).toFixed(2)}
                          {p.stock === 0 && " (out of stock)"}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {sending && <div className="text-muted small">Assistant is typing…</div>}
            <div ref={bottomRef} />
          </div>

          <form className="card-footer d-flex gap-2" onSubmit={send}>
            <input
              className="form-control form-control-sm"
              placeholder="Ask about products…"
              aria-label="Message the shopping assistant"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              disabled={sending}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={sending || !input.trim()}
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary rounded-pill shadow float-end"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-expanded={open}
      >
        {open ? "Close" : "💬 Ask AI"}
      </button>
    </div>
  );
}

export default ChatAssistant;
