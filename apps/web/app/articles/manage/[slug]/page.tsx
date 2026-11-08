import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "../../../../components/Navbar";
import PageTransition from "../../../../components/PageTransition";
import ReadingProse from "../../../../components/reading/ReadingProse";
import ReadingSurface from "../../../../components/reading/ReadingSurface";
import { getAdminArticleBySlug, getCurrentUser, getMyArticleBySlug, isAdminUser } from "../../../../lib/server-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "文章预览",
  robots: { index: false, follow: false },
};

export default async function ManagedArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) notFound();

  const { slug } = await params;
  const article = isAdminUser(user)
    ? await getAdminArticleBySlug(decodeURIComponent(slug))
    : await getMyArticleBySlug(decodeURIComponent(slug));
  if (!article) notFound();

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell articles-shell">
          <div className="mx-auto max-w-[1112px] py-10">
            <Link href="/articles/manage" className="text-sm font-bold text-indigo-500 hover:underline">
              ← 返回文章目录
            </Link>

            <article className="mt-5 rounded-[2rem] border border-white/30 bg-white/60 p-6 glass-blur glass-blur--xl dark:border-white/10 dark:bg-slate-800/60 md:p-10">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-meta font-bold text-slate-400">
                <span>{article.status === "DRAFT" ? "草稿" : "文章"}</span>
                <span>·</span>
                <span>{article.visibility === "PRIVATE" ? "仅管理员" : "公开"}</span>
                <span>·</span>
                <span>{article.sourcePlatform || "站内"}</span>
              </div>

              {article.cover && (
                <img
                  src={article.cover}
                  alt={article.title}
                  className="mx-auto mb-8 block h-auto max-h-[70vh] w-auto max-w-full object-contain"
                />
              )}
              <h1 className="detail-title text-slate-900 dark:text-white">{article.title}</h1>
              {article.subtitle && <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">{article.subtitle}</p>}
              <ReadingSurface
                variant="article"
                mode="classic"
                scheme="auto"
                resolvedScheme="light"
              >
                <ReadingProse
                  className="markdown-body mt-8"
                  html={article.contentHtml || ""}
                />
              </ReadingSurface>
            </article>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
