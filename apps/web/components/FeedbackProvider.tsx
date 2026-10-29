"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";

export type FeedbackKind = "success" | "error" | "warning" | "info";

type DialogMode = "alert" | "confirm" | "prompt";

type DialogState = {
  mode: DialogMode;
  kind: FeedbackKind;
  title: string;
  description?: string;
  confirmText: string;
  cancelText: string;
  placeholder?: string;
  value: string;
  busy: boolean;
  resolve: (value: any) => void;
};

type AlertOptions = {
  kind?: FeedbackKind;
  title: string;
  description?: string;
  confirmText?: string;
};

type ConfirmOptions = AlertOptions & {
  cancelText?: string;
};

type PromptOptions = ConfirmOptions & {
  placeholder?: string;
};

type FeedbackApi = {
  alert: (options: AlertOptions) => Promise<void>;
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
    (mode: DialogMode, options: AlertOptions & { cancelText?: string; placeholder?: string }) =>
      new Promise<any>((resolve) => {
        setDialog({
          mode,
          kind: options.kind || "info",
          title: options.title,
          description: options.description,
          confirmText: options.confirmText || "知道了",
          cancelText: options.cancelText || "取消",
          placeholder: options.placeholder,
          value: "",
          busy: false,
          resolve,
        });
      }),
    []
  );

  const alert = useCallback((options: AlertOptions) => open("alert", options), [open]);
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
      if (event.key === "Escape") close(dialog.mode === "alert" ? undefined : dialog.mode === "confirm" ? false : null);
      if (event.key === "Enter" && dialog.mode !== "prompt") close(dialog.mode === "confirm" ? true : undefined);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [dialog]);

  if (!mounted) return <FeedbackContext.Provider value={{ alert, confirm, prompt }}>{children}</FeedbackContext.Provider>;

  const Icon = dialog ? ICON[dialog.kind] : Info;

  return (
    <FeedbackContext.Provider value={{ alert, confirm, prompt }}>
      {children}
      {dialog && createPortal(
        <div
          className="fixed inset-0 z-[120000] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && dialog.mode === "alert") close(undefined);
          }}
        >
          <div
            role={dialog.mode === "alert" ? "alertdialog" : "dialog"}
            aria-modal="true"
            aria-labelledby="feedback-title"
            className="w-full max-w-md rounded-3xl border border-white/50 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${TONE[dialog.kind]}`}>
              <Icon size={22} />
            </div>
            <h2 id="feedback-title" className="mt-4 text-lg font-black text-slate-900 dark:text-white">{dialog.title}</h2>
            {dialog.description && (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-500 dark:text-slate-400">{dialog.description}</p>
            )}

            {dialog.mode === "prompt" && (
              <textarea
                value={dialog.value}
                onChange={(event) => setDialog((current) => current ? { ...current, value: event.target.value } : current)}
                placeholder={dialog.placeholder}
                rows={3}
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm text-slate-800 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100"
              />
            )}

            <div className="mt-6 flex justify-end gap-2">
              {dialog.mode !== "alert" && (
                <button type="button" onClick={() => close(dialog.mode === "confirm" ? false : null)} className="hv-button">
                  {dialog.cancelText}
                </button>
              )}
              <button
                type="button"
                disabled={dialog.busy}
                onClick={() => close(dialog.mode === "confirm" ? true : dialog.mode === "prompt" ? dialog.value : undefined)}
                className="hv-button hv-button-primary inline-flex items-center gap-2 disabled:opacity-50"
              >
                {dialog.busy && <Loader2 size={14} className="animate-spin" />}
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
