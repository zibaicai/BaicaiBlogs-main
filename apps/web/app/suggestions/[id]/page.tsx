"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Loader2 } from "lucide-react";
import Navbar from "../../../components/Navbar";
import PageTransition from "../../../components/PageTransition";
import BackButton from "../../../components/BackButton";
import { suggestionApi, type Suggestion } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

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

function SuggestionContent({ item }: { item: Suggestion }) {
  const parts = item.content.split(/(!\[[^\]]*\]\(attachment:\/\/\d+\)|attachment:\/\/\d+)/g);
  return (
    <div className="space-y-4 text-sm leading-7 text-slate-700 dark:text-slate-300">
      {parts.map((part, index) => {
        const markdownImage = part.match(/^!\[[^\]]*\]\(attachment:\/\/(\d+)\)$/);
        const rawImage = part.match(/^attachment:\/\/(\d+)$/);
        const match = markdownImage || rawImage;
        if (!match) return part ? <p key={index} className="whitespace-pre-wrap">{part}</p> : null;
        const imageId = Number(match[1]);
        if (!(item.images || []).some((image) => image.id === imageId)) return null;
        return (
          <figure key={index} className="overflow-hidden rounded-2xl border border-white/20 bg-black/5 p-2">
            <img src={suggestionApi.imageUrl(imageId)} alt="建议参考图片" className="max-h-[520px] w-full rounded-xl object-contain" loading="lazy" />
          </figure>
        );
      })}
    </div>
  );
}

export default function SuggestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, loading: authLoading } = useAuth();
  const [id, setId] = useState<number | null>(null);
  const [item, setItem] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void params.then((value) => {
      const parsed = Number(value.id);
      if (Number.isFinite(parsed)) setId(parsed);
    });
  }, [params]);

  useEffect(() => {
    if (id == null) return;
    setLoading(true);
    suggestionApi.get(id).then(setItem).catch(() => setItem(null)).finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell suggestions-shell">
          <BackButton fallbackHref="/suggestions" label="返回建议列表" />
          {loading || authLoading ? (
            <div className="py-24 text-center text-sm text-slate-400"><Loader2 className="mx-auto animate-spin" size={20} /></div>
          ) : !user ? (
            <div className="py-24 text-center text-sm text-slate-400">请先登录后查看建议。</div>
          ) : !item ? (
            <div className="py-24 text-center text-sm text-slate-400">建议不存在或无权查看。</div>
          ) : (
            <article className="mx-auto max-w-3xl rounded-[2rem] border border-white/20 bg-white/35 p-6 backdrop-blur-xl dark:bg-slate-800/35 md:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-indigo-500/10 px-3 py-1.5 text-[10px] font-black text-indigo-500">{STATUS_LABEL[item.status] || item.status}</span>
                <span className="text-[10px] text-slate-400">{item.category || "其他"} · {new Date(item.createdAt).toLocaleString("zh-CN")}</span>
              </div>
              <h1 className="mt-4 text-3xl font-black text-slate-900 dark:text-white">{item.title}</h1>
              <div className="mt-6"><SuggestionContent item={item} /></div>

              {item.reviewNote && (
                <section className="mt-8 rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-5">
                  <h2 className="flex items-center gap-2 text-sm font-black text-indigo-500"><Lightbulb size={15} /> 管理员回复</h2>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">{item.reviewNote}</p>
                </section>
              )}

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/20 p-4">
                  <div className="text-[10px] text-slate-400">评分</div>
                  <div className="mt-1 text-lg font-black text-slate-800 dark:text-slate-100">{item.score ? `${item.score} / 5` : "待评估"}</div>
                </div>
                <div className="rounded-2xl bg-white/20 p-4">
                  <div className="text-[10px] text-slate-400">奖励</div>
                  <div className="mt-1 text-lg font-black text-slate-800 dark:text-slate-100">{item.rewardAmount ? `¥${Number(item.rewardAmount).toFixed(2)}` : "暂无"}</div>
                </div>
                <div className="rounded-2xl bg-white/20 p-4">
                  <div className="text-[10px] text-slate-400">奖励状态</div>
                  <div className="mt-1 text-lg font-black text-slate-800 dark:text-slate-100">{item.rewardStatus || "NONE"}</div>
                </div>
              </div>
            </article>
          )}
        </main>
      </PageTransition>
    </div>
  );
}
