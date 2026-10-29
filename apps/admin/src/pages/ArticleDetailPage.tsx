"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Loader2, Pencil, Trash2 } from "lucide-react";

import { api } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { AdminPageHeader, AdminPageShell, StatusBadge, TagBadge } from "../components/admin/AdminUI";

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
  slug: string;
  publishedAt?: string;
  updatedAt?: string;
};

export default function ArticleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminArticle(Number(id))
      .then((response) => setArticle(response.data as Article))
      .catch((error) => {
        showToast(error instanceof Error ? error.message : "加载失败", "error");
        navigate("/articles", { replace: true });
      })
      .finally(() => setLoading(false));
  }, [id, navigate, showToast]);

  const remove = async () => {
    if (!article || !window.confirm(`确定删除《${article.title}》吗？`)) return;
    try {
      await api.deleteArticle(article.id);
      showToast("文章已删除", "success");
      navigate("/articles", { replace: true });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "删除失败", "error");
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-indigo-400" /></div>;
  if (!article) return null;

  return (
    <AdminPageShell>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/articles" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-white"><ArrowLeft size={14} /> 返回文章列表</Link>
        <div className="flex items-center gap-2">
          <a href={`https://www.zibaicai.cn/articles/${article.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-white/5"><Eye size={13} /> 预览</a>
          <Link to={`/articles/${article.id}/edit`} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-[10px] font-bold text-white"><Pencil size={13} /> 编辑</Link>
          <button type="button" onClick={() => void remove()} className="rounded-lg p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={14} /></button>
        </div>
      </div>

      <AdminPageHeader
        title={article.title}
        description={article.subtitle || article.summary || "—"}
        actions={<StatusBadge status={article.status} />}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <article className="rounded-xl border border-white/10 bg-white/[0.03] p-5 md:p-7">
          {article.cover && <img src={article.cover} alt="" className="mb-5 max-h-72 w-full rounded-lg object-cover" />}
          <div className="admin-article-reader" dangerouslySetInnerHTML={{ __html: article.contentHtml || "" }} />
        </article>

        <aside className="h-fit space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">分类</p>
            <p className="mt-1 text-[11px] text-slate-300">{article.category || "未分类"}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">标签</p>
            <div className="mt-1 flex flex-wrap gap-1">{(article.tags || []).length ? article.tags!.map((tag) => <TagBadge key={tag}>{tag}</TagBadge>) : <span className="text-[11px] text-slate-600">—</span>}</div>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">发布时间</p>
            <p className="mt-1 text-[11px] text-slate-400">{article.publishedAt ? new Date(article.publishedAt).toLocaleString("zh-CN", { dateStyle: "short", timeStyle: "short" }) : "未发布"}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">更新时间</p>
            <p className="mt-1 text-[11px] text-slate-400">{article.updatedAt ? new Date(article.updatedAt).toLocaleString("zh-CN", { dateStyle: "short", timeStyle: "short" }) : "—"}</p>
          </div>
        </aside>
      </div>
    </AdminPageShell>
  );
}
