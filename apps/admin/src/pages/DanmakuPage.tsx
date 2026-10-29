"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Trash2 } from "lucide-react";

import { api } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { Button, Input } from "../components/ui";
import { AdminEmptyState, AdminLoading, AdminPageHeader, AdminPageShell } from "../components/admin/AdminUI";
import { DataTable } from "../components/admin/DataTable";

interface Danmaku {
  id: number;
  userId: number | null;
  username: string | null;
  text: string;
  ipHash: string;
  createdAt: string;
}

export default function DanmakuPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Danmaku[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.adminDanmaku();
      if (!res.success) throw new Error(res.message);
      setItems(res.data || []);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.text.toLowerCase().includes(q) ||
        (item.username || "").toLowerCase().includes(q) ||
        item.ipHash.toLowerCase().includes(q)
    );
  }, [items, query]);

  const remove = async (item: Danmaku) => {
    if (!window.confirm(`删除这条弹幕？\n\n${item.text}`)) return;
    try {
      await api.deleteDanmaku(item.id);
      showToast("已删除", "success");
      setItems((prev) => prev.filter((x) => x.id !== item.id));
    } catch (e) {
      showToast(e instanceof Error ? e.message : "删除失败", "error");
    }
  };

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="弹幕管理"
        description="当前最多保留 500 条；超出后自动删除最早弹幕。发现恶意内容可直接删除。"
        actions={
          <Button variant="secondary" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> 刷新
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索弹幕内容、用户名或 IP 哈希..."
            className="pl-8"
          />
        </div>
        <span className="px-1 text-[10px] font-bold text-slate-500">
          共 {items.length} 条 / 显示 {filtered.length} 条
        </span>
      </div>

      {loading ? (
        <AdminLoading />
      ) : filtered.length === 0 ? (
        <AdminEmptyState
          title={query.trim() ? "没有匹配的弹幕" : "暂无弹幕"}
          description={query.trim() ? "换个关键词试试。" : "用户发送的弹幕会显示在这里。"}
        />
      ) : (
        <DataTable
          rows={filtered}
          rowKey={(item) => item.id}
          columns={[
            {
              key: "id",
              header: "ID",
              width: "56px",
              cell: (item) => <span className="font-mono text-[9px] text-slate-600">#{item.id}</span>,
            },
            {
              key: "text",
              header: "弹幕内容",
              className: "max-w-[420px]",
              cell: (item) => (
                <p className="line-clamp-2 break-words text-[11px] leading-5 text-slate-200">{item.text}</p>
              ),
            },
            {
              key: "username",
              header: "用户",
              width: "120px",
              cell: (item) => (
                <span className="block max-w-[100px] truncate text-[10px] text-slate-400">
                  {item.username || "匿名"}
                </span>
              ),
            },
            {
              key: "ipHash",
              header: "IP 哈希",
              width: "130px",
              cell: (item) => (
                <span className="block max-w-[110px] truncate font-mono text-[9px] text-slate-600" title={item.ipHash || ""}>
                  {item.ipHash || "-"}
                </span>
              ),
            },
            {
              key: "createdAt",
              header: "时间",
              width: "120px",
              cell: (item) => (
                <span className="whitespace-nowrap text-[10px] text-slate-500">
                  {item.createdAt ? item.createdAt.slice(0, 16).replace("T", " ") : "—"}
                </span>
              ),
            },
            {
              key: "action",
              header: "操作",
              className: "text-right",
              width: "64px",
              cell: (item) => (
                <button
                  type="button"
                  onClick={() => void remove(item)}
                  title="删除弹幕"
                  className="rounded-md p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 size={13} />
                </button>
              ),
            },
          ]}
        />
      )}
    </AdminPageShell>
  );
}
