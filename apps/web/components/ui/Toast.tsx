"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

export type ToastVariant = "success" | "error" | "warning" | "info";

type ToastItem = { id: string; message: string; variant: ToastVariant };

type ToastContextValue = {
  /** Show a toast of the given variant (defaults to "info"). */
  showToast: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
};

const noop = () => {};
const ToastContext = createContext<ToastContextValue>({
  showToast: noop,
  success: noop,
  error: noop,
  warning: noop,
  info: noop,
});

const AUTO_DISMISS_MS = 4000;

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: "bg-success text-white",
  error: "bg-red-600 text-white",
  warning: "bg-warning text-white",
  info: "bg-accent text-white",
};

function VariantIcon({ variant }: { variant: ToastVariant }) {
  const common = "h-5 w-5 shrink-0";
  switch (variant) {
    case "success":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={common} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      );
    case "error":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={common} aria-hidden="true">
          <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5" />
        </svg>
      );
    case "warning":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={common} aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.29 3.86l-8.18 14.18A1.5 1.5 0 003.5 19.5h17a1.5 1.5 0 001.39-2.46L13.71 3.86a1.5 1.5 0 00-2.42 0z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 3h.008" />
        </svg>
      );
    case "info":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={common} aria-hidden="true">
          <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v5m0-8h.008" />
        </svg>
      );
  }
}

/**
 * Global toast/notification system (bottom-right, mobile: full-width above the safe area).
 * Mount once at the root (`app/layout.tsx`) — every page reaches it via `useToast()`. Don't
 * mount a second `ToastProvider` inside a nested layout; that creates an isolated context whose
 * toasts render in a different stacking position than the rest of the app.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value: ToastContextValue = {
    showToast,
    success: (message) => showToast(message, "success"),
    error: (message) => showToast(message, "error"),
    warning: (message) => showToast(message, "warning"),
    info: (message) => showToast(message, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              role={t.variant === "error" || t.variant === "warning" ? "alert" : "status"}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`pointer-events-auto flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg backdrop-blur sm:w-auto sm:max-w-sm ${VARIANT_CLASSES[t.variant]}`}
            >
              <VariantIcon variant={t.variant} />
              <p className="flex-1 leading-snug">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded-full p-0.5 text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
