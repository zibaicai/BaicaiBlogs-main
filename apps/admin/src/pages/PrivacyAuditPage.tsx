"use client";

import { useState } from "react";
import { Eye, Loader2, ShieldAlert } from "lucide-react";

import { api, getAdminRole, type Moment } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { Button, Textarea } from "../components/ui";
import {
  AdminEmptyState,
  AdminLoading,
  AdminPageHeader,
  AdminPageShell,
  FormField,
} from "../components/admin/AdminUI";

export default function PrivacyAuditPage() {
  const { showToast } = useToast();
  const [reason, setReason] = useState("");
  const [items, setItems] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(false);

  const userRole = getAdminRole();

  const load = async () => {
    if (!reason.trim()) {
      showToast("请先填写查看原因", "warning");
      return;
    }
    setLoading(true);
    try {
      const res = await api.getPrivateMoments(reason.trim());
      setItems(res.data || []);
      showToast("已记录本次隐私审计", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "查看失败", "error");
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== "SUPER_ADMIN") {
    return (
      <AdminPageShell>
        <AdminPageHeader title="隐私审计" description="仅超级管理员可访问" />
        <div className="flex flex-col items-center rounded-xl border border-red-500/20 bg-red-500/[0.04] px-6 py-10 text-center">
          <ShieldAlert size={24} className="text-red-400" />
          <p className="mt-2 max-w-md text-[11px] leading-5 text-slate-400">
            该入口用于数据恢复、违规处理等兜底场景，所有查看都会写入审计日志。
          </p>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="隐私审计"
        description="私密说说只读兜底入口。查看必须填写原因，用户不会收到通知。"
        actions={
          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-400">
            共 {items.length} 条
          </span>
        }
      />

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <FormField label="查看原因">
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            placeholder="例如：用户申请数据恢复，需核对私密内容"
          />
        </FormField>
        <div className="mt-2 flex justify-end">
          <Button onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
            查看私密说说
          </Button>
        </div>
      </div>

      {loading ? (
        <AdminLoading label="正在读取私密说说…" />
      ) : items.length === 0 ? (
        <AdminEmptyState title="暂无私密说说" description="填写原因后可查看私密说说。" />
      ) : (
        <div className="grid gap-2.5 xl:grid-cols-2">
          {items.map((item) => (
            <div key={item.slug} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate font-mono text-[9px] text-slate-500" title={item.slug}>
                  {item.slug}
                </span>
                <span className="shrink-0 rounded-full bg-red-500/15 px-1.5 py-0.5 text-[9px] font-bold text-red-300">
                  私密
                </span>
              </div>
              <div
                className="admin-article-reader admin-scrollbar mt-2 max-h-56 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: item.htmlContent || "" }}
              />
              <div className="mt-2 flex items-center justify-between gap-2 text-[9px] text-slate-500">
                <span>{String(item.date || "").slice(0, 10)}</span>
                <span>user #{item.userId || "-"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
