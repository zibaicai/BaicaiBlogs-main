import { useEffect, useState } from "react";
import { Check, KeyRound, ShieldCheck, X } from "lucide-react";
import { api } from "../lib/api";
import { useToast } from "../components/ToastProvider";

interface AccessRequest {
  id: number;
  adminId: number;
  albumId: number;
  reason: string;
  status: string;
  reviewedBy: number | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface AccessGrant {
  id: number;
  adminId: number;
  albumId: number;
  status: string;
  expiresAt: string;
  reason: string;
}

export default function AccessPage() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [auditAllowed, setAuditAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [req, grant] = await Promise.all([api.accessRequests(), api.accessGrants()]);
      setRequests(req.data || []);
      setGrants(grant.data || []);
      try {
        const audit = await api.auditLogs();
        if (audit.success) {
          setLogs(audit.data || []);
          setAuditAllowed(true);
        } else {
          setAuditAllowed(false);
        }
      } catch {
        setAuditAllowed(false);
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const act = async (id: number, approve: boolean) => {
    try {
      if (approve) await api.approveAccess(id);
      else await api.rejectAccess(id);
      showToast(approve ? "已批准，1 小时有效" : "已拒绝", "success");
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "操作失败", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-2">
          <KeyRound className="text-amber-400" /> 授权审批
        </h1>
        <p className="text-sm text-slate-400 mt-1 font-bold">
          ADMIN 申请查看密码相册；SUPER_ADMIN 批准后 1 小时有效，仅可查看 400/800，禁止原图/下载。
        </p>
      </div>

      {loading && <div className="text-slate-400 text-sm">加载中...</div>}

      <section className="rounded-3xl bg-white/5 border border-white/10 p-5">
        <h2 className="text-lg font-black text-white mb-3">申请队列</h2>
        <div className="flex flex-col gap-2">
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl bg-black/15 border border-white/5 p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-200">
                    #{r.id} · 管理员 #{r.adminId} · 相册 #{r.albumId} · {r.status}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">{r.reason}</p>
                  <div className="text-[10px] text-slate-500 mt-1">{r.createdAt}</div>
                </div>
                {r.status === "PENDING" && (
                  <div className="flex gap-2">
                    <button onClick={() => void act(r.id, true)} className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-[10px] font-black flex items-center gap-1">
                      <Check size={12} /> 批准
                    </button>
                    <button onClick={() => void act(r.id, false)} className="px-3 py-2 rounded-xl bg-red-500/10 text-red-400 text-[10px] font-black flex items-center gap-1">
                      <X size={12} /> 拒绝
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {requests.length === 0 && <div className="text-xs text-slate-500">暂无申请</div>}
        </div>
      </section>

      <section className="rounded-3xl bg-white/5 border border-white/10 p-5">
        <h2 className="text-lg font-black text-white mb-3">有效 / 历史授权</h2>
        <div className="flex flex-col gap-2">
          {grants.map((g) => (
            <div key={g.id} className="flex flex-col md:flex-row md:items-center justify-between rounded-xl bg-black/15 px-4 py-3 gap-2">
              <span className="text-xs text-slate-300">
                #{g.id} · 管理员 #{g.adminId} · 相册 #{g.albumId} · {g.status}
              </span>
              <span className="text-[10px] text-slate-500">到期 {g.expiresAt}</span>
            </div>
          ))}
          {grants.length === 0 && <div className="text-xs text-slate-500">暂无授权</div>}
        </div>
      </section>

      {auditAllowed && (
        <section className="rounded-3xl bg-white/5 border border-white/10 p-5">
          <h2 className="text-lg font-black text-white mb-3 flex items-center gap-2">
            <ShieldCheck size={16} className="text-indigo-400" /> 内部合规审计（仅超管）
          </h2>
          <div className="flex flex-col gap-1 max-h-[40vh] overflow-y-auto">
            {logs.map((l) => (
              <div key={l.id} className="text-[10px] text-slate-400 border-b border-white/5 py-2">
                #{l.id} · {l.actorRole} #{l.actorId} · 相册 #{l.albumId} · {l.action} · {l.accessType}
                {l.reason ? ` · ${l.reason}` : ""} · {l.createdAt}
              </div>
            ))}
            {logs.length === 0 && <div className="text-xs text-slate-500">暂无审计</div>}
          </div>
        </section>
      )}
    </div>
  );
}
