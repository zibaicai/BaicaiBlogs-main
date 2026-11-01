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
import { createPortal } from "react-dom";
import { Loader2, ShieldCheck, X } from "lucide-react";

interface HumanStatus {
  verified: boolean;
  remaining: number;
  expiresAt: string | null;
}

interface FriendsVerificationContextValue {
  verified: boolean;
  remaining: number | null;
  requestVerification: () => void;
  ensureVerified: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
}

const FriendsVerificationContext = createContext<FriendsVerificationContextValue | null>(null);

export function useFriendsVerification() {
  const context = useContext(FriendsVerificationContext);
  if (!context) throw new Error("useFriendsVerification must be used within FriendsVerificationProvider");
  return context;
}

/**
 * One shared Turnstile widget and one server-backed verification session for
 * the friend page. Forms only request/await verification; they never own a
 * widget or a token themselves.
 */
export default function FriendsVerificationProvider({ children }: { children: ReactNode }) {
  const [verified, setVerified] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<{ enabled: boolean; siteKey: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const widgetRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const configRef = useRef<Promise<void> | null>(null);
  const pendingRef = useRef<Array<(value: boolean) => void>>([]);

  const settlePending = useCallback((value: boolean) => {
    const pending = pendingRef.current;
    pendingRef.current = [];
    pending.forEach((resolve) => resolve(value));
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/public/human/status", { credentials: "include" });
      const json = await response.json();
      const data = json?.data as HumanStatus | undefined;
      const next = Boolean(data?.verified && (data.remaining ?? 0) > 0);
      setVerified(next);
      setRemaining(data?.remaining ?? 0);
    } catch {
      setVerified(false);
      setRemaining(null);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const loadConfig = useCallback(() => {
    if (configRef.current) return configRef.current;
    configRef.current = fetch("/api/auth/config", { credentials: "include" })
      .then((response) => response.json())
      .then((json) => {
        const data = json?.data || {};
        setConfig({
          enabled: Boolean(data.turnstileEnabled),
          siteKey: data.turnstileSiteKey || "",
        });
      })
      .catch(() => setConfig({ enabled: false, siteKey: "" }));
    return configRef.current;
  }, []);

  const loadScript = useCallback(() => {
    if (!config?.enabled || !config.siteKey) return;
    if ((window as any).turnstile) {
      setReady(true);
      return;
    }
    const script = document.querySelector<HTMLScriptElement>('script[data-friends-turnstile="true"]') || document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.friendsTurnstile = "true";
    script.onload = () => setReady(true);
    if (!script.parentElement) document.head.appendChild(script);
  }, [config]);

  useEffect(() => {
    if (open) void loadConfig();
  }, [open, loadConfig]);

  useEffect(() => {
    if (!open || !config?.enabled) return;
    loadScript();
  }, [open, config, loadScript]);

  useEffect(() => {
    if (!open || !ready || !config?.siteKey || !containerRef.current || widgetRef.current) return;
    const turnstile = (window as any).turnstile;
    const widget = turnstile?.render(containerRef.current, {
      sitekey: config.siteKey,
      callback: async (token: string) => {
        setSubmitting(true);
        setError("");
        try {
          const response = await fetch("/api/public/human/verify", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          const json = await response.json();
          if (!response.ok || !json?.success) throw new Error(json?.message || "验证失败");
          const data = json.data as HumanStatus;
          setVerified(true);
          setRemaining(data.remaining);
          setOpen(false);
          setSubmitting(false);
          settlePending(true);
        } catch (verifyError) {
          setSubmitting(false);
          setError(verifyError instanceof Error ? verifyError.message : "验证失败");
          if (widgetRef.current) (window as any).turnstile?.reset(widgetRef.current);
        }
      },
      "expired-callback": () => {
        setError("验证已过期，请重新完成验证");
      },
      "error-callback": () => {
        setError("验证加载失败，请重试");
      },
    });
    widgetRef.current = widget || null;
    return () => {
      if (widgetRef.current && turnstile) turnstile.remove(widgetRef.current);
      widgetRef.current = null;
    };
  }, [open, ready, config, settlePending]);

  useEffect(() => {
    if (!open || !config || config.enabled) return;
    setVerified(true);
    setOpen(false);
    settlePending(true);
  }, [open, config, settlePending]);

  const requestVerification = useCallback(() => {
    if (verified) return;
    setError("");
    setOpen(true);
    void loadConfig();
  }, [verified, loadConfig]);

  const ensureVerified = useCallback(() => {
    if (verified) return Promise.resolve(true);
    requestVerification();
    return new Promise<boolean>((resolve) => {
      pendingRef.current.push(resolve);
    });
  }, [verified, requestVerification]);

  const close = useCallback(() => {
    setOpen(false);
    setError("");
    settlePending(false);
  }, [settlePending]);

  const value = useMemo(
    () => ({ verified, remaining, requestVerification, ensureVerified, refreshStatus }),
    [verified, remaining, requestVerification, ensureVerified, refreshStatus]
  );

  return (
    <FriendsVerificationContext.Provider value={value}>
      {children}
      {open && typeof document !== "undefined" && createPortal(
        <div className="friends-verification-overlay">
          <div className="friends-verification-dialog" role="dialog" aria-modal="true" aria-labelledby="friends-verification-title">
            <div className="friends-verification-head">
              <div className="friends-verification-title">
                <ShieldCheck size={18} />
                <div>
                  <h2 id="friends-verification-title">完成一次验证</h2>
                  <p>通过后 15 分钟内可继续留言和申请友链，共享 5 次提交。</p>
                </div>
              </div>
              <button type="button" onClick={close} aria-label="关闭验证">
                <X size={16} />
              </button>
            </div>

            {!config ? (
              <div className="friends-verification-loading"><Loader2 size={16} className="animate-spin" /> 正在准备验证…</div>
            ) : !config.enabled ? (
              <div className="friends-verification-loading">当前未开启人机验证，请稍后重试。</div>
            ) : (
              <div className="friends-verification-widget" ref={containerRef} />
            )}

            {submitting && <div className="friends-verification-loading">正在验证…</div>}
            {error && <p className="friends-verification-error">{error}</p>}
          </div>
        </div>,
        document.body
      )}
    </FriendsVerificationContext.Provider>
  );
}
