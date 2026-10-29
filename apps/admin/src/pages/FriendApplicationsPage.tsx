"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, Link2, Search, X } from "lucide-react";

import { getToken } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { Button } from "../components/ui/Button";
import { AdminPageHeader, AdminPageShell, StatusBadge } from "../components/admin/AdminUI";
import { DataTable } from "../components/admin/DataTable";

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
  const [query, setQuery] = useState("");

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

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => [item.name, item.url, item.description, item.contact].join(" ").toLowerCase().includes(keyword));
  }, [items, query]);

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
    <AdminPageShell>
      <AdminPageHeader
        title="友链申请"
        description={`游客友链申请审核 · 共 ${items.length} 条`}
        actions={<Button variant="ghost" onClick={() => void load()}><Link2 size={13} /> 刷新</Button>}
      />

      <div className="relative rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
        <Search size={14} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索称谓、网站、简介" className="admin-input pl-8" />
      </div>

      <DataTable
        rows={filtered}
        loading={loading}
        rowKey={(item) => item.id}
        empty="暂无待审核的友链申请"
        columns={[
          {
            key: "name",
            header: "称谓",
            cell: (item) => (
              <div className="flex items-center gap-2">
                {item.avatar ? <img src={item.avatar} alt="" className="h-6 w-6 rounded-md object-cover" /> : <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/15 text-[9px] font-bold text-indigo-300">{item.name.slice(0, 1)}</div>}
                <span className="max-w-[110px] truncate font-bold text-slate-200">{item.name}</span>
              </div>
            ),
          },
          {
            key: "url",
            header: "网站",
            cell: (item) => <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-[190px] items-center gap-1 truncate text-[10px] text-indigo-300 hover:underline"><ExternalLink size={10} />{item.url.replace(/^https?:\/\//, "")}</a>,
          },
          {
            key: "description",
            header: "简介",
            className: "max-w-[240px]",
            cell: (item) => <p className="line-clamp-2 text-[11px] leading-5 text-slate-400">{item.description || "—"}</p>,
          },
          { key: "contact", header: "联系方式", cell: (item) => <span className="block max-w-[110px] truncate text-[10px] text-slate-500">{item.contact || "—"}</span> },
          { key: "backlink", header: "回链", cell: (item) => <span className="text-[10px] text-slate-500">{item.hasBacklink ? "已填" : "未填"}</span> },
          { key: "time", header: "时间", cell: (item) => <span className="whitespace-nowrap text-[10px] text-slate-500">{item.createdAt?.slice(0, 16).replace("T", " ") || "—"}</span> },
          { key: "status", header: "状态", cell: () => <StatusBadge status="PENDING" /> },
          {
            key: "action",
            header: "操作",
            className: "text-right",
            cell: (item) => (
              <div className="flex justify-end gap-0.5">
                <button title="通过" onClick={() => void approve(item.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-300"><Check size={13} /></button>
                <button title="拒绝" onClick={() => void reject(item.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-300"><X size={13} /></button>
                <a title="打开网站" href={item.url} target="_blank" rel="noopener noreferrer" className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"><ExternalLink size={13} /></a>
              </div>
            ),
          },
        ]}
      />
    </AdminPageShell>
  );
}
