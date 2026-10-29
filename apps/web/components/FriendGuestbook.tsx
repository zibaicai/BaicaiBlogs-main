"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";

import Textarea from "./ui/Textarea";
import { formatDate, type FriendMessage } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function FriendGuestbook({ initialMessages }: { initialMessages: FriendMessage[] }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [turnstileConfig, setTurnstileConfig] = useState<{ enabled: boolean; siteKey: string } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstilePassed, setTurnstilePassed] = useState(false);
  const [needsReverify, setNeedsReverify] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/config", { credentials: "include" })
      .then((response) => response.json())
      .then((json) => {
        const data = json?.data || {};
        setTurnstileConfig({ enabled: Boolean(data.turnstileEnabled), siteKey: data.turnstileSiteKey || "" });
      })
      .catch(() => setTurnstileConfig({ enabled: false, siteKey: "" }));
  }, []);

  useEffect(() => {
    if (!turnstileConfig?.enabled || !turnstileConfig.siteKey) return;
    const script = document.querySelector<HTMLScriptElement>('script[data-guestbook-turnstile="true"]') || document.createElement("script");
    if ((window as any).turnstile) {
      setTurnstileReady(true);
      return;
    }
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.guestbookTurnstile = "true";
    script.onload = () => setTurnstileReady(true);
    if (!script.parentElement) document.head.appendChild(script);
  }, [turnstileConfig]);

  useEffect(() => {
    if (!turnstileReady || !turnstileConfig?.siteKey || !turnstileRef.current || widgetRef.current) return;
    const turnstile = (window as any).turnstile;
    const widget = turnstile?.render(turnstileRef.current, {
      sitekey: turnstileConfig.siteKey,
      callback: (token: string) => {
        setTurnstileToken(token);
        setTurnstilePassed(true);
      },
      "expired-callback": () => {
        setTurnstileToken("");
        setTurnstilePassed(false);
      },
      "error-callback": () => {
        setTurnstileToken("");
        setTurnstilePassed(false);
      },
    });
    widgetRef.current = widget || null;
    return () => {
      if (widgetRef.current && turnstile) turnstile.remove(widgetRef.current);
      widgetRef.current = null;
    };
  }, [turnstileReady, turnstileConfig]);

  useEffect(() => {
    if (needsReverify && content.length > 0) {
      setNeedsReverify(false);
      setTurnstilePassed(false);
    }
  }, [content, needsReverify]);

  const submit = async () => {
    if (!content.trim()) {
      setNotice("请先写点什么");
      return;
    }
    if (turnstileConfig?.enabled && !turnstileToken) {
      setNotice("请完成人机验证");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const res = await fetch("/api/public/friend-messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, turnstileToken }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "提交失败");
      if (json.data) setMessages((current) => [json.data, ...current]);
      setNotice("留言已发布");
      setContent("");
      setTurnstileToken("");
      setTurnstilePassed(true);
      setNeedsReverify(true);
      if (widgetRef.current && (window as any).turnstile) (window as any).turnstile.reset(widgetRef.current);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "提交失败");
      setTurnstilePassed(false);
      setNeedsReverify(false);
      setTurnstileToken("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-10 rounded-3xl border border-white/50 bg-white/55 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 md:p-8">
      <div className="flex items-center gap-3">
        <MessageCircle size={20} className="text-indigo-400" />
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">留言</h2>
          <p className="mt-1 text-xs text-slate-500">可以随便聊聊，也可以留下你的网站。</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {messages.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">还没有留言，来坐第一排。</p>
        ) : messages.map((message) => (
          <article key={message.id} className="rounded-2xl border border-white/40 bg-white/50 p-4 dark:border-white/10 dark:bg-slate-900/40">
            <div className="flex items-center gap-3">
              {message.avatar ? (
                <img src={message.avatar} alt={message.name} className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-black text-indigo-500">
                  {message.name.slice(0, 1)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <strong className="truncate text-xs text-slate-800 dark:text-slate-100">{message.name}</strong>
                  {message.website && (
                    <a href={message.website} target="_blank" rel="nofollow ugc noopener noreferrer" className="truncate text-[10px] text-indigo-500 hover:underline">
                      {message.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  )}
                </div>
                <span className="text-[9px] text-slate-400">{formatDate(message.createdAt || "")}</span>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-600 dark:text-slate-300">{message.content}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-indigo-400/20 bg-slate-950/20 p-4">
        <p className="mb-2 text-[10px] font-bold text-slate-400">
          {user ? `以 ${user.nickname || user.username} 的身份留言` : "当前为匿名留言"}
        </p>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="mt-1" placeholder="说点什么，或者留下你的网站。" />
        {turnstileConfig?.enabled && (
          <div className={turnstilePassed ? "h-0 overflow-hidden" : "mt-3 min-h-[65px]"}>
            <div ref={turnstileRef} />
          </div>
        )}
        {turnstileConfig?.enabled && turnstilePassed && <p className="mt-2 text-[10px] font-bold text-emerald-500">人机验证已通过</p>}
        {notice && <p className="mt-2 text-[10px] font-bold text-indigo-500">{notice}</p>}
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={() => void submit()} disabled={busy} className="hv-button hv-button-primary inline-flex items-center gap-2 disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} 发表留言
          </button>
        </div>
      </div>
    </section>
  );
}
