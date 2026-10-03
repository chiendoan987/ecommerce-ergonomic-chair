"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "m-1",
    sender: "bot",
    text: "Xin chào bạn! 👋 Tôi là **ErgoBot** - Trợ lý thông minh tư vấn ghế công thái học của ErgoChair.",
    time: "Vừa xong",
  },
  {
    id: "m-2",
    sender: "bot",
    text: "Tôi có thể giúp bạn chọn mẫu ghế chuẩn công thái học theo vóc dáng, hoặc giải đáp chính sách bảo hành 5 năm & giao hàng miễn phí.",
    time: "Vừa xong",
  },
];

const SUGGESTION_CHIPS = [
  "📏 Ghế cho người 1m60 - 1m75",
  "🛡️ Bảo hành 5 năm gồm những gì?",
  "🌬️ Ghế nào ngồi mát lưng nhất?",
  "🚚 Giao hàng & lắp đặt tại nhà",
];

export function FloatingChatbot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewBadge, setHasNewBadge] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const idCounterRef = useRef(10);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages, isTyping]);

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setHasNewBadge(false);
      }
      return next;
    });
  };

  const getSmartReply = (userQuery: string): string => {
    const q = userQuery.toLowerCase();
    if (q.includes("1m60") || q.includes("1m75") || q.includes("chiều cao") || q.includes("vóc dáng")) {
      return "Với chiều cao 1m60 - 1m75, mẫu **ErgoAir Pro** và **ErgoFlex Master** là sự lựa chọn lý tưởng nhất! Ghế có bộ đỡ thắt lưng Lumbar 3D tự động thích ứng với đốt sống L1-L5, kết hợp lưới Wintex đàn hồi cao giúp bạn ngồi 8-10 tiếng không bị mỏi lưng.";
    }
    if (q.includes("bảo hành") || q.includes("warranty") || q.includes("đổi trả")) {
      return "Mọi sản phẩm của ErgoChair đều đi kèm gói **Bảo hành chính hãng 5 năm** tận nơi tại Hà Nội & TP.HCM. Bao gồm: Piston thủy lực Class 4, bộ mâm ngả đa góc, khung nhôm đúc và bánh xe PU. Đặc biệt 1 đổi 1 trong 30 ngày nếu phát sinh lỗi từ nhà sản xuất!";
    }
    if (q.includes("mát") || q.includes("lưới") || q.includes("nóng") || q.includes("mồ hôi")) {
      return "Dòng **ErgoAir Pro** và **ErgoCurve Air** sử dụng 100% công nghệ lưới chịu lực tản nhiệt tổ ong kép từ Hàn Quốc, bề mặt không tích nhiệt, cực kỳ thoáng mát và dễ dàng vệ sinh, rất thích hợp cho khí hậu nhiệt đới.";
    }
    if (q.includes("giao hàng") || q.includes("ship") || q.includes("lắp đặt") || q.includes("vận chuyển")) {
      return "ErgoChair **miễn phí giao hàng toàn quốc** cho đơn từ 2.000.000đ. Tại nội thành Hà Nội & TP.HCM, nhân viên kỹ thuật sẽ giao siêu tốc trong 2 giờ và hỗ trợ cân chỉnh tư thế, lắp ráp hoàn chỉnh tại phòng làm việc của bạn hoàn toàn miễn phí!";
    }
    if (q.includes("giá") || q.includes("bao nhiêu") || q.includes("rẻ")) {
      return "Các mẫu ghế công thái học ErgoChair có mức giá từ **2.890.000đ** (ErgoLite) đến **8.990.000đ** (ErgoLuxe President bọc da Napa). Hiện đang có ưu đãi giảm 10% cho đơn hàng đầu tiên khi áp mã **WELCOME10** tại trang thanh toán!";
    }
    return `ErgoBot đã ghi nhận câu hỏi của bạn về: "${userQuery}". Do đây là bản demo AI, chuyên viên tư vấn thật có thể kết nối ngay với bạn qua Hotline miễn phí **1800 6868** hoặc Zalo ở góc trái màn hình nhé! 🪑✨`;
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isTyping) return;

    idCounterRef.current += 1;
    const currentId = idCounterRef.current;
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const userMsg: Message = {
      id: `u-${currentId}`,
      sender: "user",
      text,
      time: currentTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate smart bot response
    setTimeout(() => {
      idCounterRef.current += 1;
      const botId = idCounterRef.current;
      const botReplyText = getSmartReply(text);
      const botMsg: Message = {
        id: `b-${botId}`,
        sender: "bot",
        text: botReplyText,
        time: currentTime,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 700);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  // Hide on admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="floating-chatbot-container">
      {/* Cửa sổ chat nhỏ (Chat Widget Window) */}
      <section
        className={`floating-chat-window ${isOpen ? "is-open" : ""}`}
        aria-label="Cửa sổ trò chuyện với Trợ lý AI ErgoBot"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <header className="chat-window-header">
          <div className="chat-header-info">
            <div className="chat-avatar-wrapper">
              <span className="chat-bot-avatar">🤖</span>
              <span className="chat-online-indicator" aria-label="Đang trực tuyến" />
            </div>
            <div>
              <h3 className="chat-bot-name">
                ErgoBot <span className="chat-badge-ai">AI Bot</span>
              </h3>
              <p className="chat-bot-status">● Trực tuyến • Tư vấn 24/7</p>
            </div>
          </div>

          <div className="chat-header-actions">
            <button
              type="button"
              className="chat-action-btn"
              onClick={() => setMessages(INITIAL_MESSAGES)}
              title="Khởi động lại cuộc trò chuyện"
              aria-label="Xóa làm mới đoạn chat"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
              </svg>
            </button>
            <button
              type="button"
              className="chat-action-btn close-btn"
              onClick={handleToggle}
              title="Đóng cửa sổ chat"
              aria-label="Đóng cửa sổ chat"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Message Body */}
        <div className="chat-window-body">
          <div className="chat-time-divider">
            <span>Hôm nay</span>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message-row ${msg.sender === "user" ? "user-row" : "bot-row"}`}
            >
              {msg.sender === "bot" && (
                <div className="chat-msg-avatar">🤖</div>
              )}
              <div className="chat-bubble-container">
                <div className="chat-message-bubble">
                  {/* Format simple bold text */}
                  {msg.text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return <strong key={i}>{part.slice(2, -2)}</strong>;
                    }
                    return part;
                  })}
                </div>
                <span className="chat-message-time">{msg.time}</span>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="chat-message-row bot-row">
              <div className="chat-msg-avatar">🤖</div>
              <div className="chat-bubble-container">
                <div className="chat-typing-bubble" aria-label="ErgoBot đang nhập câu trả lời">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          {/* Suggestion Chips */}
          <div className="chat-suggestion-chips">
            <span className="chips-title">Gợi ý câu hỏi nhanh:</span>
            <div className="chips-list">
              {SUGGESTION_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="chat-chip-btn"
                  onClick={() => handleSend(chip)}
                  disabled={isTyping}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div ref={messagesEndRef} />
        </div>

        {/* Footer / Input */}
        <footer className="chat-window-footer">
          <form
            className="chat-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="Hỏi ErgoBot bất kỳ điều gì..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!input.trim() || isTyping}
              aria-label="Gửi tin nhắn"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
          <div className="chat-footnote">
            ⚡ Trợ lý AI ErgoBot • Dữ liệu mô phỏng
          </div>
        </footer>
      </section>

      {/* Nút nổi tròn ở góc dưới bên phải */}
      <button
        type="button"
        className={`floating-chatbot-trigger ${isOpen ? "is-active" : ""}`}
        onClick={handleToggle}
        aria-label={isOpen ? "Đóng cửa sổ trợ lý ErgoBot" : "Mở trợ lý AI tư vấn công thái học ErgoBot"}
        title={isOpen ? "Đóng chat" : "Trợ lý AI ErgoBot (Tư vấn 24/7)"}
      >
        {/* Pulsing ring around chatbot button */}
        <span className="chatbot-pulse-halo" />

        {hasNewBadge && !isOpen && (
          <span className="chatbot-unread-badge" title="Tin nhắn mới">
            1
          </span>
        )}

        <div className="chatbot-icon-inner">
          {isOpen ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2v2" />
              <rect x="4" y="6" width="16" height="12" rx="3" />
              <circle cx="9" cy="12" r="1.5" fill="currentColor" />
              <circle cx="15" cy="12" r="1.5" fill="currentColor" />
              <path d="M9 15h6" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
            </svg>
          )}
        </div>

        {!isOpen && (
          <span className="chatbot-label-tooltip">
            Hỏi ErgoBot <strong>AI</strong> 👋
          </span>
        )}
      </button>
    </div>
  );
}
