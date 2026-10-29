import { useEffect, useState } from "react";
import { Check, RefreshCw, ShieldCheck, X } from "lucide-react";
import { api, getAdminRole } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/admin/DataTable";
import {
  AdminEmptyState,
  AdminLoading,
  AdminPageHeader,
  AdminPageShell,
  StatusBadge,
} from "../components/admin/AdminUI";

const isSuper = getAdminRole() === "SUPER_ADMIN";

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

interface SensitiveRequest {
  id: number;
  adminId: number;
  resourceType: string;
  reason: string;
  status: string;
  expiresAt?: string | null;
  createdAt: string;
}

interface AuditLog {
  id: number;
  actorRole: string;
  actorId: number;
  albumId: number | null;
  action: string;
  accessType: string;
  reason?: string | null;
  createdAt: string;
}

function formatTime(value?: string | null) {
  if (!value) return "—";
  return value.slice(0, 16).replace("T", " ");
}

function SectionTitle({ title, count, hint }: { title: string; count?: number; hint?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-[11px] font-bold text-slate-200">
        {title}
        {typeof count === "number" && <span className="ml-1.5 text-[10px] font-normal text-slate-500">{count} 条</span>}
      </h2>
      {hint && <span className="text-[10px] text-slate-500">{hint}</span>}
    </div>
  );
}

function StatChip({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-slate-500">
      {label}
      <b className="font-bold text-slate-200">{value}</b>
      {hint && <span className="text-amber-300/90">{hint}</span>}
    </span>
  );
}

const approveButton =
  "inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/20";
const rejectButton =
  "inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20";

export default function AccessPage() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [sensitive, setSensitive] = useState<SensitiveRequest[]>([]);
  const [auditAllowed, setAuditAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [req, grant] = await Promise.all([api.accessRequests(), api.accessGrants()]);
      setRequests(req.data || []);
      setGrants(grant.data || []);
      try {
        const sensitiveReq = await api.sensitiveAccessRequests();
        setSensitive(sensitiveReq.data || []);
      } catch {
        setSensitive([]);
      }
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

  const actSensitive = async (id: number, approve: boolean) => {
    try {
      if (approve) await api.approveSensitiveAccess(id);
      else await api.rejectSensitiveAccess(id);
      showToast(approve ? "已批准，1 小时有效" : "已拒绝", "success");
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "操作失败", "error");
    }
  };

  const pendingRequests = requests.filter((item) => item.status === "PENDING").length;
  const pendingSensitive = sensitive.filter((item) => item.status === "PENDING").length;
  const initialLoading = loading && !requests.length && !sensitive.length && !grants.length && !logs.length;

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="授权审批"
        description="ADMIN 申请查看密码相册；SUPER_ADMIN 批准后 1 小时有效，仅可查看 400/800，禁止原图/下载。"
        eyebrow="访问控制"
        actions={
          <Button variant="secondary" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> 刷新
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <StatChip label="申请队列" value={requests.length} hint={pendingRequests ? `待审 ${pendingRequests}` : undefined} />
        <StatChip label="敏感字段" value={sensitive.length} hint={pendingSensitive ? `待审 ${pendingSensitive}` : undefined} />
        <StatChip label="授权记录" value={grants.length} />
        {auditAllowed && <StatChip label="审计日志" value={logs.length} />}
      </div>

      {initialLoading ? (
        <AdminLoading label="正在加载授权数据…" />
      ) : (
        <div className="space-y-4">
          <section className="space-y-2">
            <SectionTitle title="申请队列" count={requests.length} hint={isSuper ? undefined : "仅超级管理员可审批"} />
            {requests.length === 0 ? (
              <AdminEmptyState title="暂无查看申请" description="ADMIN 提交的密码相册查看申请会显示在这里。" />
            ) : (
              <DataTable
                rows={requests}
                rowKey={(row) => row.id}
                empty="暂无查看申请"
                columns={[
                  {
                    key: "id",
                    header: "编号",
                    width: "60px",
                    cell: (row) => <span className="font-mono text-[10px] text-slate-500">#{row.id}</span>,
                  },
                  {
                    key: "admin",
                    header: "管理员",
                    cell: (row) => <span className="text-[10px] text-slate-300">#{row.adminId}</span>,
                  },
                  {
                    key: "album",
                    header: "相册",
                    cell: (row) => <span className="text-[10px] text-slate-300">#{row.albumId}</span>,
                  },
                  {
                    key: "status",
                    header: "状态",
                    cell: (row) => <StatusBadge status={row.status} />,
                  },
                  {
                    key: "reason",
                    header: "申请原因",
                    className: "max-w-[280px]",
                    cell: (row) => <p className="line-clamp-2 text-[11px] leading-5 text-slate-400">{row.reason || "—"}</p>,
                  },
                  {
                    key: "createdAt",
                    header: "提交时间",
                    cell: (row) => <span className="whitespace-nowrap font-mono text-[10px] text-slate-500">{formatTime(row.createdAt)}</span>,
                  },
                  {
                    key: "action",
                    header: "操作",
                    className: "text-right",
                    cell: (row) =>
                      row.status === "PENDING" ? (
                        isSuper ? (
                          <div className="flex justify-end gap-1">
                            <button type="button" onClick={() => void act(row.id, true)} className={approveButton}>
                              <Check size={11} /> 批准
                            </button>
                            <button type="button" onClick={() => void act(row.id, false)} className={rejectButton}>
                              <X size={11} /> 拒绝
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-600">等待超管</span>
                        )
                      ) : (
                        <span className="text-[10px] text-slate-600">—</span>
                      ),
                  },
                ]}
              />
            )}
          </section>

          <section className="space-y-2">
            <SectionTitle title="敏感社交字段申请" count={sensitive.length} />
            {sensitive.length === 0 ? (
              <AdminEmptyState title="暂无敏感字段申请" description="社交字段等敏感信息的查看申请会显示在这里。" />
            ) : (
              <DataTable
                rows={sensitive}
                rowKey={(row) => row.id}
                empty="暂无敏感字段申请"
                columns={[
                  {
                    key: "id",
                    header: "编号",
                    width: "60px",
                    cell: (row) => <span className="font-mono text-[10px] text-slate-500">#{row.id}</span>,
                  },
                  {
                    key: "admin",
                    header: "管理员",
                    cell: (row) => <span className="text-[10px] text-slate-300">#{row.adminId}</span>,
                  },
                  {
                    key: "resourceType",
                    header: "资源类型",
                    cell: (row) => <span className="text-[10px] text-slate-300">{row.resourceType || "—"}</span>,
                  },
                  {
                    key: "status",
                    header: "状态",
                    cell: (row) => <StatusBadge status={row.status} />,
                  },
                  {
                    key: "reason",
                    header: "申请原因",
                    className: "max-w-[280px]",
                    cell: (row) => <p className="line-clamp-2 text-[11px] leading-5 text-slate-400">{row.reason || "—"}</p>,
                  },
                  {
                    key: "createdAt",
                    header: "提交时间",
                    cell: (row) => <span className="whitespace-nowrap font-mono text-[10px] text-slate-500">{formatTime(row.createdAt)}</span>,
                  },
                  {
                    key: "expiresAt",
                    header: "到期",
                    cell: (row) => <span className="whitespace-nowrap font-mono text-[10px] text-slate-500">{formatTime(row.expiresAt)}</span>,
                  },
                  {
                    key: "action",
                    header: "操作",
                    className: "text-right",
                    cell: (row) =>
                      row.status === "PENDING" ? (
                        isSuper ? (
                          <div className="flex justify-end gap-1">
                            <button type="button" onClick={() => void actSensitive(row.id, true)} className={approveButton}>
                              <Check size={11} /> 批准
                            </button>
                            <button type="button" onClick={() => void actSensitive(row.id, false)} className={rejectButton}>
                              <X size={11} /> 拒绝
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-600">等待超管</span>
                        )
                      ) : (
                        <span className="text-[10px] text-slate-600">—</span>
                      ),
                  },
                ]}
              />
            )}
          </section>

          <section className="space-y-2">
            <SectionTitle title="有效 / 历史授权" count={grants.length} />
            {grants.length === 0 ? (
              <AdminEmptyState title="暂无授权" description="批准后的相册查看授权会显示在这里。" />
            ) : (
              <DataTable
                rows={grants}
                rowKey={(row) => row.id}
                empty="暂无授权"
                columns={[
                  {
                    key: "id",
                    header: "编号",
                    width: "60px",
                    cell: (row) => <span className="font-mono text-[10px] text-slate-500">#{row.id}</span>,
                  },
                  {
                    key: "admin",
                    header: "管理员",
                    cell: (row) => <span className="text-[10px] text-slate-300">#{row.adminId}</span>,
                  },
                  {
                    key: "album",
                    header: "相册",
                    cell: (row) => <span className="text-[10px] text-slate-300">#{row.albumId}</span>,
                  },
                  {
                    key: "status",
                    header: "状态",
                    cell: (row) => (
                      <StatusBadge
                        status={row.status}
                        label={row.status === "ACTIVE" ? "有效" : row.status === "EXPIRED" ? "已过期" : undefined}
                      />
                    ),
                  },
                  {
                    key: "reason",
                    header: "授权原因",
                    className: "max-w-[320px]",
                    cell: (row) => <p className="line-clamp-2 text-[11px] leading-5 text-slate-400">{row.reason || "—"}</p>,
                  },
                  {
                    key: "expiresAt",
                    header: "到期时间",
                    cell: (row) => <span className="whitespace-nowrap font-mono text-[10px] text-slate-500">{formatTime(row.expiresAt)}</span>,
                  },
                ]}
              />
            )}
          </section>

          {auditAllowed && (
            <section className="space-y-2">
              <SectionTitle title="内部合规审计（仅超管）" count={logs.length} />
              {logs.length === 0 ? (
                <AdminEmptyState title="暂无审计记录" description="敏感访问与授权操作会记录在这里。" />
              ) : (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="max-h-[45vh] divide-y divide-white/[0.06] overflow-y-auto admin-scrollbar">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex flex-wrap items-center gap-x-2 gap-y-0.5 px-3 py-1.5 text-[10px] text-slate-400"
                      >
                        <span className="font-mono text-slate-500">#{log.id}</span>
                        <ShieldCheck size={11} className="text-indigo-400/70" />
                        <span>
                          {log.actorRole} #{log.actorId}
                        </span>
                        <span className="text-slate-700">·</span>
                        <span>相册 #{log.albumId ?? "—"}</span>
                        <span className="rounded bg-white/5 px-1 py-0.5 text-slate-300">{log.action}</span>
                        <span>{log.accessType}</span>
                        {log.reason && <span className="max-w-[280px] truncate text-slate-500">{log.reason}</span>}
                        <span className="ml-auto font-mono text-slate-600">{formatTime(log.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </AdminPageShell>
  );
}
