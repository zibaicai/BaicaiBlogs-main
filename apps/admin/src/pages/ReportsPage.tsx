import { useEffect, useState } from "react";
import { Download, ShieldAlert, Trash2, UserX } from "lucide-react";
import { api } from "../lib/api";
import { useToast } from "../components/ToastProvider";

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

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <ShieldAlert className="text-amber-400" /> 举报管理
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-bold">
            10 个有效举报自动隐藏；导出 ZIP 仅超级管理员可删除记录
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportAndMaybeDelete}
            disabled={selected.length === 0}
            className="px-4 py-2.5 rounded-2xl bg-indigo-500 disabled:opacity-40 text-white text-xs font-black flex items-center gap-2"
          >
            <Download size={14} /> 导出选中
          </button>
          <button
            onClick={deleteSelected}
            disabled={selected.length === 0}
            className="px-4 py-2.5 rounded-2xl bg-red-500/15 disabled:opacity-40 text-red-400 text-xs font-black flex items-center gap-2"
          >
            <Trash2 size={14} /> 删除记录
          </button>
        </div>
      </div>

      {loading && <div className="text-slate-400 text-sm">加载中...</div>}
      {!loading && reports.length === 0 && (
        <div className="text-center py-20 text-slate-500 font-bold">暂无举报</div>
      )}

      <div className="flex flex-col gap-3">
        {reports.map((report) => (
          <div key={report.id} className="rounded-3xl bg-white/5 border border-white/10 p-5">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.includes(report.id)}
                  onChange={() => toggle(report.id)}
                  className="mt-1 w-4 h-4 accent-indigo-500"
                />
                <div>
                  <div className="text-sm font-black text-white">
                    #{report.id} · {report.targetType} #{report.targetId} · {report.reason}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    举报人 #{report.reporterId} · IP {report.reporterIp} · {report.createdAt}
                  </div>
                  <div className="text-xs text-slate-400 mt-2 max-w-2xl">{report.detail}</div>
                  <div className="text-[10px] text-slate-500 mt-2">
                    状态：{report.status} · 证据：{report.evidenceKey || "无"}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => resolve(report.id, "restore")}
                  className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-[10px] font-black"
                >
                  恢复
                </button>
                <button
                  onClick={() => resolve(report.id, "hide")}
                  className="px-3 py-2 rounded-xl bg-amber-500/10 text-amber-400 text-[10px] font-black"
                >
                  下架
                </button>
                <button
                  onClick={() => ban(report.targetUserId)}
                  className="px-3 py-2 rounded-xl bg-red-500/10 text-red-400 text-[10px] font-black flex items-center gap-1"
                >
                  <UserX size={12} /> 封禁上传者
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-3xl bg-white/5 border border-white/10 p-5">
        <h2 className="text-lg font-black text-white mb-3">申诉审核</h2>
        <div className="flex flex-col gap-2">
          {appeals.map((appeal) => (
            <div key={appeal.id} className="rounded-2xl bg-black/15 border border-white/5 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-slate-200">
                  #{appeal.id} · {appeal.targetType} #{appeal.targetId} · {appeal.status}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">用户 #{appeal.userId} · {appeal.reason}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAppeal(appeal.id, "accept")} className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-[10px] font-black">通过</button>
                <button onClick={() => handleAppeal(appeal.id, "reject")} className="px-3 py-2 rounded-xl bg-red-500/10 text-red-400 text-[10px] font-black">驳回</button>
                <button onClick={() => reopenAppeal(appeal.id)} className="px-3 py-2 rounded-xl bg-amber-500/10 text-amber-400 text-[10px] font-black">超管翻案</button>
              </div>
            </div>
          ))}
          {appeals.length === 0 && <div className="text-xs text-slate-500">暂无申诉</div>}
        </div>
      </section>

      <section className="rounded-3xl bg-white/5 border border-white/10 p-5">
        <h2 className="text-lg font-black text-white mb-3">IP 黑名单</h2>
        <div className="flex gap-2 mb-3">
          <input
            value={banIp}
            onChange={(e) => setBanIp(e.target.value)}
            placeholder="输入要永久封禁的 IP"
            className="flex-1 rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-sm text-slate-100 outline-none"
          />
          <button onClick={submitIpBan} className="px-4 py-2.5 rounded-xl bg-red-500/15 text-red-400 text-xs font-black">
            永久封禁
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {ipBans.map((ban) => (
            <div key={ban.id} className="flex items-center justify-between rounded-xl bg-black/15 px-4 py-3">
              <span className="text-xs font-mono text-slate-300">{ban.ipHash} · {ban.reason}</span>
              <button onClick={async () => { await api.unbanIp(ban.id); await load(); }} className="text-[10px] font-black text-emerald-400">
                解封
              </button>
            </div>
          ))}
          {ipBans.length === 0 && <div className="text-xs text-slate-500">暂无封禁</div>}
        </div>
      </section>
    </div>
  );
}
