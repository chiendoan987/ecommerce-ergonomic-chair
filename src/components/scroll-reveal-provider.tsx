"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function ScrollRevealProvider() {
  const pathname = usePathname();

  // 1. Auto scroll to top on refresh and route change
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    const handleBeforeUnload = () => {
      window.scrollTo(0, 0);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  // 2. IntersectionObserver for scroll-reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            target.classList.add("is-revealed");
            target.setAttribute("data-revealed", "true");
            observer.unobserve(target);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -40px 0px",
        threshold: 0.05,
      }
    );

    const observeAll = () => {
      const elements = document.querySelectorAll<HTMLElement>(
        "[data-reveal]:not(.is-revealed), .reveal-on-scroll:not(.is-revealed)"
      );
      elements.forEach((el) => observer.observe(el));
    };

    // Run after React hydration has completed
    const timer = setTimeout(observeAll, 120);

    const mutationObserver = new MutationObserver(() => {
      observeAll();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);

  return null;
}
