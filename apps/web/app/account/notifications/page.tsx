"use client";

import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import Navbar from "../../../components/Navbar";
import PageTransition from "../../../components/PageTransition";

interface Notice {
  id: number;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/notifications", { credentials: "include" });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || "加载失败");
      setItems(json.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const markRead = async (id: number) => {
    await fetch(`/api/user/notifications/${id}/read`, { method: "POST", credentials: "include" });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell">
          <div className="max-w-3xl mx-auto">
          <h1 className="page-title mb-2 flex items-center gap-2 text-slate-900 dark:text-white">
            <Bell className="text-indigo-500" /> 消息中心
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">管理员查看你的密码相册时会在这里通知。</p>
          {loading && <div className="text-slate-400 text-sm">加载中...</div>}
          {error && <div className="text-red-400 text-sm font-bold">{error}</div>}
          {!loading && !error && items.length === 0 && (
            <div className="text-center py-24 text-slate-500 font-bold">暂无消息</div>
          )}
          <div className="flex flex-col gap-3">
            {items.map((n) => (
              <div key={n.id} className={`rounded-2xl border p-5 ${n.read ? "bg-white/40 dark:bg-slate-900/30 border-white/30 dark:border-white/5" : "bg-indigo-50/70 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-800 dark:text-slate-100">{n.title}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-6">{n.body}</p>
                    <div className="text-[10px] text-slate-400 mt-2">{n.createdAt}</div>
                  </div>
                  {!n.read && (
                    <button onClick={() => void markRead(n.id)} className="shrink-0 text-[10px] font-black text-indigo-500 flex items-center gap-1">
                      <Check size={12} /> 已读
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
