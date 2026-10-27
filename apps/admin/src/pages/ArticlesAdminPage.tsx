"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Loader2, Plus, Save, Trash2, Upload } from "lucide-react";
import RichTextEditor, { type RichTextEditorHandle } from "../components/editor/RichTextEditor";
import { Select } from "../components/ui/Select";
import { api } from "../lib/api";
import { useToast } from "../components/ToastProvider";

type Article = {
  id: number;
  title: string;
  subtitle?: string;
  cover?: string;
  summary?: string;
  contentHtml: string;
  category?: string;
  tags?: string[];
  status: string;
  visibility: string;
  slug: string;
  publishedAt?: string;
  updatedAt?: string;
};

export default function ArticlesAdminPage() {
  const { showToast } = useToast();
  const editorRef = useRef<RichTextEditorHandle>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Article[]>([]);
  const [current, setCurrent] = useState<Article | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [cover, setCover] = useState("");
  const [category, setCategory] = useState("文章");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePanelOpen, setImagePanelOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.adminArticles();
      setItems(response.data || []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const newArticle = () => {
    setCurrent(null);
    setTitle("");
    setSummary("");
    setSubtitle("");
    setCover("");
    setCategory("文章");
    setTags("");
    setStatus("DRAFT");
    setTimeout(() => editorRef.current?.getContent(), 0);
  };

  const editArticle = (article: Article) => {
    setCurrent(article);
    setTitle(article.title || "");
    setSummary(article.summary || "");
    setSubtitle(article.subtitle || "");
    setCover(article.cover || "");
    setCategory(article.category || "文章");
    setTags((article.tags || []).join(", "));
    setStatus(article.status || "DRAFT");
  };

  const uploadImage = async (file: File | undefined, target: "inline" | "cover") => {
    if (!file) return;
    setUploading(true);
    try {
      const response = await api.uploadArticleImage(file);
      const url = response.data;
      if (target === "inline") {
        editorRef.current?.insertImage(url);
        setImagePanelOpen(false);
      } else {
        setCover(url);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "图片上传失败", "error");
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const save = async () => {
    if (title.trim().length < 2) {
      showToast("标题至少 2 个字符", "error");
      return;
    }
    const contentHtml = editorRef.current?.getContent() || "";
    if (contentHtml.replace(/<[^>]*>/g, "").trim().length < 10) {
      showToast("正文太短", "error");
      return;
    }
    setSaving(true);
    const payload = {
      title: title.trim(),
      subtitle,
      cover,
      summary,
      contentHtml,
      category,
      tags: tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean),
      status,
      visibility: "PUBLIC",
    };
    try {
      const response = current
        ? await api.updateArticle(current.id, payload)
        : await api.createArticle(payload);
      setCurrent(response.data);
      showToast(status === "PUBLISHED" ? "文章已发布" : "草稿已保存", "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "保存失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!current || !window.confirm("确定删除这篇文章吗？")) return;
    try {
      await api.deleteArticle(current.id);
      newArticle();
      showToast("文章已删除", "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "删除失败", "error");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-black text-white"><BookOpen size={25} /> 文章管理</h1>
          <p className="mt-1 text-sm font-bold text-slate-400">独立富文本文章，不复用笔记 Markdown 结构。</p>
        </div>
        <button onClick={newArticle} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-black text-white"><Plus size={14} /> 新建文章</button>
      </header>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-2">
          {loading ? <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="animate-spin" size={16} /> 加载中</div> : null}
          {items.map((article) => (
            <button key={article.id} onClick={() => editArticle(article)} className={`w-full rounded-2xl border p-4 text-left transition ${current?.id === article.id ? "border-indigo-400/50 bg-indigo-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
              <div className="flex items-start justify-between gap-2">
                <strong className="line-clamp-2 text-sm text-white">{article.title}</strong>
                <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-[9px] font-black text-slate-300">{article.status}</span>
              </div>
              <div className="mt-2 text-[10px] text-slate-500">{article.category || "文章"} · {article.updatedAt ? new Date(article.updatedAt).toLocaleDateString("zh-CN") : ""}</div>
            </button>
          ))}
          {!loading && items.length === 0 && <div className="rounded-2xl bg-white/5 p-5 text-sm text-slate-400">还没有文章。</div>}
        </aside>

        <section className="space-y-4">
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-3">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">副标题
              <input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} className="admin-input mt-2" placeholder="可选" />
            </label>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">分类
              <input value={category} onChange={(event) => setCategory(event.target.value)} className="admin-input mt-2" />
            </label>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">标签
              <input value={tags} onChange={(event) => setTags(event.target.value)} className="admin-input mt-2" placeholder="用逗号分隔" />
            </label>
            <div className="md:col-span-2">
              <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">封面</span>
              <div className="mt-2 flex items-center gap-3">
                {cover ? <img src={cover} alt="" className="h-16 w-24 rounded-xl object-cover" /> : <div className="flex h-16 w-24 items-center justify-center rounded-xl bg-white/10 text-slate-500"><BookOpen size={18} /></div>}
                <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="block w-full max-w-[220px] cursor-pointer rounded-xl border border-white/10 bg-white/5 p-2 text-[10px] text-slate-400 file:mr-2 file:rounded-lg file:border-0 file:bg-white/10 file:px-2.5 file:py-1.5 file:text-[10px] file:font-bold file:text-slate-200" onChange={(event) => void uploadImage(event.target.files?.[0], "cover")} />
              </div>
            </div>
            <div className="block text-[10px] font-black uppercase tracking-widest text-slate-400">状态
              <div className="mt-2">
                <Select
                  value={status}
                  onChange={setStatus}
                  ariaLabel="文章状态"
                  options={[
                    { value: "DRAFT", label: "草稿" },
                    { value: "PUBLISHED", label: "发布" },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            <RichTextEditor
              ref={editorRef}
              title={title}
              setTitle={setTitle}
              initialContent={current?.contentHtml || ""}
              contentType="html"
              summary={summary}
              setSummary={setSummary}
              onOpenImageTool={() => setImagePanelOpen(true)}
              onChange={() => undefined}
            />
            {imagePanelOpen && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onClick={() => setImagePanelOpen(false)}>
                <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-slate-900 p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                  <h3 className="text-lg font-black text-white">插入图片</h3>
                  <p className="mt-1 text-xs text-slate-400">支持 JPG / PNG / WebP，单张不超过 10MB。</p>
                  <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="mt-5 block w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500 file:px-4 file:py-2.5 file:text-xs file:font-black file:text-white" onChange={(event) => void uploadImage(event.target.files?.[0], "inline")} />
                  <button onClick={() => setImagePanelOpen(false)} className="mt-3 w-full rounded-xl bg-white/10 px-4 py-2.5 text-xs font-black text-slate-300">取消</button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => void save()} disabled={saving || uploading} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 保存文章
            </button>
            {current && <button onClick={() => void remove()} className="inline-flex items-center gap-2 rounded-xl bg-red-500/15 px-4 py-2.5 text-xs font-black text-red-300"><Trash2 size={14} /> 删除</button>}
          </div>
        </section>
      </div>
    </div>
  );
}
