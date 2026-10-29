import { useEffect, useState } from "react";
import { Download, RefreshCw, Trash2, UserX } from "lucide-react";
import { api, getAdminRole } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import AuthImage from "../components/AuthImage";
import { Button, Input } from "../components/ui";
import { AdminEmptyState, AdminPageHeader, AdminPageShell, StatusBadge } from "../components/admin/AdminUI";
import { DataTable } from "../components/admin/DataTable";

interface Report {
  id: number;
  reporterId: number;
  targetType: string;
  targetId: number;
  targetUserId: number | null;
  reason: string;
  detail: string;
  status: string;
  evidenceKey: string | null;
  reporterIp: string;
  createdAt: string;
}

export default function ReportsPage() {
  const { showToast } = useToast();
  const isSuperAdmin = getAdminRole() === "SUPER_ADMIN";
  const [reports, setReports] = useState<Report[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [ipBans, setIpBans] = useState<any[]>([]);
  const [banIp, setBanIp] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [reportRes, appealRes, ipRes] = await Promise.all([
        api.adminReports(),
        api.adminAppeals(),
        api.ipBans(),
      ]);
      setReports(reportRes.data || []);
      setAppeals(appealRes.data || []);
      setIpBans(ipRes.data || []);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggle = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const resolve = async (id: number, action: "restore" | "hide") => {
    try {
      await api.resolveReport(id, action);
      showToast(action === "restore" ? "已恢复" : "已下架", "success");
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "操作失败", "error");
    }
  };

  const ban = async (userId: number | null) => {
    if (!userId) {
      showToast("该举报没有关联用户", "warning");
      return;
    }
    if (!confirm(`永久封禁用户 #${userId}？`)) return;
    try {
      await api.banUser(userId, "举报处理：违反社区规则");
      showToast("已封禁用户", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "封禁失败", "error");
    }
  };

  const exportAndMaybeDelete = async () => {
    if (selected.length === 0) return;
    try {
      const blob = await api.exportReports(selected);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reports-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      showToast("已导出 ZIP，确认下载完成后再删除", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "导出失败", "error");
    }
  };

  const handleAppeal = async (id: number, action: "accept" | "reject") => {
    try {
      await api.handleAppeal(id, action);
      showToast("申诉已处理", "success");
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "处理失败", "error");
    }
  };

  const reopenAppeal = async (id: number) => {
    try {
      await api.reopenAppeal(id);
      showToast("超级管理员已接管，ADMIN 不能再处理", "success");
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "翻案失败", "error");
    }
  };

  const submitIpBan = async () => {
    if (!banIp.trim()) return;
    try {
      await api.banIp(banIp.trim(), "举报处理：永久封禁");
      setBanIp("");
      showToast("IP 已永久封禁", "success");
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "封禁失败", "error");
    }
  };

  const deleteSelected = async () => {
    if (selected.length === 0) return;
    if (!confirm(`硬删除 ${selected.length} 条举报记录？请确认 ZIP 已下载完成。`)) return;
    try {
      await api.deleteReports(selected);
      showToast("已删除并保留最小审计", "success");
      setSelected([]);
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "删除失败", "error");
    }
  };

  const permanentDeleteComment = async (targetId: number) => {
    if (!window.confirm("永久删除这条评论？")) return;
    try {
      await api.deleteComment(targetId);
      await load();
      showToast("评论已永久删除", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "删除失败", "error");
    }
  };

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="举报管理"
        description="10 个有效举报自动隐藏；导出 ZIP 仅超级管理员可删除记录"
        actions={
          <>
            <Button variant="ghost" onClick={() => void load()}>
              <RefreshCw size={13} /> 刷新
            </Button>
            <Button variant="secondary" onClick={exportAndMaybeDelete} disabled={selected.length === 0}>
              <Download size={13} /> 导出选中
            </Button>
            <Button variant="danger" onClick={deleteSelected} disabled={selected.length === 0}>
              <Trash2 size={13} /> 删除记录
            </Button>
          </>
        }
      />

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[11px] font-bold text-white">
            举报列表 <span className="font-normal text-slate-500">· {reports.length} 条</span>
          </h2>
          <span className="text-[10px] text-slate-500">已选 {selected.length} 条</span>
        </div>

        {!loading && reports.length === 0 ? (
          <AdminEmptyState title="暂无举报" description="收到用户举报后会显示在这里。" />
        ) : (
          <DataTable
            rows={reports}
            loading={loading}
            rowKey={(report) => report.id}
            empty="暂无举报"
            columns={[
              {
                key: "select",
                header: "选择",
                width: "48px",
                cell: (report) => (
                  <input
                    type="checkbox"
                    checked={selected.includes(report.id)}
                    onChange={() => toggle(report.id)}
                    aria-label={`选择举报 #${report.id}`}
                    className="h-3.5 w-3.5 accent-indigo-500"
                  />
                ),
              },
              {
                key: "target",
                header: "举报",
                className: "max-w-[240px]",
                cell: (report) => (
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-slate-500">#{report.id}</span>
                      <span className="truncate text-[11px] font-bold text-slate-200">
                        {report.targetType} #{report.targetId}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-[10px] text-amber-300/90">{report.reason}</div>
                  </div>
                ),
              },
              {
                key: "reporter",
                header: "举报人",
                className: "max-w-[180px]",
                cell: (report) => (
                  <div className="text-[10px] leading-5 text-slate-500">
                    <div className="truncate">#{report.reporterId}</div>
                    <div className="truncate font-mono">IP {report.reporterIp}</div>
                    <div className="whitespace-nowrap">{report.createdAt}</div>
                  </div>
                ),
              },
              {
                key: "detail",
                header: "详情",
                className: "max-w-[320px]",
                cell: (report) => (
                  <div>
                    <p className="line-clamp-2 text-[10px] leading-5 text-slate-400">{report.detail}</p>
                    {report.evidenceKey && (
                      <AuthImage
                        src={`/api/admin/reports/${report.id}/evidence`}
                        className="mt-1.5 h-14 w-24 rounded-md border border-white/10 object-cover"
                      />
                    )}
                  </div>
                ),
              },
              {
                key: "status",
                header: "状态",
                width: "130px",
                cell: (report) => (
                  <div className="flex flex-col items-start gap-1">
                    <StatusBadge status={report.status} />
                    <span className="max-w-[110px] truncate text-[9px] text-slate-600">
                      证据：{report.evidenceKey || "无"}
                    </span>
                  </div>
                ),
              },
              {
                key: "actions",
                header: "操作",
                className: "text-right",
                cell: (report) => (
                  <div className="flex min-w-[150px] flex-wrap justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => void resolve(report.id, "restore")}
                      className="rounded-md bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-300 hover:bg-emerald-500/20"
                    >
                      恢复
                    </button>
                    <button
                      type="button"
                      onClick={() => void resolve(report.id, "hide")}
                      className="rounded-md bg-amber-500/10 px-2 py-1 text-[9px] font-bold text-amber-300 hover:bg-amber-500/20"
                    >
                      下架
                    </button>
                    {report.targetType === "comment" && isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => void permanentDeleteComment(report.targetId)}
                        className="rounded-md bg-red-500/15 px-2 py-1 text-[9px] font-bold text-red-300 hover:bg-red-500/25"
                      >
                        永久删除评论
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void ban(report.targetUserId)}
                      className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-1 text-[9px] font-bold text-red-300 hover:bg-red-500/20"
                    >
                      <UserX size={11} /> 封禁上传者
                    </button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-[11px] font-bold text-white">
          申诉审核 <span className="font-normal text-slate-500">· {appeals.length} 条</span>
        </h2>

        {!loading && appeals.length === 0 ? (
          <AdminEmptyState title="暂无申诉" description="用户提交申诉后会显示在这里。" />
        ) : (
          <DataTable
            rows={appeals}
            loading={loading}
            rowKey={(appeal) => appeal.id}
            empty="暂无申诉"
            columns={[
              {
                key: "appeal",
                header: "申诉",
                cell: (appeal) => (
                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-bold text-slate-200">
                      #{appeal.id} · {appeal.targetType} #{appeal.targetId}
                    </div>
                  </div>
                ),
              },
              {
                key: "user",
                header: "用户与原因",
                className: "max-w-[320px]",
                cell: (appeal) => (
                  <div className="text-[10px] leading-5">
                    <span className="text-slate-500">用户 #{appeal.userId}</span>
                    <p className="line-clamp-2 text-slate-400">{appeal.reason}</p>
                  </div>
                ),
              },
              {
                key: "status",
                header: "状态",
                cell: (appeal) => <StatusBadge status={appeal.status} />,
              },
              {
                key: "actions",
                header: "操作",
                className: "text-right",
                cell: (appeal) => (
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => void handleAppeal(appeal.id, "accept")}
                      className="rounded-md bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-300 hover:bg-emerald-500/20"
                    >
                      通过
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleAppeal(appeal.id, "reject")}
                      className="rounded-md bg-red-500/10 px-2 py-1 text-[9px] font-bold text-red-300 hover:bg-red-500/20"
                    >
                      驳回
                    </button>
                    <button
                      type="button"
                      onClick={() => void reopenAppeal(appeal.id)}
                      className="rounded-md bg-amber-500/10 px-2 py-1 text-[9px] font-bold text-amber-300 hover:bg-amber-500/20"
                    >
                      超管翻案
                    </button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-[11px] font-bold text-white">
          IP 黑名单 <span className="font-normal text-slate-500">· {ipBans.length} 条</span>
        </h2>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <Input
                value={banIp}
                onChange={(e) => setBanIp(e.target.value)}
                placeholder="输入要永久封禁的 IP"
                aria-label="要永久封禁的 IP"
              />
            </div>
            <Button variant="danger" className="shrink-0" onClick={() => void submitIpBan()}>
              永久封禁
            </Button>
          </div>

          <div className="mt-2 divide-y divide-white/[0.06]">
            {ipBans.map((ipBan) => (
              <div key={ipBan.id} className="flex items-center justify-between gap-2 py-1.5">
                <span className="min-w-0 truncate font-mono text-[10px] text-slate-300">
                  {ipBan.ipHash} · {ipBan.reason}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await api.unbanIp(ipBan.id);
                    await load();
                  }}
                  className="shrink-0 rounded-md px-2 py-1 text-[9px] font-bold text-emerald-300 hover:bg-emerald-500/10"
                >
                  解封
                </button>
              </div>
            ))}
            {ipBans.length === 0 && <p className="py-2 text-[10px] text-slate-500">暂无封禁</p>}
          </div>
        </div>
      </section>
    </AdminPageShell>
  );
}
