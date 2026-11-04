"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { AdminEmptyState, AdminPageHeader, AdminPageShell } from "../components/admin/AdminUI";
import { Button } from "../components/ui/Button";

export default function CommentAuditPage() {
  const { showToast } = useToast();
  const [status, setStatus] = useState("HIDDEN");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.adminComments(status);
      setItems(response.data || []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "加载失败", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (comment: any, action: "hide" | "restore" | "delete" | "reject") => {
    try {
      if (action === "hide") await api.adminHideComment(comment.id);
      if (action === "restore") await api.adminRestoreComment(comment.id);
      if (action === "delete") await api.adminDeleteComment(comment.id);
      if (action === "reject") await api.adminRejectCommentAppeal(comment.id);
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "操作失败", "error");
    }
  };

  return (
    <AdminPageShell>
      <AdminPageHeader
        eyebrow="COMMENT AUDIT"
        title="评论审计"
        description="查看隐藏评论、处理申诉与永久删除。"
        actions={<Button variant="ghost" onClick={() => void load()} disabled={loading}><RefreshCw size={13} /> 刷新</Button>}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {["HIDDEN", "VISIBLE", "DELETED"].map((value) => (
          <button key={value} type="button" onClick={() => setStatus(value)}
            className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${status === value ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-400 hover:text-white"}`}>
            {value === "HIDDEN" ? "已隐藏" : value === "VISIBLE" ? "正常" : "已删除"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-slate-400"><Loader2 className="mr-2 animate-spin" size={16} /> 加载中…</div>
      ) : items.length === 0 ? (
        <AdminEmptyState title="暂无评论" description="当前筛选下没有评论。" />
      ) : (
        <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-white/[0.02]">
          {items.map((comment) => (
            <div key={comment.id} className="flex flex-wrap items-start gap-3 p-4 text-xs">
              <div className="min-w-0 flex-1">
                <p className="text-slate-200">{comment.content || "已删除评论"}</p>
                <p className="mt-1 text-[10px] text-slate-500">
                  {comment.targetType} · #{comment.targetId} · {comment.author || "用户"} · {comment.status}
                  {comment.appealStatus === "PENDING" && <span className="ml-2 text-amber-300">申诉中：{comment.appealReason || "未填写原因"}</span>}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {comment.status !== "VISIBLE" && <Button variant="ghost" onClick={() => void act(comment, "restore")}>恢复</Button>}
                {comment.status === "VISIBLE" && <Button variant="ghost" onClick={() => void act(comment, "hide")}>隐藏</Button>}
                {comment.appealStatus === "PENDING" && <Button variant="ghost" onClick={() => void act(comment, "reject")}>驳回申诉</Button>}
                <Button variant="danger" onClick={() => void act(comment, "delete")}>永久删除</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
