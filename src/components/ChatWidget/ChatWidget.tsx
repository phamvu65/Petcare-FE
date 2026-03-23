import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown"; 
import "./ChatWidget.css";

interface Message {
  role: "user" | "model";
  message: string;
}

const ChatWidget: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: "user", message: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // const response = await fetch("http://localhost:8080/chat",
      const response = await fetch("https://petcare-backend-api.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.message,
          history: messages,
        }),
      });

      const data = await response.json();

      // --- [ĐÃ SỬA TẠI ĐÂY] Dùng response.ok để kiểm tra thành công thay vì data.status ---
      if (response.ok) {
        // Trích xuất linh hoạt: bao lô mọi trường hợp Backend có thể trả về
        const aiText = data.data?.reply || data.data || data.reply || data.message || "Đã nhận câu trả lời nhưng không đọc được nội dung.";
        
        const aiMsg: Message = { role: "model", message: aiText };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "model", message: "Lỗi: " + (data.message || "Máy chủ từ chối") },
        ]);
      }
      // -----------------------------------------------------------------------------------
      
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "model", message: "Không thể kết nối tới server 😿" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="chat-window">
      <div className="chat-header">🐶 PetCare Support</div>

      <div className="chat-body">
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#888", marginTop: 20 }}>
            Xin chào! Tôi có thể giúp gì cho thú cưng của bạn? 🐾
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent:
                msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              className={`message-bubble ${
                msg.role === "user" ? "message-user" : "message-model"
              }`}
            >
              <ReactMarkdown
                components={{
                  // Tùy chỉnh thẻ p để không bị margin quá rộng trong bong bóng chat
                  p: ({ node, ...props }) => (
                    <p style={{ margin: 0, padding: 0 }} {...props} />
                  ),
                }}
              >
                {msg.message}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="loading-dots">PetBot đang suy nghĩ...</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-footer">
        <input
          type="text"
          placeholder="Nhập câu hỏi..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading}>
          Gửi
        </button>
      </div>
    </div>
  );
};

export default ChatWidget;