"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Save } from "lucide-react";
import { api } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { Button, Input, Select, Textarea } from "../components/ui";
import {
  AdminEmptyState,
  AdminLoading,
  AdminPageHeader,
  AdminPageShell,
  FormActions,
  FormField,
  StatusBadge,
} from "../components/admin/AdminUI";

const STATUSES = [
  "IN_REVIEW",
  "NEEDS_INFO",
  "ACCEPTED",
  "REJECTED",
  "PLANNED",
  "IMPLEMENTED",
  "REWARD_PENDING",
  "REWARD_PAID",
  "CLOSED",
];

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "已提交",
  IN_REVIEW: "审核中",
  NEEDS_INFO: "需补充",
  ACCEPTED: "已采纳",
  REJECTED: "未采纳",
  PLANNED: "已排期",
  IMPLEMENTED: "已实现",
  REWARD_PENDING: "奖励待发放",
  REWARD_PAID: "奖励已发放",
  CLOSED: "已关闭",
};

type Suggestion = {
  id: number;
  userId: number;
  author: string;
  title: string;
  category?: string;
  content: string;
  status: string;
  score?: number;
  rewardAmount?: number;
  rewardStatus?: string;
  reviewNote?: string;
  images?: Array<{ id: number; width?: number; height?: number }>;
  createdAt: string;
};

export default function SuggestionsAdminPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("IN_REVIEW");
  const [score, setScore] = useState("");
  const [rewardAmount, setRewardAmount] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
  const [imageLoading, setImageLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.adminSuggestions();
      setItems(response.data || []);
      if (!selected && (response.data || []).length > 0) setSelected(response.data[0]);
      else if (selected) {
        const refreshed = (response.data || []).find((item: Suggestion) => item.id === selected.id);
        if (refreshed) setSelected(refreshed);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!selected) return;
    setStatus(selected.status === "SUBMITTED" ? "IN_REVIEW" : selected.status);
    setScore(selected.score ? String(selected.score) : "");
    setRewardAmount(selected.rewardAmount ? String(selected.rewardAmount) : "");
    setReviewNote(selected.reviewNote || "");
  }, [selected]);

  useEffect(() => {
    if (!selected?.images?.length) {
      setImageUrls({});
      return;
    }
    let active = true;
    setImageLoading(true);
    Promise.all(selected.images.map(async (image) => [image.id, await api.adminSuggestionImage(image.id)] as const))
      .then((entries) => {
        if (active) setImageUrls(Object.fromEntries(entries));
      })
      .catch(() => {
        if (active) setImageUrls({});
      })
      .finally(() => active && setImageLoading(false));
    return () => {
      active = false;
      setImageUrls((previous) => {
        Object.values(previous).forEach((url) => URL.revokeObjectURL(url));
        return {};
      });
    };
  }, [selected]);

  const contentParts = useMemo(() => selected?.content.split(/(!\[[^\]]*\]\(attachment:\/\/\d+\)|attachment:\/\/\d+)/g) || [], [selected]);

  const review = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const result = await api.reviewSuggestion(selected.id, {
        status,
        score: score ? Number(score) : null,
        rewardAmount: rewardAmount ? Number(rewardAmount) : null,
        reviewNote,
      });
      setSelected(result.data);
      showToast("审核结果已保存", "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "保存失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const selectedLabel = selected ? STATUS_LABEL[selected.status] || selected.status : "";

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="建议审核"
        description="仅超级管理员可审核、评分和设置奖励。"
        actions={
          <Button variant="ghost" onClick={() => void load()}>
            <RefreshCw size={13} /> 刷新
          </Button>
        }
      />

      <div className="grid items-start gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-white/10 bg-white/[0.03] p-2 lg:sticky lg:top-4">
          <div className="flex items-center justify-between px-1 pb-2">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">建议列表</h2>
            <span className="text-[10px] text-slate-500">{items.length}</span>
          </div>

          {loading ? (
            <AdminLoading />
          ) : items.length === 0 ? (
            <AdminEmptyState title="暂无建议" description="用户提交建议后会出现在这里。" />
          ) : (
            <div className="admin-scrollbar flex max-h-[calc(100vh-240px)] flex-col gap-1 overflow-y-auto">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item)}
                  className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${
                    selected?.id === item.id
                      ? "border-indigo-400/40 bg-indigo-500/10"
                      : "border-transparent hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <strong className="line-clamp-2 text-[11px] font-bold text-slate-200">{item.title}</strong>
                    <span className="shrink-0">
                      <StatusBadge status={item.status} label={STATUS_LABEL[item.status] || item.status} />
                    </span>
                  </div>
                  <div className="mt-1 truncate text-[9px] text-slate-500">
                    #{item.id} · {item.author} · {item.category || "其他"}
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="min-w-0 rounded-xl border border-white/10 bg-white/[0.03]">
          {!selected ? (
            <AdminEmptyState title="选择一条建议" description="从左侧列表选择建议，查看详情、评分并设置奖励。" />
          ) : (
            <div className="space-y-4 p-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-500">
                  <StatusBadge status={selected.status} label={selectedLabel} />
                  <span>#{selected.id}</span>
                  <span>{selected.author}</span>
                  <span>{selected.category || "其他"}</span>
                  <span>{new Date(selected.createdAt).toLocaleString("zh-CN")}</span>
                </div>
                <h2 className="mt-1.5 text-base font-bold leading-tight text-white">{selected.title}</h2>
              </div>

              <div className="space-y-2 whitespace-pre-wrap text-[12px] leading-6 text-slate-300">
                {contentParts.map((part, index) => {
                  const markdownImage = part.match(/^!\[[^\]]*\]\(attachment:\/\/(\d+)\)$/);
                  const rawImage = part.match(/^attachment:\/\/(\d+)$/);
                  const match = markdownImage || rawImage;
                  if (!match) return part ? <p key={index}>{part}</p> : null;
                  const imageId = Number(match[1]);
                  return imageUrls[imageId] ? (
                    <img
                      key={index}
                      src={imageUrls[imageId]}
                      alt="参考图片"
                      className="max-h-[420px] rounded-lg border border-white/10 object-contain"
                    />
                  ) : null;
                })}
                {imageLoading && <div className="text-[10px] text-slate-500">图片加载中…</div>}
              </div>

              <div className="grid gap-3 border-t border-white/10 pt-3 md:grid-cols-3">
                <FormField label="状态">
                  <Select
                    value={status}
                    onChange={setStatus}
                    ariaLabel="审核状态"
                    options={STATUSES.map((value) => ({ value, label: STATUS_LABEL[value] }))}
                  />
                </FormField>
                <Input
                  label="评分 1-5"
                  value={score}
                  onChange={(event) => setScore(event.target.value)}
                  type="number"
                  min="1"
                  max="5"
                />
                <Input
                  label="奖励金额 1-5 元"
                  value={rewardAmount}
                  onChange={(event) => setRewardAmount(event.target.value)}
                  type="number"
                  min="1"
                  max="5"
                  step="0.01"
                />
              </div>

              <Textarea
                label="审核回复"
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                rows={4}
                placeholder="告诉用户是否采纳、原因和下一步计划"
              />

              <FormActions>
                <Button onClick={() => void review()} disabled={saving}>
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} 保存审核
                </Button>
              </FormActions>
            </div>
          )}
        </section>
      </div>
    </AdminPageShell>
  );
}
