"use client";

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Eye, Loader2, Save, Trash2 } from "lucide-react";

import RichTextEditor, { type RichTextEditorHandle } from "../components/editor/RichTextEditor";
import { Select } from "../components/ui/Select";
import { api } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { AdminBreadcrumb, AdminPageShell } from "../components/admin/AdminUI";

type Category = { id: number; name: string; path: string };
type Article = {
  id: number;
  title: string;
  subtitle?: string;
  cover?: string;
  summary?: string;
  contentHtml: string;
  category?: string;
  tags?: string[];
  categoryId?: number;
  status: string;
  slug: string;
};

export default function ArticleEditorPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const editorRef = useRef<RichTextEditorHandle>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [current, setCurrent] = useState<Article | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [cover, setCover] = useState("");
  const [category, setCategory] = useState("文章");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePanelOpen, setImagePanelOpen] = useState(false);

  useEffect(() => {
    api.getCategories()
      .then((response) => setCategories(response.data || []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (isNew) {
      setCurrent(null);
      setTitle("");
      setSummary("");
      setSubtitle("");
      setCover("");
      setCategory("文章");
      setCategoryId("");
      setTags("");
      setStatus("DRAFT");
      setLoading(false);
      return;
    }
    setLoading(true);
    api.adminArticle(Number(id))
      .then((response) => {
        const article = response.data as Article;
        setCurrent(article);
        setTitle(article.title || "");
        setSummary(article.summary || "");
        setSubtitle(article.subtitle || "");
        setCover(article.cover || "");
        setCategory(article.category || "文章");
        setCategoryId(article.categoryId ? String(article.categoryId) : "");
        setTags((article.tags || []).join(", "));
        setStatus(article.status || "DRAFT");
      })
      .catch((error) => {
        showToast(error instanceof Error ? error.message : "加载失败", "error");
        navigate("/articles", { replace: true });
      })
      .finally(() => setLoading(false));
  }, [id, isNew, navigate, showToast]);

  const uploadImage = async (file: File | undefined, target: "inline" | "cover") => {
    if (!file) return;
    setUploading(true);
    try {
      const response = await api.uploadArticleImage(file);
      if (target === "inline") {
        editorRef.current?.insertImage(response.data);
        setImagePanelOpen(false);
      } else {
        setCover(response.data);
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
      categoryId: categoryId ? Number(categoryId) : null,
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
      if (!current && response.data?.id) {
        navigate(`/articles/${response.data.id}/edit`, { replace: true });
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "保存失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!current) return;
    if (!window.confirm("确定删除这篇文章吗？")) return;
    try {
      await api.deleteArticle(current.id);
      showToast("文章已删除", "success");
      navigate("/articles", { replace: true });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "删除失败", "error");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-indigo-400" /></div>;
  }

  return (
    <AdminPageShell>
      <AdminBreadcrumb items={[{ label: "文章管理", to: "/articles" }, { label: isNew ? "新建文章" : "编辑文章" }]} />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/articles" className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="返回文章列表"><ArrowLeft size={18} /></Link>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-white">{isNew ? "新建文章" : "编辑文章"}</h1>
            <p className="mt-0.5 text-[10px] text-slate-500">{isNew ? "保存后会进入编辑页，可继续完善正文" : current?.slug ? `/articles/${current.slug}` : "文章编辑"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {current?.slug && <a href={`https://www.zibaicai.cn/articles/${current.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-[10px] font-bold text-slate-300 hover:bg-white/5"><Eye size={13} /> 预览</a>}
          {current && <button type="button" onClick={() => void remove()} className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/15 px-3 py-2 text-[10px] font-bold text-red-300"><Trash2 size={13} /> 删除</button>}
          <button type="button" onClick={() => void save()} disabled={saving || uploading} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-[11px] font-black text-white disabled:opacity-50">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} 保存
          </button>
        </div>
      </header>

      <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-3">
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">副标题
          <input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} className="admin-input mt-2" placeholder="可选" />
        </label>
        <div className="block text-[10px] font-black uppercase tracking-widest text-slate-400">分类
          <div className="mt-2">
            <Select
              value={categoryId}
              onChange={(value) => {
                setCategoryId(value);
                setCategory(categories.find((item) => String(item.id) === value)?.name || "");
              }}
              ariaLabel="文章分类"
              placeholder="未分类"
              options={[{ value: "", label: "未分类" }, ...categories.map((item) => ({ value: String(item.id), label: item.path }))]}
            />
          </div>
        </div>
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
            <Select value={status} onChange={setStatus} ariaLabel="文章状态" options={[{ value: "DRAFT", label: "草稿" }, { value: "PUBLISHED", label: "发布" }]} />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <RichTextEditor
          key={current?.id ?? "new"}
          ref={editorRef}
          title={title}
          setTitle={setTitle}
          initialContent={current?.contentHtml || ""}
          contentType="html"
          plainImages
          summary={summary}
          setSummary={setSummary}
          onOpenImageTool={() => setImagePanelOpen(true)}
          onChange={() => undefined}
        />
      </div>

      {imagePanelOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onClick={() => setImagePanelOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-slate-900 p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-sm font-black text-white">插入图片</h3>
            <p className="mt-1 text-[10px] text-slate-400">支持 JPG / PNG / WebP，单张不超过 10MB。</p>
            <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="mt-4 block w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 p-2 text-[10px] text-slate-300 file:mr-2 file:rounded-lg file:border-0 file:bg-indigo-500 file:px-3 file:py-2 file:text-[10px] file:font-black file:text-white" onChange={(event) => void uploadImage(event.target.files?.[0], "inline")} />
            <button type="button" onClick={() => setImagePanelOpen(false)} className="mt-3 w-full rounded-xl bg-white/10 px-3 py-2 text-[10px] font-black text-slate-300">取消</button>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
