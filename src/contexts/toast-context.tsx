"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ToastContextValue, ToastItem, ToastOptions, ToastType } from "@/lib/types/toast";

export const ToastContext = createContext<ToastContextValue | null>(null);

function ToastIcon({ type }: { type: ToastType }) {
  switch (type) {
    case "success":
      return (
        <svg className="toast-icon success" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10" cy="10" r="8" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" />
          <path d="M6.5 10l2.5 2.5 4.5-5" stroke="#10b981" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "error":
      return (
        <svg className="toast-icon error" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10" cy="10" r="8" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" />
          <path d="M7 7l6 6M13 7l-6 6" stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "warning":
      return (
        <svg className="toast-icon warning" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10" cy="10" r="8" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" />
          <path d="M10 6v5M10 14h.01" stroke="#f59e0b" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "info":
    default:
      return (
        <svg className="toast-icon info" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10" cy="10" r="8" fill="rgba(59, 130, 246, 0.15)" stroke="#3b82f6" />
          <path d="M10 9v5M10 6h.01" stroke="#3b82f6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = "info", options?: ToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const duration = options?.duration ?? 3500;
      const newToast: ToastItem = {
        id,
        type,
        message,
        title: options?.title,
        duration,
      };

      setToasts((prev) => [...prev.slice(-4), newToast]);

      if (duration > 0) {
        window.setTimeout(() => {
          dismiss(id);
        }, duration);
      }

      return id;
    },
    [dismiss]
  );

  const success = useCallback((message: string, options?: ToastOptions) => show(message, "success", options), [show]);
  const error = useCallback((message: string, options?: ToastOptions) => show(message, "error", options), [show]);
  const info = useCallback((message: string, options?: ToastOptions) => show(message, "info", options), [show]);
  const warning = useCallback((message: string, options?: ToastOptions) => show(message, "warning", options), [show]);

  const value = useMemo(
    () => ({
      toasts,
      show,
      success,
      error,
      info,
      warning,
      dismiss,
    }),
    [toasts, show, success, error, info, warning, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-portal-container" aria-live="polite" role="region" aria-label="Thông báo">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card toast-${toast.type}`} role="status">
            <ToastIcon type={toast.type} />
            <div className="toast-body">
              {toast.title && <strong className="toast-title">{toast.title}</strong>}
              <p className="toast-message">{toast.message}</p>
            </div>
            <button
              type="button"
              className="toast-close-btn"
              onClick={() => dismiss(toast.id)}
              aria-label="Đóng thông báo"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
