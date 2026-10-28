"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastKind = "success" | "warning" | "error" | "info";

type ToastItem = {
  id: number;
  message: string;
  kind: ToastKind;
};

type ToastApi = {
  showToast: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastApi | null>(null);
const TOAST_DURATION = 3000;
const MAX_VISIBLE = 3;

const KIND_CLASS: Record<ToastKind, string> = {
  success: "border-emerald-300/70 bg-emerald-600/95 text-white",
  warning: "border-amber-300/70 bg-amber-600/95 text-white",
  error: "border-rose-300/70 bg-rose-600/95 text-white",
  info: "border-sky-300/70 bg-sky-600/95 text-white",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const sequence = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  const remove = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, kind: ToastKind = "success") => {
      const id = ++sequence.current;
      setItems((current) => [...current, { id, message, kind }].slice(-MAX_VISIBLE));

      const timer = setTimeout(() => {
        remove(id);
        timers.current.delete(timer);
      }, TOAST_DURATION);
      timers.current.add(timer);
    },
    [remove]
  );

  useEffect(() => {
    return () => {
      for (const timer of timers.current) clearTimeout(timer);
      timers.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translate3d(0, -10px, 0) scale(.97); }
          to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        .toast-card { animation: toast-in 180ms ease-out both; }
      `}</style>

      {children}

      <div
        className="pointer-events-none fixed inset-x-0 top-20 z-[9999] flex flex-col items-center gap-2 px-4"
        aria-live="polite"
        aria-atomic="false"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={`toast-card pointer-events-auto flex max-w-[min(32rem,calc(100vw-2rem))] items-center gap-2 rounded-2xl border px-5 py-3 shadow-xl backdrop-blur-md ${KIND_CLASS[item.kind]}`}
          >
            <span className="text-sm font-bold leading-6">{item.message}</span>
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="ml-1 rounded-full px-1 text-lg leading-none text-white/70 transition hover:text-white"
              aria-label="关闭提示"
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
  if (!context) throw new Error("useToast 必须在 ToastProvider 内部使用");
  return context;
}
