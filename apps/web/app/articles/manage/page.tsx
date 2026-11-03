import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "../../../components/Navbar";
import PageTransition from "../../../components/PageTransition";
import { getAdminArticles, getCurrentUser, isAdminUser } from "../../../lib/server-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "文章管理预览",
  robots: { index: false, follow: false },
};

export default async function ManagedArticlesPage() {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) notFound();

  const articles = await getAdminArticles();
  const published = articles.filter((article) => article.status === "PUBLISHED" && article.visibility === "PUBLIC");
  const privateOrDraft = articles.filter((article) => !(article.status === "PUBLISHED" && article.visibility === "PUBLIC"));

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell articles-shell">
          <div className="mx-auto max-w-[1112px] py-10">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-meta font-black uppercase tracking-[0.2em] text-indigo-500">ADMIN PREVIEW</p>
                <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">文章目录</h1>
                <p className="mt-1 text-sm text-slate-500">当前账户可查看公开、私有与草稿文章。</p>
              </div>
              <Link href="/articles?view=public" className="rounded-full border border-slate-200/80 bg-white/60 px-4 py-2 text-sm font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                查看公开视图
              </Link>
            </div>

            <section className="rounded-3xl border border-white/40 bg-white/60 p-5 shadow-xl glass-blur glass-blur--xl dark:border-white/10 dark:bg-slate-800/50">
              <h2 className="text-sm font-black text-slate-900 dark:text-white">非公开 / 草稿 · {privateOrDraft.length}</h2>
              <div className="mt-3 divide-y divide-slate-200/60 dark:divide-white/10">
                {privateOrDraft.length === 0 ? (
                  <p className="py-5 text-sm text-slate-400">暂无私有或草稿文章。</p>
                ) : privateOrDraft.map((article) => (
                  <Link key={article.id} href={`/articles/manage/${encodeURIComponent(article.slug)}`} className="flex flex-wrap items-center gap-2 py-3 text-sm transition hover:text-indigo-500">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{article.title}</span>
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-meta font-bold text-amber-600 dark:text-amber-300">{article.status === "DRAFT" ? "草稿" : "私有"}</span>
                    <span className="ml-auto text-meta text-slate-400">{article.sourcePlatform || "站内"}</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-5 rounded-3xl border border-white/40 bg-white/60 p-5 shadow-xl glass-blur glass-blur--xl dark:border-white/10 dark:bg-slate-800/50">
              <h2 className="text-sm font-black text-slate-900 dark:text-white">已公开 · {published.length}</h2>
              <div className="mt-3 divide-y divide-slate-200/60 dark:divide-white/10">
                {published.map((article) => (
                  <Link key={article.id} href={`/articles/manage/${encodeURIComponent(article.slug)}`} className="flex flex-wrap items-center gap-2 py-3 text-sm transition hover:text-indigo-500">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{article.title}</span>
                    <span className="ml-auto text-meta text-slate-400">{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("zh-CN") : "—"}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
