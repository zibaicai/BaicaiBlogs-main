"use client";

import Link from "next/link";
import Navbar from "../Navbar";
import PageTransition from "../PageTransition";
import DirectoryExplorer from "../DirectoryExplorer";
import ArticleCard from "../ArticleCard";
import type { Article, Category } from "../../lib/api";

type ArticleDirectoryProps = {
  articles: Article[];
  categories: Category[];
  mode: "public" | "manage";
};

export default function ArticleDirectory({ articles, categories, mode }: ArticleDirectoryProps) {
  const manage = mode === "manage";
  const roots = categories.filter((category) => category.depth === 1);
  const rootByArticle = (article: Article) =>
    roots.find((root) =>
      article.categoryId === root.id ||
      (article.categoryPath || article.category || "") === root.path ||
      (article.categoryPath || "").startsWith(`${root.path}/`)
    );

  const filters = [
    { value: "all", label: manage ? "全部文章" : "全部文章", count: articles.length },
    ...(manage
      ? [
          {
            value: "status-DRAFT",
            label: "草稿",
            count: articles.filter((article) => article.status === "DRAFT").length,
          },
          {
            value: "status-PENDING_REVIEW",
            label: "待审核",
            count: articles.filter((article) => article.status === "PENDING_REVIEW").length,
          },
          {
            value: "status-REJECTED",
            label: "已驳回",
            count: articles.filter((article) => article.status === "REJECTED").length,
          },
          {
            value: "visibility-PRIVATE",
            label: "仅管理员",
            count: articles.filter((article) => article.visibility === "PRIVATE").length,
          },
          {
            value: "source-WECHAT",
            label: "公众号",
            count: articles.filter((article) => article.sourcePlatform === "WECHAT").length,
          },
        ].filter((filter) => filter.count > 0)
      : []),
    ...roots
      .map((root) => ({
        value: `category-${root.id}`,
        label: root.path,
        count: articles.filter((article) => rootByArticle(article)?.id === root.id).length,
      }))
      .filter((filter) => filter.count > 0),
  ];

  const directoryItems = articles.map((article) => {
    const root = rootByArticle(article);
    const filterValues = root ? [`category-${root.id}`] : [];
    if (manage) {
      filterValues.push(`status-${article.status}`, `visibility-${article.visibility}`);
      if (article.sourcePlatform) filterValues.push(`source-${article.sourcePlatform}`);
    }
    return {
      key: `${article.id}-${article.slug}`,
      node: (
        <ArticleCard
          key={article.slug}
          article={article}
          hrefBase={manage ? "/articles/manage" : "/articles"}
          showStatus={manage}
        />
      ),
      searchText: [article.title, article.summary, article.categoryPath, ...(article.tags || [])].join(" "),
      filterValues,
      title: article.title,
      tags: article.tags,
      date: article.publishedAt,
      updatedAt: article.updatedAt,
    };
  });

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell articles-shell">
          <DirectoryExplorer
            eyebrow={manage ? "BAICAI / ADMIN" : "BAICAI / FEATURES"}
            title={manage ? "文章管理" : "文章"}
            subtitle={manage ? "公开、私有、草稿与公众号导入文章。" : "长文、专栏与更完整的表达。"}
            count={`共 ${articles.length} 篇文章`}
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
            empty={manage ? "还没有文章。" : "还没有发布文章。"}
            toolbarExtra={
              manage ? (
                <Link
                  href="/articles?view=public"
                  className="inline-flex h-9 items-center rounded-full border border-slate-200/70 bg-white/60 px-3 text-xs font-bold text-slate-600 transition hover:text-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                >
                  查看公开视图
                </Link>
              ) : undefined
            }
          />
        </main>
      </PageTransition>
    </div>
  );
}
