"use client";

import { useEffect, useMemo, useState } from "react";
import { Lightbulb, Loader2, Save } from "lucide-react";
import { api } from "../lib/api";
import { useToast } from "../components/ToastProvider";

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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-black text-white"><Lightbulb size={25} /> 建议审核</h1>
        <p className="mt-1 text-sm font-bold text-slate-400">仅超级管理员可审核、评分和设置奖励。</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-2">
          {loading && <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="animate-spin" size={16} /> 加载中</div>}
          {!loading && items.length === 0 && <div className="rounded-2xl bg-white/5 p-5 text-sm text-slate-400">暂无建议。</div>}
          {items.map((item) => (
            <button key={item.id} onClick={() => setSelected(item)} className={`w-full rounded-2xl border p-4 text-left transition ${selected?.id === item.id ? "border-indigo-400/50 bg-indigo-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
              <div className="flex items-start justify-between gap-2">
                <strong className="line-clamp-2 text-sm text-white">{item.title}</strong>
                <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-[9px] font-black text-slate-300">{STATUS_LABEL[item.status] || item.status}</span>
              </div>
              <div className="mt-2 text-[10px] text-slate-500">#{item.id} · {item.author} · {item.category || "其他"}</div>
            </button>
          ))}
        </aside>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          {!selected ? (
            <div className="py-20 text-center text-sm text-slate-400">选择一条建议查看详情。</div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-black text-slate-400">
                  <span className="rounded-full bg-indigo-500/15 px-2 py-1 text-indigo-300">{STATUS_LABEL[selected.status] || selected.status}</span>
                  <span>#{selected.id}</span>
                  <span>{selected.author}</span>
                  <span>{new Date(selected.createdAt).toLocaleString("zh-CN")}</span>
                </div>
                <h2 className="mt-3 text-2xl font-black text-white">{selected.title}</h2>
              </div>

              <div className="space-y-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                {contentParts.map((part, index) => {
                  const markdownImage = part.match(/^!\[[^\]]*\]\(attachment:\/\/(\d+)\)$/);
                  const rawImage = part.match(/^attachment:\/\/(\d+)$/);
                  const match = markdownImage || rawImage;
                  if (!match) return part ? <p key={index}>{part}</p> : null;
                  const imageId = Number(match[1]);
                  return imageUrls[imageId] ? <img key={index} src={imageUrls[imageId]} alt="参考图片" className="max-h-[520px] rounded-2xl border border-white/10 object-contain" /> : null;
                })}
                {imageLoading && <div className="text-xs text-slate-500">图片加载中…</div>}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  状态
                  <select value={status} onChange={(event) => setStatus(event.target.value)} className="admin-input mt-2">
                    {STATUSES.map((value) => <option key={value} value={value}>{STATUS_LABEL[value]}</option>)}
                  </select>
                </label>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  评分 1-5
                  <input value={score} onChange={(event) => setScore(event.target.value)} type="number" min="1" max="5" className="admin-input mt-2" />
                </label>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  奖励金额 1-5 元
                  <input value={rewardAmount} onChange={(event) => setRewardAmount(event.target.value)} type="number" min="1" max="5" step="0.01" className="admin-input mt-2" />
                </label>
              </div>

              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                审核回复
                <textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} rows={5} className="admin-input mt-2" placeholder="告诉用户是否采纳、原因和下一步计划" />
              </label>

              <button onClick={() => void review()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 保存审核
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
