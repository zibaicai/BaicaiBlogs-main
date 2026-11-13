"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Plus, Search, Trash2 } from "lucide-react";

import { api, getAdminRole } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { AdminPageHeader, AdminPageShell, FilterTabs, StatusBadge } from "../components/admin/AdminUI";
import { DataTable } from "../components/admin/DataTable";

type Article = {
  id: number;
  title: string;
  category?: string;
  tags?: string[];
  summary?: string;
  status: string;
  visibility?: string;
  slug: string;
  publishedAt?: string;
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
  const isAdmin = getAdminRole() === "ADMIN" || getAdminRole() === "SUPER_ADMIN";

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

  const approve = async (article: Article) => {
    try {
      await api.approveArticle(article.id);
      showToast("已通过审核", "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "审核失败", "error");
    }
  };

  const reject = async (article: Article) => {
    const reason = window.prompt("驳回原因");
    if (!reason) return;
    try {
      await api.rejectArticle(article.id, reason);
      showToast("已驳回", "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "驳回失败", "error");
    }
  };

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="文章管理"
        description={`独立富文本文章 · 共 ${items.length} 篇`}
        breadcrumbs={[{ label: "内容" }, { label: "文章" }]}
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
            { value: "PENDING_REVIEW", label: "待审核", count: items.filter((item) => item.status === "PENDING_REVIEW").length },
            { value: "REJECTED", label: "已驳回", count: items.filter((item) => item.status === "REJECTED").length },
            { value: "PUBLISHED", label: "已发布", count: items.filter((item) => item.status === "PUBLISHED").length },
          ]}
        />
        <button type="button" onClick={() => void load()} className="rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-white/5">刷新</button>
      </div>

      <DataTable
        rows={filtered}
        loading={loading}
        rowKey={(article) => article.id}
        empty="没有符合条件的文章。"
        onRowClick={(article) => navigate(`/articles/${article.id}`)}
        columns={[
          {
            key: "title",
            header: "标题",
            cell: (article) => (
              <button type="button" onClick={() => navigate(`/articles/${article.id}`)} className="block min-w-0 max-w-[320px] text-left">
                <p className="truncate text-[12px] font-bold text-white hover:text-indigo-300">{article.title}</p>
                <p className="mt-0.5 truncate font-mono text-[9px] text-slate-600">{article.slug}</p>
              </button>
            ),
          },
          {
            key: "status",
            header: "状态",
            cell: (article) => (
              <div className="flex items-center gap-1.5">
                <StatusBadge status={article.status} />
                <span className="whitespace-nowrap text-[9px] font-bold text-slate-500">
                  {article.visibility === "PRIVATE" ? "私有" : "公开"}
                </span>
              </div>
            ),
          },
          {
            key: "summary",
            header: "简介",
            className: "max-w-[280px]",
            cell: (article) => <p className="line-clamp-2 text-[10px] leading-5 text-slate-500">{article.summary || "暂无摘要"}</p>,
          },
          {
            key: "updatedAt",
            header: "更新时间",
            cell: (article) => <span className="whitespace-nowrap text-[10px] text-slate-500">{article.updatedAt ? new Date(article.updatedAt).toLocaleString("zh-CN", { dateStyle: "short", timeStyle: "short" }) : "—"}</span>,
          },
          {
            key: "action",
            header: "操作",
            className: "text-right",
            cell: (article) => (
              <div className="flex justify-end gap-1">
                {isAdmin && article.status === "PENDING_REVIEW" && (
                  <>
                    <button type="button" onClick={() => void approve(article)} className="rounded-md bg-emerald-500/15 px-2 py-1 text-[9px] font-bold text-emerald-300 hover:bg-emerald-500/25">通过</button>
                    <button type="button" onClick={() => void reject(article)} className="rounded-md bg-red-500/15 px-2 py-1 text-[9px] font-bold text-red-300 hover:bg-red-500/25">驳回</button>
                  </>
                )}
                <Link to={`/articles/${article.id}/edit`} className="rounded-md bg-indigo-500/10 px-2 py-1 text-[9px] font-bold text-indigo-300 hover:bg-indigo-500 hover:text-white">编辑</Link>
                <button type="button" onClick={() => article.status === "PUBLISHED" && article.visibility === "PUBLIC" ? window.open(`https://www.zibaicai.cn/articles/${article.slug}`, "_blank") : navigate(`/articles/${article.id}`)} title={article.status === "PUBLISHED" && article.visibility === "PUBLIC" ? "C 端预览" : "后台预览"} className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"><Eye size={13} /></button>
                <button type="button" onClick={() => void remove(article)} title="删除" className="rounded-md p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={13} /></button>
              </div>
            ),
          },
        ]}
      />
    </AdminPageShell>
  );
}
