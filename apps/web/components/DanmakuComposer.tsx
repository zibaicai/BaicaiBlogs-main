"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, Send, X } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useToast } from "./ToastProvider";

export default function DanmakuComposer() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    const value = text.trim();
    if (!value) {
      showToast("弹幕内容不能为空", "warning");
      return;
    }
    if (value.length > 100) {
      showToast("弹幕不能超过 100 个字", "warning");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/public/danmaku", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || "发送失败");
      setText("");
      setOpen(false);
      showToast("弹幕已发射", "success");
      window.dispatchEvent(new CustomEvent("danmaku-updated"));
    } catch (e) {
      showToast(e instanceof Error ? e.message : "发送失败", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="danmaku-composer fixed bottom-20 left-4 sm:bottom-6 sm:left-24 z-40">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full border border-white/40 bg-white/60 px-4 py-2.5 text-xs font-black text-slate-700 shadow-xl backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200"
        >
          <MessageCircle size={15} className="text-indigo-500" />
          发弹幕
        </button>
      ) : (
        <div className="w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-white/40 bg-white/80 p-3 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/90">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              发一条弹幕
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-slate-400 hover:bg-white/60 hover:text-slate-700 dark:hover:bg-slate-800"
              aria-label="关闭"
            >
              <X size={14} />
            </button>
          </div>

          {!user ? (
            <Link
              href="/login"
              className="block rounded-xl bg-indigo-500 px-3 py-2.5 text-center text-xs font-black text-white"
            >
              登录后发弹幕
            </Link>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 100))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void send();
                  }}
                  maxLength={100}
                  placeholder="说点什么..."
                  className="min-w-0 flex-1 rounded-xl border border-white/50 bg-white/60 px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={sending}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white disabled:opacity-50"
                  aria-label="发送"
                >
                  <Send size={15} />
                </button>
              </div>
              <div className="mt-1 text-right text-[10px] text-slate-400">{text.length}/100</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
