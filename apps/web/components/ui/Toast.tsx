"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type Toast = { id: string; message: string; type: "success" | "error" | "info" };
type ToastCtx = { toasts: Toast[]; addToast: (msg: string, type?: Toast["type"]) => void };

const Ctx = createContext<ToastCtx>({ toasts: [], addToast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <Ctx.Provider value={{ toasts, addToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto animate-in slide-in-from-right-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg backdrop-blur ${
              t.type === "success" ? "bg-green-600/90 text-white" : t.type === "error" ? "bg-red-600/90 text-white" : "bg-white/10 text-white"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}