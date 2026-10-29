"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, ShieldCheck, Trash2 } from "lucide-react";

import { getToken } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { Button } from "../components/ui/Button";

type Application = {
  id: number;
  name: string;
  url: string;
  avatar?: string;
  description?: string;
  contact?: string;
  hasBacklink?: boolean;
  status: string;
  createdAt?: string;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers as Record<string, string>),
    },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new Error(json?.message || `请求失败 (${res.status})`);
  return json.data as T;
}

export default function FriendApplicationsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems((await request<Application[]>("/admin/friend-applications")) || []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "加载失败", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);

  const approve = async (id: number) => {
    try {
      await request(`/admin/friend-applications/${id}/approve`, { method: "POST" });
      showToast("已通过并加入友链", "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "操作失败", "error");
    }
  };

  const reject = async (id: number) => {
    const note = window.prompt("拒绝原因（可选）：") || "";
    try {
      await request(`/admin/friend-applications/${id}/reject`, { method: "POST", body: JSON.stringify({ note }) });
      showToast("已拒绝", "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "操作失败", "error");
    }
  };

  return (
    <section className="px-4 py-6 md:px-8">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-400">FRIEND APPLICATIONS</p>
          <h1 className="mt-1 flex items-center gap-3 text-3xl font-black text-white">
            <ShieldCheck size={25} className="text-indigo-400" /> 友链申请
          </h1>
          <p className="mt-2 text-xs text-slate-400">游客提交的友链会先进入这里，核验通过后才出现在公开友链页。</p>
        </div>
        <Button variant="ghost" onClick={() => void load()}>刷新</Button>
      </header>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="mx-auto animate-spin text-indigo-400" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-12 text-center text-sm text-slate-500">
          暂无待审核的友链申请。
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-start gap-3">
                {item.avatar ? (
                  <img src={item.avatar} alt={item.name} className="h-12 w-12 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-lg font-black text-indigo-400">
                    {item.name.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-black text-white">{item.name}</h2>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-[10px] text-indigo-300 hover:underline">
                    <ExternalLink size={11} /> {item.url}
                  </a>
                </div>
                <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[9px] font-bold text-amber-300">待审核</span>
              </div>

              <p className="mt-4 min-h-[2.5rem] text-xs leading-5 text-slate-400">{item.description || "未填写简介"}</p>
              <div className="mt-3 space-y-1 text-[10px] text-slate-500">
                <p>联系方式：{item.contact || "未填写"}</p>
                <p>已填写回链：{item.hasBacklink ? "是" : "否"}</p>
                <p>提交时间：{item.createdAt?.slice(0, 19).replace("T", " ") || "未知"}</p>
              </div>

              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="success" onClick={() => void approve(item.id)}>通过</Button>
                <Button size="sm" variant="ghost" onClick={() => void reject(item.id)}>拒绝</Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
