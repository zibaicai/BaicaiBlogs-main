"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { useToast } from "../ToastProvider";
import { Button } from "../ui/Button";

export default function OwnerCommentsPanel({ targetType, targetId }: { targetType: string; targetId: number }) {
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.myComments();
      setItems((response.data || []).filter((item) => item.targetType === targetType && item.targetId === targetId));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "评论加载失败", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, targetId, targetType]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (item: any) => {
    try {
      if (item.status === "HIDDEN") await api.restoreOwnerComment(item.id);
      else await api.hideOwnerComment(item.id);
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "操作失败", "error");
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">评论管理</h2>
        <span className="text-[10px] text-slate-500">资源所有者只能隐藏或恢复评论</span>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-6 text-xs text-slate-500"><Loader2 className="mr-2 animate-spin" size={14} /> 加载中…</div>
      ) : items.length === 0 ? (
        <p className="py-4 text-xs text-slate-500">暂无评论。</p>
      ) : (
        <div className="mt-3 divide-y divide-white/10">
          {items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center gap-3 py-3 text-xs">
              <div className="min-w-0 flex-1">
                <p className="truncate text-slate-200">{item.content || "已删除评论"}</p>
                <p className="mt-1 text-[10px] text-slate-500">{item.author || "用户"} · {item.status === "HIDDEN" ? "已隐藏" : "显示中"}</p>
              </div>
              {item.status !== "DELETED" && (
                <Button variant="ghost" onClick={() => void toggle(item)}>{item.status === "HIDDEN" ? "恢复" : "隐藏"}</Button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
