"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * ScrollRevealProvider - Kích hoạt hiệu ứng xuất hiện siêu êm ái khi cuộn trang
 * Tự động reset khi cuộn ngược lên để khi cuộn xuống luôn có animation mượt mà
 */
export function ScrollRevealProvider() {
  const pathname = usePathname();

  useEffect(() => {
    // 1. Tôn trọng hash links nếu có (#products, #reviews)
    if (!window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [pathname]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;

          if (entry.isIntersecting) {
            const delay = target.getAttribute("data-reveal-delay");
            if (delay) {
              target.style.transitionDelay = `${delay}ms`;
            }
            target.classList.add("is-revealed");
            target.setAttribute("data-revealed", "true");
          } else {
            // Khi phần tử trượt ra khỏi đáy màn hình (người dùng cuộn ngược lên đầu trang),
            // reset lại để khi cuộn xuống tiếp tục có hiệu ứng mượt mà
            const rect = entry.boundingClientRect;
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            if (rect.top > viewportHeight + 10) {
              target.classList.remove("is-revealed");
              target.removeAttribute("data-revealed");
              target.style.transitionDelay = "";
            }
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -15px 0px",
        threshold: 0.02,
      }
    );

    const observeAll = () => {
      const elements = document.querySelectorAll<HTMLElement>(
        "[data-reveal], .reveal-on-scroll"
      );
      const vh = window.innerHeight || document.documentElement.clientHeight;
      elements.forEach((el) => {
        // Tự động reveal các phần tử đã nằm trong tầm nhìn lúc đầu (như Hero)
        const rect = el.getBoundingClientRect();
        if (rect.top < vh && rect.bottom > 0) {
          const delay = el.getAttribute("data-reveal-delay");
          if (delay) {
            el.style.transitionDelay = `${delay}ms`;
          }
          el.classList.add("is-revealed");
          el.setAttribute("data-revealed", "true");
        }
        observer.observe(el);
      });
    };

    // Khởi chạy ngay và đồng bộ lại ở frame tiếp theo
    observeAll();
    const rafId = requestAnimationFrame(observeAll);

    const mutationObserver = new MutationObserver(() => {
      observeAll();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);

  return null;
}
