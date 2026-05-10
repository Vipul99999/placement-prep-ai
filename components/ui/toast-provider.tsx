"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (input: { title: string; description?: string; tone?: ToastTone }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  function showToast(input: { title: string; description?: string; tone?: ToastTone }) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((current) => [
      ...current,
      {
        id,
        title: input.title,
        description: input.description,
        tone: input.tone ?? "info"
      }
    ]);
  }

  function removeToast(id: number) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  const value = useMemo(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[80] flex justify-center px-4">
        <div className="grid w-full max-w-md gap-3">
          {items.map((item) => (
            <ToastCard key={item.id} item={item} onClose={() => removeToast(item.id)} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}

function ToastCard({
  item,
  onClose
}: {
  item: ToastItem;
  onClose: () => void;
}) {
  useEffect(() => {
    const timeout = window.setTimeout(onClose, 3400);
    return () => window.clearTimeout(timeout);
  }, [onClose]);

  return (
    <div
      className={
        item.tone === "success"
          ? "pointer-events-auto rounded-3xl border border-emerald-200 bg-white/95 px-4 py-4 shadow-lg ring-1 ring-emerald-100"
          : item.tone === "error"
            ? "pointer-events-auto rounded-3xl border border-red-200 bg-white/95 px-4 py-4 shadow-lg ring-1 ring-red-100"
            : "pointer-events-auto rounded-3xl border border-sky-200 bg-white/95 px-4 py-4 shadow-lg ring-1 ring-sky-100"
      }
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-ink">{item.title}</p>
          {item.description ? <p className="mt-1 text-sm leading-6 text-ink/70">{item.description}</p> : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-black/5 px-2 py-1 text-xs font-semibold text-ink/60"
        >
          Close
        </button>
      </div>
    </div>
  );
}
