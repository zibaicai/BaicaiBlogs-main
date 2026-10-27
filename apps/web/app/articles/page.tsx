"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import DirectoryExplorer from "../../components/DirectoryExplorer";
import ArticleCard from "../../components/ArticleCard";
import { articleApi, type Article, type Category } from "../../lib/api";

export default function ArticlesPage() {
  const [items, setItems] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

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
    };
  });

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
              gridClassName="cover-grid"
              pageSize={12}
              searchPlaceholder="搜索标题、摘要、分类或标签..."
              empty="还没有发布文章。"
            />
          )}
        </main>
      </PageTransition>
    </div>
  );
}
