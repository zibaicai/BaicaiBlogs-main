"use client";

import { useEffect, useState } from "react";
import { Bell, Check, ChevronRight } from "lucide-react";
import Navbar from "../../../components/Navbar";
import PageTransition from "../../../components/PageTransition";
import { PageTitle } from "../../../components/ui/Typography";

interface Notice {
  id: number;
  type: string;
  category?: string;
  title: string;
  body: string;
  read: boolean;
  link?: string;
  actorName?: string;
  actorAvatar?: string;
  createdAt: string;
}

const CATEGORIES = [
  { id: "all", label: "全部消息" },
  { id: "reply", label: "回复我的" },
  { id: "mention", label: "@ 我的" },
  { id: "like", label: "收到的赞" },
  { id: "system", label: "系统通知" },
  { id: "moderation", label: "审核通知" },
  { id: "settings", label: "消息设置" },
] as const;

const SETTING_ITEMS = [
  { id: "reply", label: "回复我的" },
  { id: "mention", label: "@ 我的" },
  { id: "like", label: "收到的赞" },
  { id: "system", label: "系统通知" },
  { id: "moderation", label: "审核通知" },
] as const;

export default function NotificationsPage() {
  const [category, setCategory] = useState("all");
  const [items, setItems] = useState<Notice[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  const load = async (nextCategory = category, nextPage = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");
    try {
      const [listResponse, summaryResponse] = await Promise.all([
        fetch(`/api/me/notifications?category=${nextCategory}&page=${nextPage}&size=20`, { credentials: "include" }),
        fetch("/api/me/notifications/summary", { credentials: "include" }),
      ]);
      const preferencesResponse = await fetch("/api/me/notifications/preferences", { credentials: "include" });
      const listJson = await listResponse.json();
      const summaryJson = await summaryResponse.json();
      const preferencesJson = await preferencesResponse.json();
      if (!listJson?.success) throw new Error(listJson?.message || "加载失败");
      const nextItems = listJson.data?.items || [];
      const nextTotalPages = listJson.data?.totalPages || 1;
      setItems((current) => append ? [...current, ...nextItems] : nextItems);
      setPreferences(preferencesJson?.data || {});
      setPage(nextPage);
      setTotalPages(nextTotalPages);
      setTotal(listJson.data?.total || 0);
      setHasMore(nextPage < nextTotalPages);
      setSummary(summaryJson?.data || {});
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "加载失败");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void load(category, 1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const open = async (notice: Notice) => {
    if (!notice.read) {
      await fetch(`/api/me/notifications/${notice.id}/read`, { method: "POST", credentials: "include" });
      setItems((current) => current.map((item) => item.id === notice.id ? { ...item, read: true } : item));
      setSummary((current) => ({
        ...current,
        all: Math.max(0, (current.all || 0) - 1),
        [notice.category || "system"]: Math.max(0, (current[notice.category || "system"] || 0) - 1),
      }));
    }
    if (notice.link) window.location.href = notice.link;
  };

  const readAll = async () => {
    await fetch(`/api/me/notifications/read-all?category=${category}`, { method: "POST", credentials: "include" });
    await load(category);
  };

  const togglePreference = async (key: string) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    await fetch("/api/me/notifications/preferences", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
  };

  const resetPreferences = async () => {
    const response = await fetch("/api/me/notifications/preferences", { method: "DELETE", credentials: "include" });
    const json = await response.json();
    if (json?.success) setPreferences(json.data || {});
  };

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell">
          <PageTitle className="mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
            <Bell className="text-indigo-500" /> 消息中心
          </PageTitle>

          <div className="grid gap-5 md:grid-cols-[190px_minmax(0,1fr)]">
            <aside className="md:sticky md:top-24 md:self-start">
              <nav className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible" aria-label="消息分类">
                {CATEGORIES.map((item) => {
                  const active = category === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategory(item.id)}
                      className={`flex shrink-0 items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold transition ${
                        active
                          ? "bg-indigo-500/15 text-indigo-500"
                          : "text-slate-500 hover:bg-white/40 hover:text-slate-800 dark:hover:bg-white/5 dark:hover:text-white"
                      }`}
                    >
                      <span>{item.label}</span>
                      {!!summary[item.id] && (
                        <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] text-white">{summary[item.id]}</span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </aside>

            <section className="min-w-0">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">
                  {CATEGORIES.find((item) => item.id === category)?.label}
                  {category !== "settings" && <span className="ml-2 text-[10px] font-bold text-slate-400">共 {total} 条</span>}
                </h2>
                <button type="button" onClick={() => void readAll()} className="text-[11px] font-bold text-indigo-500" style={{ display: category === "settings" ? "none" : undefined }}>
                  全部已读
                </button>
              </div>

              {category === "settings" ? (
                <div className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/20 bg-white/40 dark:border-white/10 dark:bg-slate-900/30">
                  {SETTING_ITEMS.map((item) => (
                    <label key={item.id} className="flex cursor-pointer items-center justify-between gap-4 px-4 py-4">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={preferences[item.id] !== false}
                        onChange={() => void togglePreference(item.id)}
                        className="h-4 w-4 accent-indigo-500"
                      />
                    </label>
                  ))}
                  <div className="px-4 py-3 text-right">
                    <button type="button" onClick={() => void resetPreferences()} className="text-[11px] font-bold text-indigo-500">恢复默认</button>
                  </div>
                </div>
              ) : (
              <>
              {loading && <div className="py-12 text-center text-sm text-slate-400">加载中…</div>}
              {error && <div className="py-12 text-center text-sm font-bold text-red-400">{error}</div>}
              {!loading && !error && items.length === 0 && (
                <div className="py-16 text-center text-sm text-slate-400">暂无消息</div>
              )}

              <div className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/20 bg-white/40 dark:border-white/10 dark:bg-slate-900/30">
                {items.map((notice) => (
                  <button
                    key={notice.id}
                    type="button"
                    onClick={() => void open(notice)}
                    className={`flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-white/40 dark:hover:bg-white/5 ${
                      notice.read ? "opacity-70" : ""
                    }`}
                  >
                    {notice.actorAvatar ? (
                      <img src={notice.actorAvatar} alt="" className="mt-0.5 h-8 w-8 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${notice.read ? "bg-slate-300" : "bg-indigo-500"}`} />
                    )}
                    <span className="min-w-0 flex-1">
                      {notice.actorName && <span className="mb-0.5 block text-[10px] font-bold text-indigo-500">{notice.actorName}</span>}
                      <span className="block text-xs font-black text-slate-800 dark:text-slate-100">{notice.title}</span>
                      <span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">{notice.body}</span>
                      <span className="mt-1 block text-[10px] text-slate-400">{notice.createdAt}</span>
                    </span>
                    <ChevronRight size={14} className="mt-1 shrink-0 text-slate-300" />
                  </button>
                ))}
              </div>

              {hasMore && (
                <div className="mt-3 text-center">
                  <button type="button" onClick={() => void load(category, page + 1, true)} disabled={loadingMore} className="rounded-full border border-white/20 px-4 py-2 text-[11px] font-bold text-slate-500 disabled:opacity-40">
                    {loadingMore ? "加载中…" : "加载更多"}
                  </button>
                </div>
              )}
              </>
              )}
            </section>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
