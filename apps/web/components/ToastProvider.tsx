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
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

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
  success: "border-emerald-200/80 bg-emerald-50/95 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-950/90 dark:text-emerald-300",
  warning: "border-amber-200/80 bg-amber-50/95 text-amber-700 dark:border-amber-400/20 dark:bg-amber-950/90 dark:text-amber-300",
  error: "border-rose-200/80 bg-rose-50/95 text-rose-700 dark:border-rose-400/20 dark:bg-rose-950/90 dark:text-rose-300",
  info: "border-sky-200/80 bg-sky-50/95 text-sky-700 dark:border-sky-400/20 dark:bg-sky-950/90 dark:text-sky-300",
};

const KIND_ICON = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
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
        {items.map((item) => {
          const Icon = KIND_ICON[item.kind];
          return (
          <div
            key={item.id}
            role="status"
            className={`toast-card pointer-events-auto flex max-w-[min(30rem,calc(100vw-2rem))] items-center gap-2.5 rounded-xl border px-4 py-2.5 shadow-lg backdrop-blur-md ${KIND_CLASS[item.kind]}`}
          >
            <Icon size={15} className="shrink-0" />
            <span className="text-description font-bold leading-5">{item.message}</span>
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="ml-1 rounded-full px-1 text-lg leading-none opacity-60 transition hover:opacity-100"
              aria-label="关闭提示"
            >
              ×
            </button>
          </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast 必须在 ToastProvider 内部使用");
  return context;
}
