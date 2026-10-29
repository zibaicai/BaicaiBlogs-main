"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, MessageCircle, Search, Trash2, X } from "lucide-react";

import { getToken } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { Button } from "../components/ui/Button";
import { AdminPageHeader, AdminPageShell, FilterTabs, StatusBadge } from "../components/admin/AdminUI";
import { DataTable } from "../components/admin/DataTable";

type Message = {
  id: number;
  userId?: number;
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
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");

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

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((item) => {
      if (status !== "ALL" && item.status !== status) return false;
      if (!keyword) return true;
      return [item.name, item.content, item.website, item.contact].join(" ").toLowerCase().includes(keyword);
    });
  }, [items, query, status]);

  const act = async (id: number, action: "approve" | "reject" | "promote") => {
    try {
      if (action === "reject") {
        await request(`/admin/friend-messages/${id}/reject`, { method: "POST", body: JSON.stringify({}) });
        showToast("已隐藏", "success");
      } else {
        await request(`/admin/friend-messages/${id}/${action}`, { method: "POST" });
        showToast(action === "promote" ? "已收录为友链" : "已显示", "success");
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
    <AdminPageShell>
      <AdminPageHeader
        title="友链留言"
        description={`留言审核与友链收录 · 共 ${items.length} 条`}
        actions={<Button variant="ghost" onClick={() => void load()}><MessageCircle size={13} /> 刷新</Button>}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索用户、留言、网站" className="admin-input pl-8" />
        </div>
        <FilterTabs
          value={status}
          onChange={setStatus}
          options={[
            { value: "ALL", label: "全部", count: items.length },
            { value: "VISIBLE", label: "显示中", count: items.filter((item) => item.status === "VISIBLE").length },
            { value: "HIDDEN", label: "已隐藏", count: items.filter((item) => item.status === "HIDDEN").length },
            { value: "DELETED", label: "已删除", count: items.filter((item) => item.status === "DELETED").length },
          ]}
        />
      </div>

      <DataTable
        rows={filtered}
        loading={loading}
        rowKey={(item) => item.id}
        empty="暂无留言"
        columns={[
          {
            key: "user",
            header: "用户",
            cell: (item) => (
              <div className="flex items-center gap-2">
                {item.avatar ? <img src={item.avatar} alt="" className="h-6 w-6 rounded-md object-cover" /> : <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/15 text-[9px] font-bold text-indigo-300">{item.name.slice(0, 1)}</div>}
                <span className="max-w-[100px] truncate font-bold text-slate-200">{item.name}</span>
              </div>
            ),
          },
          {
            key: "content",
            header: "留言",
            className: "max-w-[320px]",
            cell: (item) => <p className="line-clamp-2 text-[11px] leading-5 text-slate-400">{item.content || "—"}</p>,
          },
          {
            key: "website",
            header: "网站",
            cell: (item) => item.website ? <a href={item.website} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-[150px] items-center gap-1 truncate text-[10px] text-indigo-300 hover:underline"><ExternalLink size={10} />{item.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a> : <span className="text-slate-600">—</span>,
          },
          {
            key: "contact",
            header: "联系方式",
            cell: (item) => <span className="block max-w-[120px] truncate text-[10px] text-slate-500">{item.contact || "—"}</span>,
          },
          {
            key: "time",
            header: "时间",
            cell: (item) => <span className="whitespace-nowrap text-[10px] text-slate-500">{item.createdAt?.slice(0, 16).replace("T", " ") || "—"}</span>,
          },
          { key: "status", header: "状态", cell: (item) => <StatusBadge status={item.status} /> },
          {
            key: "action",
            header: "操作",
            className: "text-right",
            cell: (item) => (
              <div className="flex justify-end gap-0.5">
                {item.status !== "VISIBLE" && <button title="显示" onClick={() => void act(item.id, "approve")} className="rounded-md p-1.5 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-300"><Check size={13} /></button>}
                {item.status === "VISIBLE" && <button title="隐藏" onClick={() => void act(item.id, "reject")} className="rounded-md p-1.5 text-slate-400 hover:bg-amber-500/10 hover:text-amber-300"><X size={13} /></button>}
                {!item.friendId && item.content && <button title="收录为友链" onClick={() => void act(item.id, "promote")} className="rounded-md px-1.5 py-1 text-[9px] font-bold text-indigo-300 hover:bg-indigo-500/10">收录</button>}
                <button title="删除" onClick={() => void remove(item.id)} className="rounded-md p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={13} /></button>
              </div>
            ),
          },
        ]}
      />
    </AdminPageShell>
  );
}
