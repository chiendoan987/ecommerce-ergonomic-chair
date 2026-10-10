"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils/format";
import type { ChatbotProductSuggestion } from "@/lib/types/chatbot";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
  engine?: "groq" | "database_fallback";
  suggestedProducts?: ChatbotProductSuggestion[];
  orderInfo?: {
    id: string;
    status: string;
    statusLabel: string;
    carrier?: string;
    trackingCode?: string;
    total: number;
    paymentStatus: string;
  } | null;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "m-1",
    sender: "bot",
    text: "Xin chào bạn! 👋 Tôi là **ErgoBot** - Trợ lý công thái học thông minh của ErgoChair.",
    time: "Vừa xong",
    engine: "groq",
  },
  {
    id: "m-2",
    sender: "bot",
    text: "Tôi có thể giúp bạn chọn mẫu ghế chuẩn vóc dáng, báo giá theo ngân sách, tra cứu mã đơn hàng hoặc giải đáp chính sách bảo hành 5 năm & giao hàng miễn phí.",
    time: "Vừa xong",
    engine: "groq",
  },
];

const SUGGESTION_CHIPS = [
  "📦 Đơn hàng đã giao đến đâu?",
  "🔍 Tra cứu đơn hàng gần nhất",
  "📏 Ghế cho người 1m60 - 1m75",
  "💰 Ghế công thái học tầm 6 triệu",
  "🛡️ Chính sách bảo hành bao lâu?",
  "🚚 Giao hàng & lắp đặt tận phòng",
];

/**
 * Helper định dạng nội dung tin nhắn Markdown cơ bản (bold, link)
 */
function FormattedMessageText({
  text,
  onNavigate,
}: {
  text: string;
  onNavigate?: (url: string) => void;
}) {
  // Trích xuất mã đơn hàng nếu có trong toàn bộ tin nhắn để đính kèm link khi bấm vào "Đơn hàng của tôi"
  const orderIdInMessage = text.match(/\b(ord-[a-zA-Z0-9-]+)\b/i)?.[1];

  const handleLinkClick = (e: React.MouseEvent, targetUrl: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    if (onNavigate) {
      onNavigate(targetUrl);
    }
  };

  // Tách dòng để giữ xuống hàng
  const lines = text.split("\n");

  return (
    <div className="chat-text-content">
      {lines.map((line, lineIdx) => {
        // Chuẩn hóa gỡ bỏ các cặp ** bao quanh [link](url) do AI sinh ra
        const normalizedLine = line
          .replace(/\*\*\[(.*?)\]\((.*?)\)\*\*/g, "[$1]($2)")
          .replace(/\[\*\*(.*?)\*\*\]\((.*?)\)/g, "[$1]($2)");

        // Tách các đoạn link markdown [Tên](/url) và bold **chữ**
        const parts = normalizedLine.split(/(\[.*?\]\(.*?\)|\*\*.*?\*\*)/g);

        return (
          <p key={lineIdx} style={{ margin: lineIdx > 0 ? "6px 0 0" : 0, lineHeight: 1.55 }}>
            {parts.map((part, partIdx) => {
              // 1. Markdown link: [Title](/url)
              const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
              if (linkMatch) {
                const [, linkText, rawUrl] = linkMatch;
                let effectiveUrl = rawUrl;
                // Chuẩn hóa /orders thành /account
                if (effectiveUrl.startsWith("/orders")) {
                  effectiveUrl = effectiveUrl.replace("/orders", "/account");
                }
                // Nếu link trỏ về /account và có mã đơn trong câu trả lời, tự động gắn query orderId
                if (
                  (effectiveUrl === "/account" || effectiveUrl.startsWith("/account?")) &&
                  orderIdInMessage &&
                  !effectiveUrl.includes("orderId=")
                ) {
                  effectiveUrl = effectiveUrl.includes("?")
                    ? `${effectiveUrl}&orderId=${encodeURIComponent(orderIdInMessage)}`
                    : `/account?orderId=${encodeURIComponent(orderIdInMessage)}`;
                }

                return (
                  <a
                    key={partIdx}
                    href={effectiveUrl}
                    onClick={(e) => handleLinkClick(e, effectiveUrl)}
                    className="chat-embedded-link"
                    title={`Mở ${linkText}`}
                    style={{
                      color: "#8b7355",
                      fontWeight: 700,
                      textDecoration: "underline",
                      cursor: "pointer",
                      padding: "1px 5px",
                      borderRadius: "4px",
                      background: "rgba(139, 115, 85, 0.12)",
                      display: "inline-block",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {linkText}
                  </a>
                );
              }

              // 2. Bold: **text**
              if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
              }

              return part;
            })}
          </p>
        );
      })}
    </div>
  );
}

export function FloatingChatbot() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [currentChips, setCurrentChips] = useState<string[]>(SUGGESTION_CHIPS);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewBadge, setHasNewBadge] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const idCounterRef = useRef(10);

  // Tự động cuộn xuống tin nhắn mới nhất
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

  const handleSend = async (textToSend?: string) => {
    let text = (textToSend || input).trim();
    if (!text || isTyping) return;

    // Trích xuất context đơn hàng gần nhất và tài khoản từ localStorage
    let lastOrderId: string | null = null;
    let userId: string | null = null;
    let userPhone: string | null = null;

    if (typeof window !== "undefined") {
      lastOrderId = localStorage.getItem("ergochair_last_order_id");
      try {
        const rawAuth = localStorage.getItem("ergochair-auth-session");
        if (rawAuth) {
          const parsed = JSON.parse(rawAuth);
          userId = parsed?.id || null;
          userPhone = parsed?.phone || null;
        }
      } catch {}
    }

    // Nếu người dùng chọn "Tra cứu đơn hàng gần nhất" và có mã đơn trong localStorage
    if (text.includes("Tra cứu đơn hàng gần nhất") && lastOrderId) {
      text = `Tra cứu trạng thái đơn hàng mã ${lastOrderId}`;
    }

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

    try {
      // Chuẩn bị lịch sử tin nhắn gửi đến Backend
      const historyPayload = messages.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));
      historyPayload.push({ sender: "user", text });

      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          messages: historyPayload,
          userContext: {
            lastOrderId,
            userId,
            phone: userPhone,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      idCounterRef.current += 1;
      const botId = idCounterRef.current;

      if (data.quickReplies && data.quickReplies.length > 0) {
        setCurrentChips(data.quickReplies);
      }

      const botMsg: Message = {
        id: `b-${botId}`,
        sender: "bot",
        text: data.message,
        time: currentTime,
        engine: data.engine,
        suggestedProducts: data.suggestedProducts || [],
        orderInfo: data.orderInfo || null,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Lỗi gửi tin nhắn chatbot:", err);
      idCounterRef.current += 1;
      const botMsg: Message = {
        id: `b-${idCounterRef.current}`,
        sender: "bot",
        text: "Hệ thống đang kết nối cơ sở dữ liệu. Bạn có thể gọi hotline **0989 608 685** hoặc thử đặt câu hỏi khác nhé!",
        time: currentTime,
        engine: "database_fallback",
        orderInfo: null,
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNavigate = (url: string) => {
    setIsOpen(false);
    router.push(url);
  };

  const handleChipClick = (chip: string) => {
    if (chip.includes("Xem Đơn hàng của tôi") || chip.includes("Xem tất cả Đơn hàng của tôi")) {
      setIsOpen(false);
      let targetUrl = "/account";
      if (typeof window !== "undefined") {
        const lastOrderId = localStorage.getItem("ergochair_last_order_id");
        if (lastOrderId) {
          targetUrl = `/account?orderId=${encodeURIComponent(lastOrderId)}`;
        }
      }
      router.push(targetUrl);
      return;
    }
    handleSend(chip);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  // Ẩn chatbot trên trang quản trị admin
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
                ErgoBot <span className="chat-badge-ai">Trợ lý AI</span>
              </h3>
              <p className="chat-bot-status">● Trực tuyến • Hỗ trợ 24/7</p>
            </div>
          </div>

          <div className="chat-header-actions">
            <button
              type="button"
              className="chat-action-btn"
              onClick={() => {
                setMessages(INITIAL_MESSAGES);
                setCurrentChips(SUGGESTION_CHIPS);
              }}
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
              <div className="chat-bubble-container" style={{ width: "100%", maxWidth: "100%" }}>
                <div className="chat-message-bubble">
                  <FormattedMessageText text={msg.text} onNavigate={handleNavigate} />

                  {/* Nút hành động trực tiếp xem tiến độ đơn hàng */}
                  {msg.sender === "bot" && (() => {
                    const orderId =
                      msg.orderInfo?.id ||
                      msg.text.match(/\b(ord-[a-zA-Z0-9-]+)\b/i)?.[1];
                    if (!orderId) return null;
                    return (
                      <div
                        style={{
                          marginTop: "10px",
                          paddingTop: "8px",
                          borderTop: "1px dashed rgba(139, 115, 85, 0.25)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            handleNavigate(
                              `/account?orderId=${encodeURIComponent(orderId)}`
                            )
                          }
                          className="chat-order-action-btn"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background:
                              "linear-gradient(135deg, #8b7355, #6f583e)",
                            color: "#ffffff",
                            padding: "7px 14px",
                            borderRadius: "8px",
                            fontSize: "12.5px",
                            fontWeight: 600,
                            border: "none",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(139, 115, 85, 0.2)",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <span>📦 Xem tiến độ đơn #{orderId}</span>
                          <span aria-hidden="true">➔</span>
                        </button>
                      </div>
                    );
                  })()}

                  {/* Render Product Suggestion Mini Cards nếu có */}
                  {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                    <div className="chat-product-suggestions">
                      {msg.suggestedProducts.map((prod) => (
                        <a
                          key={prod.id}
                          href={`/products/${prod.slug}`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavigate(`/products/${prod.slug}`);
                          }}
                          className="chat-product-card"
                          title={`Xem chi tiết ghế ${prod.name}`}
                        >
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="chat-product-img"
                            loading="lazy"
                          />
                          <div className="chat-product-info">
                            <h5 className="chat-product-name">{prod.name}</h5>
                            <div className="chat-product-price-row">
                              <span className="chat-product-price">
                                {formatPrice(prod.price)}
                              </span>
                              <span className="chat-product-badge">
                                {prod.inStock ? "Còn hàng" : "Đặt trước"}
                              </span>
                            </div>
                          </div>
                          <span className="chat-product-btn-arrow">→</span>
                        </a>
                      ))}
                    </div>
                  )}
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
                <div className="chat-typing-bubble" aria-label="ErgoBot đang suy nghĩ câu trả lời">
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
              {currentChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="chat-chip-btn"
                  onClick={() => handleChipClick(chip)}
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
              placeholder="Hỏi vóc dáng, giá ghế, mã đơn hàng..."
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
            ⚡ Trợ lý tư vấn công thái học ErgoChair • Hỗ trợ 24/7
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
