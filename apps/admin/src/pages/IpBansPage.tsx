"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, Loader2, RefreshCw, ShieldOff } from "lucide-react";
import { api, getAdminRole } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { AdminEmptyState, AdminPageHeader, AdminPageShell } from "../components/admin/AdminUI";
import { Button } from "../components/ui/Button";

type IpBan = {
  id: number;
  ip?: string;
  ipHash: string;
  reason?: string;
  createdBy?: number;
  createdAt?: string;
  expiresAt?: string;
};

export default function IpBansPage() {
  const { showToast } = useToast();
  const superAdmin = getAdminRole() === "SUPER_ADMIN";
  const [items, setItems] = useState<IpBan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.ipBans();
      setItems(response.data || []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "加载失败", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const unban = async (item: IpBan) => {
    if (!window.confirm(`确定解封 ${item.ip || item.ipHash}？`)) return;
    try {
      await api.unbanIp(item.id);
      showToast("已解封", "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "解封失败", "error");
    }
  };

  if (!superAdmin) {
    return (
      <AdminPageShell>
        <AdminEmptyState title="无权查看" description="只有超级管理员可以查看 IP 封禁列表。" />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        eyebrow="SECURITY"
        title="IP 封禁"
        description="系统识别到恶意行为后自动封禁的 IP，仅超级管理员可查看与解封。"
        actions={
          <Button variant="ghost" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={13} /> 刷新
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-white/10 py-16 text-sm text-slate-400">
          <Loader2 className="mr-2 animate-spin" size={16} /> 加载中…
        </div>
      ) : items.length === 0 ? (
        <AdminEmptyState title="暂无封禁 IP" description="当前没有被系统封禁的 IP。" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="grid grid-cols-[1.3fr_1fr_1fr_auto] gap-3 border-b border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <span>IP</span>
            <span>原因</span>
            <span>封禁时间</span>
            <span className="text-right">操作</span>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-[1.3fr_1fr_1fr_auto] items-center gap-3 px-4 py-3 text-xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-mono font-bold text-slate-200">
                    <Ban size={13} className="shrink-0 text-red-300" />
                    <span className="truncate">{item.ip || "历史记录（仅哈希）"}</span>
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[9px] text-slate-600">{item.ipHash}</div>
                </div>
                <span className="line-clamp-2 text-slate-300">{item.reason || "未填写原因"}</span>
                <div className="text-[10px] text-slate-400">
                  <div>{item.createdAt ? item.createdAt.slice(0, 16).replace("T", " ") : "—"}</div>
                  {item.expiresAt && <div className="text-amber-300/80">至 {item.expiresAt.slice(0, 16).replace("T", " ")}</div>}
                </div>
                <div className="text-right">
                  <Button variant="ghost" onClick={() => void unban(item)}>
                    <ShieldOff size={12} /> 解封
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
