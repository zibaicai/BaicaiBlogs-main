import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "../../../../components/Navbar";
import PageTransition from "../../../../components/PageTransition";
import BackButton from "../../../../components/BackButton";
import AuthorCard from "../../../../components/AuthorCard";
import ArticleToc from "../../../../components/ArticleToc";
import RecommendedCard from "../../../../components/RecommendedCard";
import MarkdownReader from "../../../../components/MarkdownReader";
import { ReadingProvider } from "../../../../components/reading/ReadingContext";
import { formatDate, formatDay } from "../../../../lib/api";
import { DEFAULT_BACKGROUND } from "../../../../lib/site-config";
import {
  getAdminArticles,
  getCurrentUser,
  getMyArticles,
  isAdminUser,
} from "../../../../lib/server-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "文章预览",
  robots: { index: false, follow: false },
};

export default async function ManagedArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) notFound();

  const { slug: rawSlug } = await params;
  let slug = rawSlug;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    // keep raw slug
  }

  const admin = isAdminUser(user);
  const allArticles = admin ? await getAdminArticles() : await getMyArticles();
  const article = allArticles.find((item) => item.slug === slug);
  if (!article) notFound();

  const recentArticles = allArticles
    .filter((item) => item.id !== article.id)
    .slice(0, 4);
  const cover = article.cover || DEFAULT_BACKGROUND.defaultPostCover;
  const publishedAt = article.publishedAt || article.createdAt;

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <ReadingProvider>
          <main className="article-reading-grid w-[95%] max-w-7xl mx-auto mt-24 md:mt-28 relative z-10">
            <div className="article-left-top">
              <div className="article-back-slot">
                <BackButton fallbackHref="/articles/manage" />
              </div>
              <div className="article-card-slot article-card-author">
                <AuthorCard />
              </div>
              <div className="article-card-slot article-card-recommended">
                <RecommendedCard
                  items={recentArticles.map((item) => ({
                    title: item.title,
                    href: `/articles/manage/${encodeURIComponent(item.slug)}`,
                    date: formatDay(item.publishedAt || item.createdAt || ""),
                  }))}
                />
              </div>
            </div>

            <div className="article-cover">
              <img src={cover} alt={article.title} />
            </div>

            <aside className="article-left-bottom">
              <ArticleToc />
            </aside>

            <article className="article-content bg-white/60 dark:bg-slate-800/50 glass-blur glass-blur--xl rounded-b-3xl shadow-2xl border border-t-0 border-white/40 dark:border-white/10 overflow-hidden transition-colors duration-700">
              <div className="relative">
                <div className="article-header relative">
                  <header className="border-b border-slate-300/50 dark:border-slate-700 pb-5 md:pb-6 relative">
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-meta font-bold text-slate-400">
                      <span>{article.status === "DRAFT" ? "草稿" : article.status === "PENDING_REVIEW" ? "待审核" : article.status === "REJECTED" ? "已驳回" : "文章"}</span>
                      <span>·</span>
                      <span>{article.visibility === "PRIVATE" ? "仅自己" : "公开"}</span>
                      <span>·</span>
                      <span>{article.sourcePlatform || "站内"}</span>
                    </div>
                    <h1 className="detail-title mb-3 text-slate-900 transition-colors duration-700 dark:text-white">
                      {article.title}
                    </h1>

                    {(article.subtitle || article.summary) && (
                      <p className="article-summary text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                        {article.subtitle || article.summary}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      {publishedAt && (
                        <div className="flex items-center gap-1.5 md:gap-2 text-indigo-700 dark:text-indigo-400 font-bold bg-white/30 dark:bg-slate-900/50 px-3 md:px-4 py-1.5 md:py-2 rounded-full w-max text-xs md:text-sm shadow-sm border border-white/20 dark:border-white/5">
                          写作时间：{formatDate(publishedAt)}
                        </div>
                      )}

                      {(article.tags || []).map((tag) => (
                        <div
                          key={tag}
                          className="flex items-center gap-1 text-[var(--ui-accent-strong)] dark:text-[var(--ui-accent)] font-bold bg-[var(--ui-accent-soft)] px-2.5 md:px-3 py-1.5 md:py-2 rounded-full text-xs md:text-sm shadow-sm border border-white/20 dark:border-white/5"
                        >
                          <span className="text-meta md:text-xs opacity-70">#</span> {tag}
                        </div>
                      ))}

                      <Link
                        href={`/articles/${encodeURIComponent(article.slug)}`}
                        className="btn btn-secondary ml-auto shrink-0 p-2.5 md:px-3 md:py-2 rounded-xl md:rounded-2xl transition-all shadow-sm border flex items-center gap-2"
                      >
                        <span className="text-xs md:text-sm font-bold">查看公开页</span>
                      </Link>
                    </div>
                  </header>
                </div>

                <MarkdownReader html={article.contentHtml || ""} />
              </div>
            </article>
          </main>
        </ReadingProvider>
      </PageTransition>
    </div>
  );
}
