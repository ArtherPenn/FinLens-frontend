import { useState } from "react";

export default function Chatbot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const sendMessage = async () => {
    if (!input) return;

    const userMsg = { type: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    const res = await fetch(
      "https://qs1ubycqtd.execute-api.ap-south-1.amazonaws.com/prod/chatbot",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: input }),
      },
    );

    const data = await res.json();

    const botMsg = { type: "bot", text: data.answer };
    setMessages((prev) => [...prev, botMsg]);

    setInput("");
  };

  return (
    <div style={styles.container}>
      <div style={styles.chatBox}>
        {messages.map((msg, i) => (
          <div key={i} style={msg.type === "user" ? styles.user : styles.bot}>
            {msg.text}
          </div>
        ))}
      </div>

      <div style={styles.inputBox}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your expenses..."
          style={styles.input}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "300px",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "10px",
    padding: "10px",
  },
  chatBox: {
    height: "200px",
    overflowY: "auto",
    marginBottom: "10px",
  },
  user: {
    textAlign: "right",
    margin: "5px",
    color: "blue",
  },
  bot: {
    textAlign: "left",
    margin: "5px",
    color: "green",
  },
  inputBox: {
    display: "flex",
  },
  input: {
    flex: 1,
    marginRight: "5px",
  },
};
