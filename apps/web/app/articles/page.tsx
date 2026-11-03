"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import DirectoryExplorer from "../../components/DirectoryExplorer";
import ArticleCard from "../../components/ArticleCard";
import { articleApi, type Article, type Category } from "../../lib/api";
import { useAuth } from "../../lib/auth";

export default function ArticlesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryReady, setQueryReady] = useState(false);
  const [forcePublic, setForcePublic] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  useEffect(() => {
    setForcePublic(new URLSearchParams(window.location.search).get("view") === "public");
    setQueryReady(true);
  }, []);

  useEffect(() => {
    if (!queryReady || authLoading) return;
    if (!isAdmin || forcePublic) {
      setRedirecting(false);
      return;
    }
    setRedirecting(true);
    const timer = window.setTimeout(() => router.replace("/articles/manage"), 500);
    return () => window.clearTimeout(timer);
  }, [authLoading, forcePublic, isAdmin, queryReady, router]);

  useEffect(() => {
    if (authLoading || !queryReady || (isAdmin && !forcePublic)) return;
    Promise.all([articleApi.list(), articleApi.categories()])
      .then(([articles, categoryList]) => {
        setItems(articles);
        setCategories(categoryList);
      })
      .catch(() => {
        setItems([]);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, [authLoading, forcePublic, isAdmin, queryReady]);

  const roots = categories.filter((category) => category.depth === 1);
  const rootByArticle = (article: Article) =>
    roots.find((root) =>
      article.categoryId === root.id ||
      (article.categoryPath || article.category || "") === root.path ||
      (article.categoryPath || "").startsWith(`${root.path}/`)
    );

  const filters = [
    { value: "all", label: "全部文章", count: items.length },
    ...roots
      .map((root) => ({
        value: `category-${root.id}`,
        label: root.path,
        count: items.filter((article) => rootByArticle(article)?.id === root.id).length,
      }))
      .filter((filter) => filter.count > 0),
  ];

  const directoryItems = items.map((article) => {
    const root = rootByArticle(article);
    return {
      key: article.slug,
      node: <ArticleCard key={article.slug} article={article} />,
      searchText: [article.title, article.summary, article.categoryPath, ...(article.tags || [])].join(" "),
      filterValues: root ? [`category-${root.id}`] : [],
      title: article.title,
      tags: article.tags,
      date: article.publishedAt,
      updatedAt: article.updatedAt,
    };
  });

  if (authLoading || !queryReady) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
        <Loader2 className="mr-2 animate-spin" size={16} /> 正在确认访问权限…
      </div>
    );
  }

  if (redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="rounded-2xl border border-white/40 bg-white/60 px-6 py-5 text-center shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/60">
          <Loader2 className="mx-auto animate-spin text-indigo-500" size={18} />
          <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100">管理员身份已确认</p>
          <p className="mt-1 text-xs text-slate-400">正在进入文章管理目录…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell articles-shell">
          {loading ? (
            <div className="py-24 text-center text-slate-400">加载中…</div>
          ) : (
            <DirectoryExplorer
              eyebrow="BAICAI / FEATURES"
              title="文章"
              subtitle="长文、专栏与更完整的表达。"
              count={`共 ${items.length} 篇文章`}
              items={directoryItems}
              filters={filters}
              views={["grid", "timeline", "masonry"]}
              featuredFirst
              compact
              gridVariant="cover"
              columns={{ base: 1, sm: 2, lg: 3, xl: 4 }}
              pageSize={12}
              defaultSort="newest"
              searchPlaceholder="搜索标题、摘要、分类或标签..."
              empty="还没有发布文章。"
            />
          )}
        </main>
      </PageTransition>
    </div>
  );
}
