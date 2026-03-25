import { useState, useRef, useEffect } from "react";

const SUGGESTIONS = [
  "Why did my expenses increase?",
  "What is my top spending category?",
  "Am I over budget?",
  "Any unusual transactions?",
  "Forecast next month",
];

const WELCOME_MSG = {
  type: "bot",
  text: "👋 Hi! I'm your FinLens AI assistant. I analyze your local expense data to answer questions about your spending. Try one of the suggestions below, or type your own question!",
};

export default function Chatbot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [loading, setLoading] = useState(false);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const question = text || input;
    if (!question.trim()) return;

    const userMsg = { type: "user", text: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(
        "https://qs1ubycqtd.execute-api.ap-south-1.amazonaws.com/prod/chatbot",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        }
      );
      const data = await res.json();
      setMessages((prev) => [...prev, { type: "bot", text: data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div style={styles.wrapper}>
      {/* Chat messages area */}
      <div style={styles.chatBox} ref={chatBoxRef}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={msg.type === "user" ? styles.userBubble : styles.botBubble}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div style={styles.botBubble}>
            <span style={styles.typing}>
              <span style={styles.dot} />
              <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
              <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
            </span>
          </div>
        )}
      </div>

      {/* Suggestion chips */}
      <div style={styles.suggestions}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            style={styles.chip}
            onClick={() => sendMessage(s)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#4f52d4";
              e.currentTarget.style.color = "#c5c8f0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#3a3e60";
              e.currentTarget.style.color = "#9da3c8";
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div style={styles.inputRow}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your expenses..."
          style={styles.input}
        />
        <button
          onClick={() => sendMessage()}
          style={{
            ...styles.sendBtn,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          disabled={loading}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#3e41b8"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#4f52d4"; }}
        >
          Send
        </button>
      </div>

      <style>{`
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1);   }
        }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: "680px",
    height: "560px",
    background: "#161728",
    border: "1px solid #252740",
    borderRadius: "14px",
    padding: "24px",
    boxSizing: "border-box",
    gap: "16px",
    fontFamily: "'Segoe UI', sans-serif",
  },

  chatBox: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    paddingRight: "6px",
    scrollbarWidth: "thin",
    scrollbarColor: "#252740 transparent",
  },

  botBubble: {
    alignSelf: "flex-start",
    background: "#1c1e30",
    color: "#d0d4f0",
    borderRadius: "12px 12px 12px 2px",
    padding: "12px 16px",
    fontSize: "13.5px",
    lineHeight: "1.6",
    maxWidth: "88%",
    border: "1px solid #252740",
  },

  userBubble: {
    alignSelf: "flex-end",
    background: "#4f52d4",
    color: "#ffffff",
    borderRadius: "12px 12px 2px 12px",
    padding: "10px 16px",
    fontSize: "13.5px",
    lineHeight: "1.6",
    maxWidth: "80%",
  },

  suggestions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },

  chip: {
    background: "transparent",
    border: "1px solid #3a3e60",
    color: "#9da3c8",
    borderRadius: "20px",
    padding: "6px 14px",
    fontSize: "12px",
    cursor: "pointer",
    transition: "border-color 0.15s, color 0.15s",
    outline: "none",
    whiteSpace: "nowrap",
  },

  inputRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  input: {
    flex: 1,
    background: "#1c1e30",
    border: "1px solid #252740",
    borderRadius: "8px",
    padding: "11px 16px",
    color: "#d0d4f0",
    fontSize: "13.5px",
    outline: "none",
    fontFamily: "'Segoe UI', sans-serif",
  },

  sendBtn: {
    background: "#4f52d4",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "11px 24px",
    fontSize: "13.5px",
    fontWeight: "600",
    transition: "background 0.15s",
    whiteSpace: "nowrap",
    fontFamily: "'Segoe UI', sans-serif",
  },

  typing: {
    display: "flex",
    gap: "5px",
    alignItems: "center",
    height: "16px",
  },

  dot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#7c6ff7",
    display: "inline-block",
    animation: "blink 1.2s infinite ease-in-out",
  },
};
