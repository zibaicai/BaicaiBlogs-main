import { useState } from "react";
import { Eye, Loader2, ShieldAlert } from "lucide-react";
import { api, getAdminUser, type Moment } from "../lib/api";
import { useToast } from "../components/ToastProvider";

export default function PrivacyAuditPage() {
  const { showToast } = useToast();
  const [reason, setReason] = useState("");
  const [items, setItems] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(false);

  const user = getAdminUser();

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

  if (user?.role !== "SUPER_ADMIN") {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <ShieldAlert className="mx-auto mb-3 text-red-400" size={28} />
        <h1 className="text-xl font-black text-white">仅超级管理员可访问</h1>
        <p className="mt-2 text-sm text-slate-400">该入口用于数据恢复、违规处理等兜底场景，所有查看都会写入审计日志。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-black text-white">隐私审计</h1>
        <p className="mt-1 text-sm font-bold text-slate-400">私密说说只读兜底入口。查看必须填写原因，用户不会收到通知。</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <label className="text-xs font-black text-slate-400">
          查看原因
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            placeholder="例如：用户申请数据恢复，需核对私密内容"
            className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <button onClick={load} disabled={loading} className="btn btn-primary mt-3 flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black disabled:opacity-50">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
          查看私密说说
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {items.map((item) => (
          <div key={item.slug} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[10px] font-mono text-slate-500">{item.slug}</div>
              <span className="rounded-full bg-red-500/15 px-2 py-1 text-[9px] font-black text-red-300">私密</span>
            </div>
            <div className="article-prose mt-3 text-sm text-slate-300" dangerouslySetInnerHTML={{ __html: item.htmlContent || "" }} />
            <div className="mt-4 text-[10px] text-slate-500">{String(item.date || "").slice(0, 10)} · user #{item.userId || "-"}</div>
          </div>
        ))}
      </div>
      {!loading && items.length === 0 && <div className="py-16 text-center text-sm font-bold text-slate-500">填写原因后可查看私密说说。</div>}
    </div>
  );
}
