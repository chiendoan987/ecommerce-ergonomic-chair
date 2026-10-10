"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site.config";
import { useToast } from "@/hooks/use-toast";

const CONTACT_PHONE = "0989 608 685";
const CONTACT_CLEAN = "0989608685";
const ZALO_PHONE = CONTACT_PHONE;
const ZALO_CLEAN = CONTACT_CLEAN;
const HOTLINE_DISPLAY = siteConfig.hotline || CONTACT_PHONE;
const HOTLINE_CLEAN = HOTLINE_DISPLAY.replace(/\s+/g, "");

const ZALO_SVG_PATH =
  "M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 01-.5763-.5729l-.0006.0005a3.273 3.273 0 01-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 011.9372.6321l.0006.0005zM6.9188 7.7896v.205c0 .3823-.051.6944-.2995 1.0605l-.03.0343c-.0542.0615-.1815.206-.2421.2843L2.024 14.8h4.8948v.7682a.5764.5764 0 01-.5767.5761H0v-.3622c0-.4436.1102-.6414.2495-.8476L4.8582 9.23H.1922V7.7896h6.7266zm8.5513 8.3548a.4805.4805 0 01-.4803-.4798v-7.875h1.4416v8.3548H15.47zM20.6934 9.6C22.52 9.6 24 11.0807 24 12.9044c0 1.8252-1.4801 3.306-3.3066 3.306-1.8264 0-3.3066-1.4808-3.3066-3.306 0-1.8237 1.4802-3.3044 3.3066-3.3044zm-10.1412 5.253c1.0675 0 1.9324-.8645 1.9324-1.9312 0-1.065-.865-1.9295-1.9324-1.9295s-1.9324.8644-1.9324 1.9295c0 1.0667.865 1.9312 1.9324 1.9312zm10.1412-.0033c1.0737 0 1.945-.8707 1.945-1.9453 0-1.073-.8713-1.9436-1.945-1.9436-1.0753 0-1.945.8706-1.945 1.9453 0 1.0746.8697 1.9453 1.945 1.9453z";

export function FloatingContactButtons() {
  const pathname = usePathname();
  const toast = useToast();

  const [activeModal, setActiveModal] = useState<"hotline" | "zalo" | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Close modal when pressing ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveModal(null);
      }
    };
    if (activeModal) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModal]);

  // Hide on admin routes to prevent overlapping with admin UI
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const copyToClipboard = (text: string, label: string, key: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success(`Đã sao chép ${label}: ${text}`);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleHotlineClick = (e: React.MouseEvent) => {
    e.preventDefault();
    copyToClipboard(HOTLINE_DISPLAY, "Hotline", "hotline-main");

    // Nếu trên thiết bị di động, tự động kích hoạt cuộc gọi
    const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `tel:${HOTLINE_CLEAN}`;
    }

    setActiveModal("hotline");
  };

  const handleZaloClick = (e: React.MouseEvent) => {
    e.preventDefault();
    copyToClipboard(ZALO_PHONE, "số Zalo", "zalo-main");

    // Nếu trên thiết bị di động, tự động mở ứng dụng Zalo
    const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.open(`https://zalo.me/${ZALO_CLEAN}`, "_blank");
    }

    setActiveModal("zalo");
  };

  return (
    <>
      <aside className="floating-contact-widget" aria-label="Kênh liên hệ hỗ trợ nhanh">
        {/* 1. Gọi điện / Hotline (Dưới cùng) */}
        <button
          type="button"
          onClick={handleHotlineClick}
          className="floating-contact-btn btn-phone"
          aria-label={`Gọi ngay Hotline ${HOTLINE_DISPLAY}`}
        >
          {/* Sóng radar đa tầng lan tỏa liên tục */}
          <span className="phone-pulse-ring ring-1" />
          <span className="phone-pulse-ring ring-2" />
          <span className="phone-pulse-ring ring-3" />
          {/* Hiệu ứng tia sáng phản quang quét qua nút */}
          <span className="floating-btn-shimmer" />

          {/* Icon tai nghe rung chuông & sóng âm thanh đa tầng phát ra */}
          <span className="floating-btn-icon">
            <svg
              viewBox="0 0 32 32"
              width="27"
              height="27"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <g className="phone-handset-anim">
                <path
                  d="M19.5 15.6v2.5a1.6 1.6 0 0 1-1.7 1.6 16.5 16.5 0 0 1-7.2-2.6 16.2 16.2 0 0 1-5-5 16.5 16.5 0 0 1-2.6-7.2A1.6 1.6 0 0 1 4.6 3.2h2.5a1.6 1.6 0 0 1 1.6 1.4c.1.8.3 1.6.6 2.3a1.6 1.6 0 0 1-.4 1.7l-1 1a13.3 13.3 0 0 0 5 5l1-1a1.6 1.6 0 0 1 1.7-.4c.7.3 1.5.5 2.3.6a1.6 1.6 0 0 1 1.4 1.6z"
                  fill="#ffffff"
                />
              </g>
              <path
                className="phone-sound-wave wave-1"
                d="M18 7a6 6 0 0 1 4.5 4.5"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                className="phone-sound-wave wave-2"
                d="M21 4a10.5 10.5 0 0 1 7.5 7.5"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </span>

          <span className="floating-btn-tooltip">
            <span className="floating-tooltip-title">Tổng đài Hotline</span>
            <span className="floating-tooltip-desc">
              <strong>{HOTLINE_DISPLAY}</strong> • Bấm để gọi ngay
            </span>
          </span>
        </button>

        {/* 2. Zalo Chat */}
        <button
          type="button"
          onClick={handleZaloClick}
          className="floating-contact-btn btn-zalo"
          aria-label="Chat tư vấn qua Zalo"
        >
          {/* Sóng radar xanh lan tỏa liên tục */}
          <span className="zalo-pulse-ring ring-1" />
          <span className="zalo-pulse-ring ring-2" />
          <span className="zalo-pulse-ring ring-3" />
          {/* Hiệu ứng ánh sáng phản quang */}
          <span className="floating-btn-shimmer" />

          {/* Icon bong bóng thoại Zalo chính hãng cử động nhấp nhô sống động */}
          <span className="floating-btn-icon zalo-bubble-anim">
            <svg
              viewBox="0 0 40 40"
              width="33"
              height="33"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M20 5C11.16 5 4 11.27 4 19c0 3.12 1.18 5.99 3.21 8.27L5.5 32.8a.9.9 0 0 0 1.2 1.09l6.15-2.73C15.08 32.22 17.48 33 20 33c8.84 0 16-6.27 16-14S28.84 5 20 5z"
                fill="#ffffff"
              />
              <g transform="translate(8.96, 7.16) scale(0.92)">
                <path d={ZALO_SVG_PATH} fill="#0068FF" />
              </g>
            </svg>
          </span>

          <span className="floating-btn-tooltip">
            <span className="floating-tooltip-title">Tư vấn Zalo Trực Tuyến</span>
            <span className="floating-tooltip-desc">
              <strong>{ZALO_PHONE}</strong> • Nhận báo giá &amp; video
            </span>
          </span>
        </button>
      </aside>

      {/* POPUP 1: HOTLINE CALL DIALOG */}
      {activeModal === "hotline" && (
        <div className="contact-modal-overlay" onClick={() => setActiveModal(null)} role="dialog" aria-modal="true">
          <div className="contact-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="contact-modal-header">
              <div className="contact-modal-header-info">
                <div className="contact-modal-icon-badge phone" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                    <path
                      d="M19.5 15.6v2.5a1.6 1.6 0 0 1-1.7 1.6 16.5 16.5 0 0 1-7.2-2.6 16.2 16.2 0 0 1-5-5 16.5 16.5 0 0 1-2.6-7.2A1.6 1.6 0 0 1 4.6 3.2h2.5a1.6 1.6 0 0 1 1.6 1.4c.1.8.3 1.6.6 2.3a1.6 1.6 0 0 1-.4 1.7l-1 1a13.3 13.3 0 0 0 5 5l1-1a1.6 1.6 0 0 1 1.7-.4c.7.3 1.5.5 2.3.6a1.6 1.6 0 0 1 1.4 1.6z"
                      fill="#ffffff"
                    />
                    <path d="M18 7a6 6 0 0 1 4.5 4.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                    <path d="M21 4a10.5 10.5 0 0 1 7.5 7.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="contact-modal-title">Tổng Đài Hỗ Trợ ErgoChair</h3>
                  <p className="contact-modal-subtitle">Tư vấn chọn ghế công thái học &amp; giải đáp đơn hàng</p>
                </div>
              </div>
              <button
                type="button"
                className="contact-modal-close-btn"
                onClick={() => setActiveModal(null)}
                aria-label="Đóng cửa sổ"
              >
                ✕
              </button>
            </div>

            <div className="contact-modal-body">
              {/* Option 1: Hotline 0989 608 685 */}
              <div className="contact-item-card">
                <div>
                  <div className="contact-item-label">Tổng Đài Tư Vấn &amp; Hỗ Trợ</div>
                  <div className="contact-item-number">{HOTLINE_DISPLAY}</div>
                </div>
                <div className="contact-item-actions">
                  <a href={`tel:${HOTLINE_CLEAN}`} className="contact-action-btn call" title="Gọi ngay">
                    <span>📞 Gọi ngay</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(HOTLINE_DISPLAY, "Hotline", "hotline-1")}
                    className={`contact-action-btn copy ${copiedKey === "hotline-1" ? "copied" : ""}`}
                    title="Sao chép số"
                  >
                    <span>{copiedKey === "hotline-1" ? "✓ Đã chép" : "📋 Chép"}</span>
                  </button>
                </div>
              </div>

              {/* Option 2: Zalo Chat 0989 608 685 */}
              <div className="contact-item-card">
                <div>
                  <div className="contact-item-label">Tư Vấn &amp; Báo Giá Qua Zalo</div>
                  <div className="contact-item-number">{ZALO_PHONE}</div>
                </div>
                <div className="contact-item-actions">
                  <a
                    href={`https://zalo.me/${ZALO_CLEAN}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-action-btn call"
                    title="Chat Zalo ngay"
                    style={{ background: "#0068ff" }}
                  >
                    <span>💬 Chat Zalo</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(ZALO_PHONE, "số Zalo", "hotline-2")}
                    className={`contact-action-btn copy ${copiedKey === "hotline-2" ? "copied" : ""}`}
                    title="Sao chép số"
                  >
                    <span>{copiedKey === "hotline-2" ? "✓ Đã chép" : "📋 Chép"}</span>
                  </button>
                </div>
              </div>

              <div className="contact-modal-footer-info">
                <div>⏰ <strong>Thời gian hoạt động:</strong> 08:00 - 21:30 (Thứ 2 - Chủ Nhật, kể cả ngày lễ)</div>
                <div>📍 <strong>Showroom trải nghiệm:</strong> {siteConfig.address}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP 2: ZALO CHAT DIALOG */}
      {activeModal === "zalo" && (
        <div className="contact-modal-overlay" onClick={() => setActiveModal(null)} role="dialog" aria-modal="true">
          <div className="contact-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="contact-modal-header">
              <div className="contact-modal-header-info">
                <div className="contact-modal-icon-badge zalo" aria-hidden="true">
                  <svg viewBox="0 0 40 40" width="28" height="28" fill="none">
                    <path
                      d="M20 5C11.16 5 4 11.27 4 19c0 3.12 1.18 5.99 3.21 8.27L5.5 32.8a.9.9 0 0 0 1.2 1.09l6.15-2.73C15.08 32.22 17.48 33 20 33c8.84 0 16-6.27 16-14S28.84 5 20 5z"
                      fill="#ffffff"
                    />
                    <g transform="translate(8.96, 7.16) scale(0.92)">
                      <path d={ZALO_SVG_PATH} fill="#0068FF" />
                    </g>
                  </svg>
                </div>
                <div>
                  <h3 className="contact-modal-title">Tư Vấn Trực Tuyến Qua Zalo</h3>
                  <p className="contact-modal-subtitle">Nhận hình ảnh thực tế, video demo &amp; báo giá ưu đãi</p>
                </div>
              </div>
              <button
                type="button"
                className="contact-modal-close-btn"
                onClick={() => setActiveModal(null)}
                aria-label="Đóng cửa sổ"
              >
                ✕
              </button>
            </div>

            <div className="contact-modal-body">
              {/* QR Code Container */}
              <div className="contact-qr-container">
                <div className="contact-qr-frame">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://zalo.me/${ZALO_CLEAN}`}
                    alt="Mã QR Zalo ErgoChair"
                    width={180}
                    height={180}
                    style={{ display: "block", borderRadius: "8px" }}
                  />
                </div>
                <p className="contact-qr-desc">
                  Mở ứng dụng <strong>Zalo</strong> trên điện thoại và <strong>quét mã QR</strong> để kết nối trực tiếp với chuyên viên tư vấn ErgoChair.
                </p>
              </div>

              {/* Phone Copy Bar */}
              <div className="contact-item-card" style={{ padding: "10px 14px" }}>
                <div>
                  <div className="contact-item-label">Số điện thoại Zalo chính thức</div>
                  <div className="contact-item-number" style={{ fontSize: "1.1rem" }}>{ZALO_PHONE}</div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(ZALO_PHONE, "số Zalo", "zalo-modal")}
                  className={`contact-action-btn copy ${copiedKey === "zalo-modal" ? "copied" : ""}`}
                >
                  <span>{copiedKey === "zalo-modal" ? "✓ Đã chép" : "📋 Sao chép số"}</span>
                </button>
              </div>

              {/* Direct Open Link */}
              <a
                href={`https://zalo.me/${ZALO_CLEAN}`}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-zalo-open-btn"
              >
                <span>Mở Zalo Web / Ứng Dụng Zalo ↗</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
