"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastTone = "success" | "warning" | "error" | "info";

type ToastState = {
  text: string;
  tone: ToastTone;
  key: number;
};

type ToastApi = {
  showToast: (text: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const TONE_STYLE: Record<ToastTone, string> = {
  success: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  warning: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  error: "border-rose-400/30 bg-rose-500/15 text-rose-100",
  info: "border-sky-400/30 bg-sky-500/15 text-sky-100",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(0);

  const showToast = useCallback((text: string, tone: ToastTone = "success") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const key = ++counter.current;
    setToast({ text, tone, key });

    timerRef.current = setTimeout(() => {
      setToast((current) => (current?.key === key ? null : current));
      timerRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      <style>{`
        @keyframes admin-toast-in {
          from { opacity: 0; transform: translate3d(0, -8px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .admin-toast { animation: admin-toast-in 160ms ease-out both; }
      `}</style>

      {children}

      <div className="pointer-events-none fixed inset-x-0 top-20 z-[9999] flex justify-center px-4" aria-live="polite">
        {toast && (
          <div
            key={toast.key}
            role="status"
            className={`admin-toast pointer-events-auto flex max-w-xl items-center gap-3 rounded-2xl border px-5 py-3 shadow-2xl backdrop-blur-xl ${TONE_STYLE[toast.tone]}`}
          >
            <span className="text-sm font-bold leading-6">{toast.text}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="rounded-full px-1 text-base leading-none text-white/50 transition hover:text-white"
              aria-label="关闭提示"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast 必须在 ToastProvider 内部使用");
  return context;
}
