"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ImagePlus, Lightbulb, Loader2, Send, X } from "lucide-react";
import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import { PageTitle } from "../../components/ui/Typography";
import Select from "../../components/ui/Select";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import { suggestionApi, type Suggestion, type SuggestionImage } from "../../lib/api";
import { useAuth } from "../../lib/auth";

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

export default function SuggestionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("功能建议");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<SuggestionImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [mine, setMine] = useState<Suggestion[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadMine = () => {
    if (!user) return;
    suggestionApi.mine().then(setMine).catch(() => setMine([]));
  };

  useEffect(() => {
    loadMine();
  }, [user]);

  const upload = async (file: File) => {
    if (images.length >= 5) {
      setMessage("最多上传 5 张图片");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      const image = await suggestionApi.uploadImage(file);
      setImages((prev) => [...prev, image]);
      setContent((prev) => `${prev}${prev.endsWith("\n") ? "" : "\n\n"}![参考图片](attachment://${image.id})\n\n`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "图片上传失败");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (title.trim().length < 3) {
      setMessage("标题至少 3 个字符");
      return;
    }
    if (content.trim().length < 10) {
      setMessage("请把建议描述清楚，至少 10 个字符");
      return;
    }
    setSending(true);
    setMessage("");
    try {
      await suggestionApi.create({ title: title.trim(), category, content, imageIds: images.map((image) => image.id) });
      setTitle("");
      setContent("");
      setImages([]);
      setMessage("建议已提交，等待超级管理员审核");
      loadMine();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交失败");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell suggestions-shell">
          <header className="mb-8">
            <span className="font-mono text-meta font-black tracking-[0.2em] text-indigo-400">SUGGESTIONS</span>
            <PageTitle className="mt-2 text-slate-900 dark:text-white">建议与想法</PageTitle>
            <p className="page-subtitle mt-3 max-w-2xl text-slate-500 dark:text-slate-400">
              对博客的功能、界面和体验提出建议。可以附截图或草图，超级管理员会审核并回复，采纳后会有 1-5 元奖励。
            </p>
          </header>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="suggestion-surface rounded-[2rem] border border-white/30 bg-white/55 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/55">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
                <Lightbulb size={17} /> 提交建议
              </h2>
              {!user && !authLoading ? (
                <div className="rounded-2xl border border-white/20 bg-white/20 p-6 text-center text-sm text-slate-500">
                  <p>登录后可以提交建议和查看审核进度。</p>
                  <Link href="/login" className="mt-4 inline-flex rounded-full bg-indigo-500 px-5 py-2 text-xs font-black text-white">去登录</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
                    <label className="block">
                      <span className="mb-2 ml-1 block text-meta font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">标题</span>
                      <Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="用一句话概括你的建议" />
                    </label>
                    <label className="block">
                      <span className="mb-2 ml-1 block text-meta font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">分类</span>
                      <Select
                        value={category}
                        onChange={setCategory}
                        ariaLabel="建议分类"
                        size="lg"
                        width="full"
                        options={[
                          { value: "功能建议", label: "功能建议" },
                          { value: "UI / 视觉", label: "UI / 视觉" },
                          { value: "交互体验", label: "交互体验" },
                          { value: "性能与安全", label: "性能与安全" },
                          { value: "内容与运营", label: "内容与运营" },
                          { value: "其他", label: "其他" },
                        ]}
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="mb-2 ml-1 block text-meta font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">方案描述</span>
                  <Textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    rows={12}
                    maxLength={20000}
                    placeholder={"尽量描述清楚：\n1. 现在的问题\n2. 你希望变成什么样\n3. 可以参考的截图或草图\n\n图片会插入到正文中。"}
                  />
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading || images.length >= 5} className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black text-slate-600 disabled:opacity-40 dark:text-slate-300">
                      {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />} 插入图片
                    </button>
                    <span className="text-meta text-slate-400">JPG / PNG / WebP · 单张 10MB · 最多 5 张</span>
                  </div>
                  {images.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {images.map((image) => (
                        <div key={image.id} className="relative h-24 w-24 overflow-hidden rounded-xl border border-white/20 bg-black/10">
                          <img src={suggestionApi.imageUrl(image.id)} alt="参考图片" className="h-full w-full object-cover" />
                          <button type="button" onClick={() => { setImages((prev) => prev.filter((item) => item.id !== image.id)); setContent((prev) => prev.replace(`![参考图片](attachment://${image.id})`, "")); }} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-meta text-slate-400">{content.length} / 20000</span>
                    <button type="button" onClick={() => void submit()} disabled={sending} className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-2.5 text-xs font-black text-white disabled:opacity-50">
                      {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} 提交建议
                    </button>
                  </div>
                  {message && <p className="text-xs font-bold text-indigo-500">{message}</p>}
                </div>
              )}
            </section>

            <aside className="suggestion-surface h-fit rounded-[2rem] border border-white/30 bg-white/55 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/55">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">我的建议</h2>
              <p className="mt-1 text-meta text-slate-400">提交后可在详情中查看管理员回复。</p>
              <div className="mt-4 space-y-3">
                {mine.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">还没有提交过建议。</p>
                ) : mine.map((item) => (
                  <Link key={item.id} href={`/suggestions/${item.id}`} className="block rounded-2xl border border-white/20 bg-white/20 p-4 transition hover:bg-white/35">
                    <div className="flex items-start justify-between gap-3">
                      <strong className="line-clamp-2 text-sm text-slate-800 dark:text-slate-100">{item.title}</strong>
                      <span className="shrink-0 rounded-full bg-indigo-500/10 px-2 py-1 text-meta font-black text-indigo-500">{STATUS_LABEL[item.status] || item.status}</span>
                    </div>
                    <div className="mt-2 text-meta text-slate-400">{item.category || "其他"} · {new Date(item.createdAt).toLocaleDateString("zh-CN")}</div>
                    {item.rewardAmount ? <div className="mt-2 text-meta font-bold text-amber-500">奖励 ¥{Number(item.rewardAmount).toFixed(2)} · {item.rewardStatus}</div> : null}
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
