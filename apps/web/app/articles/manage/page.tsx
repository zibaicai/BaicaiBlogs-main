import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleDirectory from "../../../components/articles/ArticleDirectory";
import { getAdminArticles, getCategories, getCurrentUser, getMyArticles, isAdminUser } from "../../../lib/server-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "文章管理",
  robots: { index: false, follow: false },
};

export default async function ManagedArticlesPage() {
  const user = await getCurrentUser();
  if (!user) notFound();

  const [articles, categories] = await Promise.all([
    isAdminUser(user) ? getAdminArticles() : getMyArticles(),
    getCategories(),
  ]);

  return <ArticleDirectory articles={articles} categories={categories} mode="manage" />;
}
