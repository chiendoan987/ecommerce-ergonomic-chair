"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Nút cuộn về đầu trang siêu êm với vòng đo tiến trình SVG và chuyển động cubic-easing
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.pageYOffset || document.documentElement.scrollTop;
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;

          setVisible(scrollY > 280);

          if (scrollHeight > 0) {
            setScrollProgress(Math.min(100, Math.max(0, (scrollY / scrollHeight) * 100)));
          } else {
            setScrollProgress(0);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Thuật toán cuộn mượt mà như nhung sử dụng easeInOutCubic
  const scrollToTopSmoothly = () => {
    if (isScrolling) return;

    const startY = window.pageYOffset || document.documentElement.scrollTop;
    if (startY <= 0) return;

    setIsScrolling(true);

    const html = document.documentElement;
    const originalScrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";

    // Thời gian cuộn êm ái, thanh thoát: 750ms - 1050ms
    const duration = Math.min(1050, Math.max(750, Math.sqrt(startY) * 22));
    let startTime: number | null = null;

    // Đường cong giảm tốc Quartic mượt như nhung (nhẹ nhàng coasting về đỉnh)
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const cleanup = () => {
      html.style.scrollBehavior = originalScrollBehavior;
      setIsScrolling(false);
      window.removeEventListener("wheel", cancelScroll);
      window.removeEventListener("touchstart", cancelScroll);
      window.removeEventListener("keydown", cancelScroll);
      animFrameRef.current = null;
    };

    const cancelScroll = () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      cleanup();
    };

    window.addEventListener("wheel", cancelScroll, { passive: true });
    window.addEventListener("touchstart", cancelScroll, { passive: true });
    window.addEventListener("keydown", cancelScroll, { passive: true });

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutQuart(progress);

      window.scrollTo(0, Math.round(startY * (1 - eased)));

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        window.scrollTo(0, 0);
        cleanup();
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  };

  // Tính toán vòng cung SVG (bán kính 20px, chu vi = 2 * PI * 20 = 125.66px)
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <button
      type="button"
      className={`luxury-scroll-top-btn ${visible ? "is-visible" : ""} ${isScrolling ? "is-active" : ""}`}
      onClick={scrollToTopSmoothly}
      aria-label="Cuộn mượt mà lên đầu trang"
      title={`Lên đầu trang (${Math.round(scrollProgress)}%)`}
    >
      {/* Vòng tròn đo tiến trình SVG */}
      <svg className="scroll-progress-ring" width="46" height="46" viewBox="0 0 46 46">
        <circle
          className="progress-ring-bg"
          cx="23"
          cy="23"
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="2.5"
        />
        <circle
          className="progress-ring-indicator"
          cx="23"
          cy="23"
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d4a373" />
            <stop offset="100%" stopColor="#ff9a24" />
          </linearGradient>
        </defs>
      </svg>

      {/* Mũi tên hướng lên với micro-bounce */}
      <span className="scroll-arrow-icon" aria-hidden="true">
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      </span>
    </button>
  );
}
