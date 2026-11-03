import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleDirectory from "../../../components/articles/ArticleDirectory";
import { getAdminArticles, getCategories, getCurrentUser, isAdminUser } from "../../../lib/server-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "文章管理",
  robots: { index: false, follow: false },
};

export default async function ManagedArticlesPage() {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) notFound();

  const [articles, categories] = await Promise.all([getAdminArticles(), getCategories()]);

  return <ArticleDirectory articles={articles} categories={categories} mode="manage" />;
}
