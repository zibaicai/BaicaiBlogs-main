"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, MessageCircle, Trash2 } from "lucide-react";

import { getToken } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { Button } from "../components/ui/Button";

type Message = {
  id: number;
  name: string;
  website?: string;
  avatar?: string;
  content: string;
  contact?: string;
  status: string;
  friendId?: string;
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

export default function FriendMessagesPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems((await request<Message[]>("/admin/friend-messages")) || []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "加载失败", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);

  const act = async (id: number, action: "approve" | "reject" | "promote") => {
    try {
      if (action === "reject") {
        const note = window.prompt("拒绝原因（可选）：") || "";
        await request(`/admin/friend-messages/${id}/reject`, { method: "POST", body: JSON.stringify({ note }) });
        showToast("已拒绝", "success");
      } else {
        await request(`/admin/friend-messages/${id}/${action}`, { method: "POST" });
        showToast(action === "promote" ? "已收录为友链" : "已通过", "success");
      }
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "操作失败", "error");
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm("确认删除这条留言？")) return;
    try {
      await request(`/admin/friend-messages/${id}`, { method: "DELETE" });
      await load();
      showToast("已删除", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "删除失败", "error");
    }
  };

  return (
    <section className="px-4 py-6 md:px-8">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-400">FRIEND GUESTBOOK</p>
          <h1 className="mt-1 flex items-center gap-3 text-3xl font-black text-white">
            <MessageCircle size={25} className="text-indigo-400" /> 友链留言
          </h1>
          <p className="mt-2 text-xs text-slate-400">游客留言审核；看到合适的网站可一键收录为友链。</p>
        </div>
        <Button variant="ghost" onClick={() => void load()}>刷新</Button>
      </header>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="mx-auto animate-spin text-indigo-400" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-12 text-center text-sm text-slate-500">暂无留言。</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-start gap-3">
                {item.avatar ? (
                  <img src={item.avatar} alt={item.name} className="h-10 w-10 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/15 text-sm font-black text-indigo-400">
                    {item.name.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-black text-white">{item.name}</h2>
                  {item.website && (
                    <a href={item.website} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-[10px] text-indigo-300 hover:underline">
                      <ExternalLink size={11} /> {item.website}
                    </a>
                  )}
                </div>
                <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${
                  item.status === "VISIBLE" ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"
                }`}>
                  {item.status === "VISIBLE" ? "显示中" : "已隐藏"}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-300">{item.content}</p>
              <div className="mt-2 text-[10px] text-slate-500">
                <p>联系方式：{item.contact || "未填写"}</p>
                <p>时间：{item.createdAt?.slice(0, 19).replace("T", " ") || "未知"}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.status !== "VISIBLE" && <Button size="sm" variant="success" onClick={() => void act(item.id, "approve")}>显示</Button>}
                {item.status === "VISIBLE" && <Button size="sm" variant="ghost" onClick={() => void act(item.id, "reject")}>隐藏</Button>}
                {!item.friendId && <Button size="sm" onClick={() => void act(item.id, "promote")}>收录为友链</Button>}
                <Button size="sm" variant="ghost" onClick={() => void remove(item.id)}><Trash2 size={12} /> 删除</Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
