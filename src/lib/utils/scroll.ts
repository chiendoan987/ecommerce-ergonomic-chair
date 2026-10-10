/**
 * Tiện ích cuộn mượt mà lên đầu trang với thuật toán Quartic easing
 */
export function smoothScrollToTop(customDuration?: number): void {
  if (typeof window === "undefined") return;

  const startY = window.pageYOffset || document.documentElement.scrollTop;
  if (startY <= 0) return;

  const html = document.documentElement;
  const originalScrollBehavior = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";

  // Thời gian cuộn cân đối (550ms - 850ms) tạo cảm giác êm dịu, không giật cục
  const duration = customDuration || Math.min(850, Math.max(550, Math.sqrt(startY) * 18));
  let startTime: number | null = null;
  let animId: number | null = null;

  // Đường cong giảm tốc Quartic tự nhiên, êm dịu (nhẹ dần về đỉnh)
  const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

  const cleanup = () => {
    html.style.scrollBehavior = originalScrollBehavior;
    window.removeEventListener("wheel", cancelScroll);
    window.removeEventListener("touchstart", cancelScroll);
    window.removeEventListener("keydown", cancelScroll);
    animId = null;
  };

  const cancelScroll = () => {
    if (animId) cancelAnimationFrame(animId);
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
      animId = requestAnimationFrame(step);
    } else {
      window.scrollTo(0, 0);
      cleanup();
    }
  };

  animId = requestAnimationFrame(step);
}
