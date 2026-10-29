"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";

export type FeedbackKind = "success" | "error" | "warning" | "info";

type DialogMode = "confirm" | "prompt";

type DialogState = {
  mode: DialogMode;
  kind: FeedbackKind;
  title: string;
  description?: string;
  confirmText: string;
  cancelText: string;
  placeholder?: string;
  value: string;
  resolve: (value: any) => void;
};

type ConfirmOptions = {
  kind?: FeedbackKind;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
};

type PromptOptions = ConfirmOptions & {
  placeholder?: string;
};

type FeedbackApi = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
};

const FeedbackContext = createContext<FeedbackApi | null>(null);

const ICON = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TONE = {
  success: "text-emerald-500 bg-emerald-500/10",
  error: "text-rose-500 bg-rose-500/10",
  warning: "text-amber-500 bg-amber-500/10",
  info: "text-sky-500 bg-sky-500/10",
};

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [dialog, setDialog] = useState<DialogState | null>(null);

  useEffect(() => setMounted(true), []);

  const open = useCallback(
    (mode: DialogMode, options: ConfirmOptions & { placeholder?: string }) =>
      new Promise<any>((resolve) => {
        setDialog({
          mode,
          kind: options.kind || "info",
          title: options.title,
          description: options.description,
          confirmText: options.confirmText || "确定",
          cancelText: options.cancelText || "取消",
          placeholder: options.placeholder,
          value: "",
          resolve,
        });
      }),
    []
  );

  const confirm = useCallback((options: ConfirmOptions) => open("confirm", options), [open]);
  const prompt = useCallback((options: PromptOptions) => open("prompt", options), [open]);

  const close = (result: any) => {
    dialog?.resolve(result);
    setDialog(null);
  };

  useEffect(() => {
    if (!dialog) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(dialog.mode === "confirm" ? false : null);
      if (event.key === "Enter" && dialog.mode === "confirm") close(true);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [dialog]);

  if (!mounted) return <FeedbackContext.Provider value={{ confirm, prompt }}>{children}</FeedbackContext.Provider>;

  const Icon = dialog ? ICON[dialog.kind] : Info;

  return (
    <FeedbackContext.Provider value={{ confirm, prompt }}>
      {children}
      {dialog && createPortal(
        <div
          className="fixed inset-0 z-[120000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-title"
            className="w-full max-w-sm rounded-2xl border border-white/60 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-900"
          >
            <div className="flex items-start gap-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${TONE[dialog.kind]}`}>
                <Icon size={17} />
              </div>
              <div className="min-w-0">
                <h2 id="feedback-title" className="text-sm font-black text-slate-900 dark:text-white">{dialog.title}</h2>
                {dialog.description && (
                  <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-500 dark:text-slate-400">{dialog.description}</p>
                )}
              </div>
            </div>

            {dialog.mode === "prompt" && (
              <textarea
                value={dialog.value}
                onChange={(event) => setDialog((current) => current ? { ...current, value: event.target.value } : current)}
                placeholder={dialog.placeholder}
                rows={3}
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white/80 p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100"
              />
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => close(dialog.mode === "confirm" ? false : null)} className="hv-button">
                {dialog.cancelText}
              </button>
              <button
                type="button"
                onClick={() => close(dialog.mode === "confirm" ? true : dialog.value)}
                className="hv-button hv-button-primary"
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("useFeedback 必须在 FeedbackProvider 内使用");
  return context;
}
