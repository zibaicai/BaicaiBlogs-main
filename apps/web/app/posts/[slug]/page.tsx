import Link from "next/link";
import { Download } from "lucide-react";
import Navbar from "../../../components/Navbar";
import PageTransition from "../../../components/PageTransition";
import AuthorCard from "../../../components/AuthorCard";
import SidebarLyric from "../../../components/SidebarLyric";
import { formatDate, formatDay } from "../../../lib/api";
import { getPost, getPosts } from "../../../lib/server-api";
import { DEFAULT_BACKGROUND } from "../../../lib/site-config";

export const dynamic = "force-dynamic";

export default async function PostDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, allPosts] = await Promise.all([getPost(slug), getPosts()]);

  if (!post) {
    return (
      <div className="min-h-screen relative pb-20">
        <Navbar />
        <PageTransition>
          <main className="w-full max-w-3xl mx-auto mt-32 px-6 relative z-10 text-center">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4">
              文章不存在或未公开
            </h1>
            <Link href="/posts" className="text-indigo-500 font-bold hover:underline">
              ← 返回文章列表
            </Link>
          </main>
        </PageTransition>
      </div>
    );
  }

  const recentPosts = allPosts.filter((p) => p.slug !== slug).slice(0, 3);
  const cover = post.cover || DEFAULT_BACKGROUND.defaultPostCover;

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-[95%] md:w-[90%] max-w-6xl mx-auto mt-24 md:mt-28 flex flex-col lg:flex-row gap-6 md:gap-8 relative z-10">
          <article className="flex-1 bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden transition-colors duration-700">
            <div className="w-full aspect-video bg-slate-200 dark:bg-slate-700 relative group">
              <img
                src={cover}
                alt={post.title}
                className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105"
              />
            </div>

            <div className="p-5 md:p-12 relative">
              <Link
                href="/posts"
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-500 transition-colors mb-6"
              >
                ← 返回列表
              </Link>

              <header className="mb-6 md:mb-8 border-b border-slate-300/50 dark:border-slate-700 pb-5 md:pb-6 relative">
                <h1 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight transition-colors duration-700 pr-16 md:pr-24 leading-snug">
                  {post.title}
                </h1>

                {post.fileUrl && (
                  <a
                    href={post.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-0 right-0 p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2"
                    title="下载原始 Markdown 文件"
                  >
                    <Download size={18} />
                    <span className="text-xs md:text-sm font-bold hidden md:inline-block">原文件</span>
                  </a>
                )}

                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <div className="flex items-center gap-1.5 md:gap-2 text-indigo-700 dark:text-indigo-400 font-bold bg-white/30 dark:bg-slate-900/50 px-3 md:px-4 py-1.5 md:py-2 rounded-full w-max text-xs md:text-sm shadow-sm border border-white/20 dark:border-white/5">
                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    写作时间：{formatDate(post.date)}
                  </div>

                  {(post.tags || []).map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-1 text-pink-600 dark:text-pink-400 font-bold bg-white/30 dark:bg-slate-900/50 px-2.5 md:px-3 py-1.5 md:py-2 rounded-full text-xs md:text-sm shadow-sm border border-white/20 dark:border-white/5"
                    >
                      <span className="text-[10px] md:text-xs opacity-70">#</span> {tag}
                    </div>
                  ))}
                </div>
              </header>

              <div
                className="article-prose prose prose-slate dark:prose-invert prose-base md:prose-lg max-w-none text-slate-800 dark:text-slate-200 transition-colors duration-700 scroll-smooth"
                dangerouslySetInnerHTML={{ __html: post.htmlContent || "" }}
              />
            </div>
          </article>

          <aside className="w-full lg:w-[320px] flex flex-col gap-6 flex-shrink-0">
            <AuthorCard />

            <SidebarLyric />

            <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-xl">
              <h3 className="font-black text-slate-900 dark:text-white mb-4 border-l-4 border-indigo-500 pl-2 text-sm">
                RECOMMENDED
              </h3>
              <div className="space-y-4">
                {recentPosts.map((p) => (
                  <Link key={p.slug} href={`/posts/${encodeURIComponent(p.slug)}`} className="group block">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {p.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-bold uppercase">
                      {formatDay(p.date)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </main>
      </PageTransition>
    </div>
  );
}
