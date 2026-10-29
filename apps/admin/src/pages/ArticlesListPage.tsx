"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { api } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { AdminPageHeader, AdminPageShell, FilterTabs, StatusBadge, TagBadge } from "../components/admin/AdminUI";

type Article = {
  id: number;
  title: string;
  category?: string;
  tags?: string[];
  status: string;
  slug: string;
  updatedAt?: string;
  words?: number;
};

export default function ArticlesListPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");

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

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((item) => {
      if (status !== "ALL" && item.status !== status) return false;
      if (!keyword) return true;
      return [item.title, item.category, ...(item.tags || [])].join(" ").toLowerCase().includes(keyword);
    });
  }, [items, query, status]);

  const remove = async (article: Article) => {
    if (!window.confirm(`确定删除《${article.title}》吗？`)) return;
    try {
      await api.deleteArticle(article.id);
      setItems((current) => current.filter((item) => item.id !== article.id));
      showToast("文章已删除", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "删除失败", "error");
    }
  };

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="文章管理"
        description={`独立富文本文章 · 共 ${items.length} 篇`}
        actions={<Link to="/articles/new" className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-[11px] font-bold text-white"><Plus size={14} /> 新建文章</Link>}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题、分类或标签" className="admin-input pl-9" />
        </div>
        <FilterTabs
          value={status}
          onChange={setStatus}
          options={[
            { value: "ALL", label: "全部", count: items.length },
            { value: "DRAFT", label: "草稿", count: items.filter((item) => item.status === "DRAFT").length },
            { value: "PUBLISHED", label: "已发布", count: items.filter((item) => item.status === "PUBLISHED").length },
          ]}
        />
        <button type="button" onClick={() => void load()} className="rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-white/5">刷新</button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="bg-white/[0.04] text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 font-bold">标题</th>
                <th className="px-4 py-3 font-bold">状态</th>
                <th className="px-4 py-3 font-bold">分类</th>
                <th className="px-4 py-3 font-bold">标签</th>
                <th className="px-4 py-3 font-bold">更新时间</th>
                <th className="px-4 py-3 text-right font-bold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-sm text-slate-500"><Loader2 size={18} className="mx-auto animate-spin" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-sm text-slate-500">没有符合条件的文章。</td></tr>
              ) : filtered.map((article) => (
                <tr key={article.id} className="group text-xs text-slate-300 hover:bg-white/[0.03]">
                  <td className="max-w-[320px] px-4 py-3">
                    <button type="button" onClick={() => navigate(`/articles/${article.id}`)} className="block max-w-full truncate text-left text-[12px] font-bold text-white hover:text-indigo-300">
                      {article.title}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={article.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-400">{article.category || "未分类"}</td>
                  <td className="max-w-[180px] px-4 py-3">
                    <div className="flex flex-wrap gap-1">{(article.tags || []).slice(0, 3).map((tag) => <TagBadge key={tag}>{tag}</TagBadge>)}{!(article.tags || []).length && <span className="text-slate-600">—</span>}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{article.updatedAt ? new Date(article.updatedAt).toLocaleString("zh-CN", { dateStyle: "short", timeStyle: "short" }) : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => navigate(`/articles/${article.id}/edit`)} title="编辑" className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><Pencil size={14} /></button>
                      <button type="button" onClick={() => window.open(`https://www.zibaicai.cn/articles/${article.slug}`, "_blank")} title="预览" className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><Eye size={14} /></button>
                      <button type="button" onClick={() => void remove(article)} title="删除" className="rounded-lg p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageShell>
  );
}
