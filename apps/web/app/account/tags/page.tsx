"use client";

import { useState } from "react";
import Navbar from "../../../components/Navbar";
import { useAuth } from "../../../lib/auth";

export default function TagRequestPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setMessage("请填写标签名称");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/user/tags/request", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim().replace(/^#/, ""), reason }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.message || "申请失败");
      setName("");
      setReason("");
      setMessage("申请已提交，审批结果会通过站内信通知。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "申请失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <main className="directory-shell">
        <div className="max-w-2xl mx-auto rounded-3xl border border-white/40 bg-white/60 p-8 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/50">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--ui-accent)]">BAICAI / TAGS</div>
          <h1 className="mt-2 text-3xl font-black">申请新标签</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            标签由管理员维护。申请通过后会进入公共标签库，并发送站内信；不会自动绑定到任何资源。
          </p>
          {!user ? (
            <div className="mt-6 rounded-2xl bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-700 dark:text-amber-300">
              请先登录后再申请标签。
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="标签名称，例如：性能优化"
                className="rounded-2xl border border-white/40 bg-white/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ui-accent)] dark:border-white/10 dark:bg-slate-900/50"
              />
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                placeholder="申请理由 / 使用场景（可选）"
                className="resize-none rounded-2xl border border-white/40 bg-white/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ui-accent)] dark:border-white/10 dark:bg-slate-900/50"
              />
              <button type="submit" disabled={busy} className="btn btn-primary rounded-2xl px-5 py-3 text-sm font-black disabled:opacity-50">
                {busy ? "提交中…" : "提交申请"}
              </button>
              {message && <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{message}</div>}
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
