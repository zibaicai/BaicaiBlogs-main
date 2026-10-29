"use client";

import { useEffect, useState } from "react";
import { Check, Hash, Plus, RefreshCw, X } from "lucide-react";

import { api, type Tag } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { Button, Input } from "../components/ui";
import { AdminEmptyState, AdminLoading, AdminPageHeader, AdminPageShell } from "../components/admin/AdminUI";
import { DataTable } from "../components/admin/DataTable";

export default function TagsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getTags();
      setItems(res.data || []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "加载标签失败", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.createTag(name.trim().replace(/^#/, ""));
      setName("");
      showToast("标签已创建", "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "创建失败", "error");
    } finally {
      setBusy(false);
    }
  };

  const approve = async (tag: Tag) => {
    try {
      await api.approveTag(tag.id);
      showToast("已通过，申请人会收到站内信", "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "审批失败", "error");
    }
  };

  const reject = async (tag: Tag) => {
    const note = window.prompt("拒绝原因", "标签不符合当前分类体系");
    if (note === null) return;
    try {
      await api.rejectTag(tag.id, note);
      showToast("已拒绝，申请人会收到站内信", "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "审批失败", "error");
    }
  };

  const pending = items.filter((item) => item.status === "PENDING");
  const active = items.filter((item) => item.status === "ACTIVE");

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="标签库"
        description="完全扁平标签；用户申请后在这里审批，通过/拒绝都会发站内信。"
        actions={
          <>
            <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-300">
              待审批 {pending.length}
            </span>
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-400">
              已启用 {active.length}
            </span>
            <Button variant="secondary" onClick={() => void load()} disabled={loading}>
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> 刷新
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
        <div className="min-w-[180px] flex-1">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="直接添加标签，例如 React"
          />
        </div>
        <Button onClick={create} disabled={busy} className="shrink-0">
          <Plus size={13} /> 添加
        </Button>
      </div>

      {loading ? (
        <AdminLoading />
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
              待审批 {pending.length}
            </h2>
            <DataTable
              rows={pending}
              rowKey={(tag) => tag.id}
              empty="暂无待审批标签"
              columns={[
                {
                  key: "name",
                  header: "标签",
                  className: "max-w-[220px]",
                  cell: (tag) => (
                    <div className="flex min-w-0 items-center gap-2 text-[11px] font-bold text-white">
                      <Hash size={12} className="shrink-0 text-amber-300" />
                      <span className="truncate">{tag.name}</span>
                    </div>
                  ),
                },
                {
                  key: "note",
                  header: "申请理由",
                  className: "max-w-[420px]",
                  cell: (tag) => (
                    <p className="line-clamp-2 text-[10px] leading-5 text-slate-400">{tag.reviewNote || "—"}</p>
                  ),
                },
                {
                  key: "action",
                  header: "操作",
                  className: "text-right",
                  width: "150px",
                  cell: (tag) => (
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => void approve(tag)}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/20"
                      >
                        <Check size={11} /> 通过
                      </button>
                      <button
                        type="button"
                        onClick={() => void reject(tag)}
                        className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20"
                      >
                        <X size={11} /> 拒绝
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          </section>

          <section className="space-y-2">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              已启用 {active.length}
            </h2>
            {active.length === 0 ? (
              <AdminEmptyState title="暂无已启用标签" description="在上方输入名称即可直接添加标签。" />
            ) : (
              <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
                {active.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-[10px] font-bold text-slate-300"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </AdminPageShell>
  );
}
