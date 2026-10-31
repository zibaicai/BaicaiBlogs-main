"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";

import Textarea from "./ui/Textarea";
import { formatDate, type FriendMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useFeedback } from "./FeedbackProvider";
import { useToast } from "./ToastProvider";
import MessageListShell from "./messages/MessageListShell";
import MessageItemShell from "./messages/MessageItemShell";

export default function FriendGuestbook({ initialMessages }: { initialMessages: FriendMessage[] }) {
  const { user } = useAuth();
  const { confirm } = useFeedback();
  const { showToast } = useToast();
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
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

  const remove = async (id: number) => {
    const ok = await confirm({
      kind: "warning",
      title: "删除这条留言？",
      description: "删除后无法恢复。",
      confirmText: "删除",
      cancelText: "取消",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/user/friend-messages/${id}`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "删除失败");
      setMessages((current) => current.filter((message) => message.id !== id));
      showToast("留言已删除", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "删除失败", "error");
    }
  };

  const submit = async () => {
    if (!content.trim()) {
      showToast("请先写点什么", "warning");
      return;
    }
    if (turnstileConfig?.enabled && !turnstileToken) {
      showToast("请完成人机验证", "warning");
      return;
    }
    setBusy(true);
    let status = 0;
    try {
      const res = await fetch("/api/public/friend-messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, turnstileToken }),
      });
      status = res.status;
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "提交失败");
      if (json.data) setMessages((current) => [json.data, ...current]);
      showToast("留言已发布", "success");
      setContent("");
      setTurnstileToken("");
      setTurnstilePassed(true);
      setNeedsReverify(true);
      if (widgetRef.current && (window as any).turnstile) (window as any).turnstile.reset(widgetRef.current);
    } catch (error) {
      const text = error instanceof Error ? error.message : "提交失败";
      const turnstileError = status >= 500 || /人机验证|验证失败|验证服务/.test(text);
      if (turnstileError) {
        setTurnstilePassed(false);
        setNeedsReverify(false);
        setTurnstileToken("");
        if (widgetRef.current && (window as any).turnstile) (window as any).turnstile.reset(widgetRef.current);
      }
      showToast(text, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <MessageListShell
      className="friend-guestbook"
      title="留言"
      description="可以随便聊聊，也可以留下你的网站。"
      count={messages.length > 0 ? `${messages.length} 条` : undefined}
      icon={<MessageCircle size={20} />}
      surface="plain"
      density="compact"
      empty="还没有留言，来坐第一排。"
      beforeList={
        <div className="guestbook-composer">
          <p className="guestbook-composer-hint">
            {user ? `以 ${user.nickname || user.username} 的身份留言` : "当前为匿名留言"}
          </p>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="mt-1"
            placeholder="说点什么，或者留下你的网站。"
          />
          {turnstileConfig?.enabled && (
            <div className={turnstilePassed ? "h-0 overflow-hidden" : "mt-3 min-h-[65px]"}>
              <div ref={turnstileRef} />
            </div>
          )}
          {turnstileConfig?.enabled && turnstilePassed && (
            <p className="mt-2 text-meta font-bold text-emerald-500">人机验证已通过</p>
          )}
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => void submit()}
              disabled={busy}
              className="hv-button hv-button-primary inline-flex items-center gap-2 disabled:opacity-50"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} 发表留言
            </button>
          </div>
        </div>
      }
    >
      {messages.map((message) => (
        <MessageItemShell
          key={message.id}
          avatar={message.avatar}
          fallback={message.name.slice(0, 1)}
          name={message.name}
          time={formatDate(message.createdAt || "")}
          meta={
            message.website ? (
              <a href={message.website} target="_blank" rel="nofollow ugc noopener noreferrer">
                {message.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            ) : undefined
          }
          actions={
            user && message.userId === user.id ? (
              <button type="button" onClick={() => void remove(message.id)}>
                删除
              </button>
            ) : undefined
          }
          density="compact"
        >
          {message.content}
        </MessageItemShell>
      ))}
    </MessageListShell>
  );
}
