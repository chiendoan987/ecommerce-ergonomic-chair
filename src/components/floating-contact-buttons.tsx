"use client";

import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site.config";

export function FloatingContactButtons() {
  const pathname = usePathname();

  // Hide on admin routes to prevent overlapping with admin UI
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <aside className="floating-contact-widget" aria-label="Kênh liên hệ hỗ trợ nhanh">
      {/* 1. Gọi điện / Hotline (Dưới cùng) */}
      <a
        href={`tel:${siteConfig.hotline.replace(/\s+/g, "")}`}
        className="floating-contact-btn btn-phone"
        aria-label={`Gọi ngay Hotline ${siteConfig.hotline}`}
      >
        <span className="phone-pulse-ring" />
        <span className="phone-pulse-ring ring-2" />
        <span className="floating-btn-icon phone-icon-anim">
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </span>
        <span className="floating-btn-tooltip">
          Hotline: <strong>{siteConfig.hotline}</strong> (Miễn phí)
        </span>
      </a>

      {/* 2. Zalo Chat */}
      <a
        href="https://zalo.me/0987654321"
        target="_blank"
        rel="noopener noreferrer"
        className="floating-contact-btn btn-zalo"
        aria-label="Chat tư vấn qua Zalo"
      >
        <span className="zalo-pulse-ring" />
        <span className="zalo-pulse-ring ring-2" />
        <span className="floating-btn-icon">
          <svg viewBox="0 0 44 44" width="28" height="28" fill="none" aria-hidden="true">
            <text
              x="50%"
              y="56%"
              dominantBaseline="middle"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="14"
              fontWeight="800"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              letterSpacing="-0.5px"
            >
              Zalo
            </text>
          </svg>
        </span>
        <span className="floating-btn-tooltip">
          Chat Zalo: <strong>0987.654.321</strong> (Tư vấn 24/7)
        </span>
      </a>

      {/* 3. Facebook Messenger */}
      <a
        href="https://m.me/ergochair.vn"
        target="_blank"
        rel="noopener noreferrer"
        className="floating-contact-btn btn-messenger"
        aria-label="Nhắn tin qua Facebook Messenger"
      >
        <span className="messenger-pulse-ring" />
        <span className="messenger-pulse-ring ring-2" />
        <span className="floating-btn-icon">
          <svg viewBox="0 0 28 28" width="24" height="24" fill="currentColor" aria-hidden="true">
            <path d="M14 2C7.373 2 2 6.974 2 13.11c0 3.493 1.746 6.622 4.482 8.65v4.24l4.062-2.23c1.096.305 2.26.47 3.456.47 6.627 0 12-4.974 12-11.11C26 6.974 20.627 2 14 2zm1.28 14.932l-3.136-3.345-6.119 3.345 6.729-7.146 3.214 3.345 6.041-3.345-6.729 7.146z" />
          </svg>
        </span>
        <span className="floating-btn-tooltip">
          Nhắn tin <strong>Messenger</strong>
        </span>
      </a>
    </aside>
  );
}
