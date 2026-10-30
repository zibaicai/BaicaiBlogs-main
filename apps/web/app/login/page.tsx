"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import Navbar from "../../components/Navbar";
import Input from "../../components/ui/Input";
import { useAuth } from "../../lib/auth";

interface TurnstileRenderOptions {
  sitekey: string;
  callback: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
}

interface TurnstileInstance {
  render: (element: HTMLElement, options: TurnstileRenderOptions) => string;
  remove: (id: string) => void;
  reset: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileInstance;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstileConfig, setTurnstileConfig] = useState<{ enabled: boolean; siteKey: string } | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/config", { credentials: "include" })
      .then((response) => response.json())
      .then((json) => {
        const data = json?.data || {};
        setTurnstileConfig({
          enabled: Boolean(data.turnstileEnabled),
          siteKey: typeof data.turnstileSiteKey === "string" ? data.turnstileSiteKey : "",
        });
      })
      .catch(() => setTurnstileConfig({ enabled: false, siteKey: "" }));
  }, []);

  useEffect(() => {
    if (!turnstileConfig?.enabled || !turnstileConfig.siteKey) return;
    const existing = document.querySelector<HTMLScriptElement>('script[data-baicai-turnstile="true"]');
    if (window.turnstile) {
      setTurnstileReady(true);
      return;
    }
    const script = existing || document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.baicaiTurnstile = "true";
    script.onload = () => setTurnstileReady(true);
    if (!existing) document.head.appendChild(script);
  }, [turnstileConfig]);

  useEffect(() => {
    if (mode !== "register" || !turnstileReady || !turnstileConfig?.siteKey || !turnstileRef.current) return;
    const widget = window.turnstile?.render(turnstileRef.current, {
      sitekey: turnstileConfig.siteKey,
      callback: (token) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    });
    widgetIdRef.current = widget || null;
    return () => {
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [mode, turnstileReady, turnstileConfig]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setMessage("请输入用户名和密码");
      return;
    }
    if (mode === "register") {
      if (!turnstileConfig?.enabled) {
        setMessage("注册验证尚未配置，暂时关闭注册");
        return;
      }
      if (!turnstileToken) {
        setMessage("请先完成人机验证");
        return;
      }
      if (!agreed) {
        setMessage("请先阅读并同意用户协议和隐私政策");
        return;
      }
    }
    setBusy(true);
    setMessage("");
    try {
      if (mode === "login") await login(username.trim(), password);
      else await register(username.trim(), password, turnstileToken);
      router.push("/photowall");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失败");
      if (mode === "register" && widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        setTurnstileToken("");
      }
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setMessage("");
    setAgreed(false);
    setTurnstileToken("");
  };

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <main className="w-full max-w-md mx-auto mt-32 px-4 relative z-10">
        <form onSubmit={submit} className="login-card rounded-[40px] bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-2xl p-8 md:p-10">
          <div className="w-14 h-14 rounded-3xl bg-[var(--ui-accent)] flex items-center justify-center text-2xl shadow-lg mb-6 text-white">
            {mode === "login" ? <LogIn size={24} /> : <UserPlus size={24} />}
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{mode === "login" ? "登录" : "注册"}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-8">
            {mode === "login" ? "登录后可评论、点赞、查看原图" : "注册满 7 天后解锁上传与下载"}
          </p>

          <label className="text-meta font-black uppercase tracking-widest text-slate-400 ml-1">用户名</label>
          <Input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            className="mt-2 mb-4 rounded-2xl py-3.5"
            placeholder="至少 3 个字符"
          />

          <label className="text-meta font-black uppercase tracking-widest text-slate-400 ml-1">密码</label>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="mt-2 rounded-2xl py-3.5"
            placeholder="至少 6 个字符"
          />

          {mode === "register" && (
            <div className="mt-5">
              {turnstileConfig === null ? (
                <p className="text-xs font-bold text-slate-400">正在加载人机验证…</p>
              ) : !turnstileConfig.enabled ? (
                <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-600 dark:text-amber-300">
                  注册验证尚未配置，暂时关闭注册
                </p>
              ) : (
                <div ref={turnstileRef} className="min-h-[65px]" />
              )}
            </div>
          )}

          {mode === "register" && (
            <label className="mt-5 flex items-start gap-2.5 rounded-2xl border border-white/30 bg-white/20 px-3.5 py-3 text-meta font-medium leading-relaxed text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--ui-accent)]"
              />
              <span>
                我已阅读并同意
                <Link href="/terms" target="_blank" rel="noreferrer" className="mx-1 font-bold text-indigo-500 hover:underline">
                  用户协议
                </Link>
                和
                <Link href="/privacy" target="_blank" rel="noreferrer" className="mx-1 font-bold text-indigo-500 hover:underline">
                  隐私政策
                </Link>
              </span>
            </label>
          )}

          <button type="submit" disabled={busy} className="btn btn-primary w-full mt-7 py-4 rounded-2xl disabled:opacity-50 font-black text-sm transition-all flex items-center justify-center gap-2">
            {busy && <Loader2 className="animate-spin" size={16} />}
            {mode === "login" ? "登录" : "注册"}
          </button>

          <div className="mt-4 text-xs text-red-400 min-h-[18px] font-bold text-center">{message}</div>

          {mode === "login" && (
            <p className="text-center text-meta font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              继续即表示你已阅读并同意
              <Link href="/terms" target="_blank" rel="noreferrer" className="mx-1 font-bold text-indigo-500 hover:underline">
                用户协议
              </Link>
              和
              <Link href="/privacy" target="_blank" rel="noreferrer" className="mx-1 font-bold text-indigo-500 hover:underline">
                隐私政策
              </Link>
            </p>
          )}

          <div className="mt-6 flex items-center justify-between text-xs font-bold">
            <button type="button" onClick={switchMode} className="text-indigo-500 hover:underline">
              {mode === "login" ? "没有账号？去注册" : "已有账号？去登录"}
            </button>
            <Link href="/" className="text-slate-500 hover:text-indigo-500">返回首页</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
