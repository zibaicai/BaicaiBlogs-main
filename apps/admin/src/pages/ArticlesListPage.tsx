"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { api } from "../lib/api";
import { useToast } from "../components/ToastProvider";

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
    <section className="mx-auto max-w-7xl px-4 py-6 md:px-0">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">文章管理</h1>
          <p className="mt-1 text-xs text-slate-400">独立富文本文章 · 共 {items.length} 篇</p>
        </div>
        <Link to="/articles/new" className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-black text-white">
          <Plus size={14} /> 新建文章
        </Link>
      </header>

      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索标题、分类或标签"
            className="admin-input pl-9"
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-white/5 p-1">
          {[
            ["ALL", "全部"],
            ["DRAFT", "草稿"],
            ["PUBLISHED", "已发布"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition ${status === value ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => void load()} className="rounded-xl border border-white/10 px-3 py-2 text-[10px] font-bold text-slate-300 hover:bg-white/5">
          刷新
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
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
                    <button type="button" onClick={() => navigate(`/articles/${article.id}/edit`)} className="block max-w-full truncate text-left font-bold text-white hover:text-indigo-300">
                      {article.title}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${article.status === "PUBLISHED" ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>
                      {article.status === "PUBLISHED" ? "已发布" : "草稿"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{article.category || "未分类"}</td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-slate-500">{(article.tags || []).join(" / ") || "—"}</td>
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
    </section>
  );
}
