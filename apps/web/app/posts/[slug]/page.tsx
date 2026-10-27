import Link from "next/link";
import { Download } from "lucide-react";
import Navbar from "../../../components/Navbar";
import PageTransition from "../../../components/PageTransition";
import AuthorCard from "../../../components/AuthorCard";
import RecommendedCard from "../../../components/RecommendedCard";
import BackButton from "../../../components/BackButton";
import ArticleToc from "../../../components/ArticleToc";
import MarkdownReader from "../../../components/MarkdownReader";
import CommentSection from "../../../components/comments/CommentSection";
import { formatDate, formatDay } from "../../../lib/api";
import { getPost, getPosts } from "../../../lib/server-api";
import { DEFAULT_BACKGROUND } from "../../../lib/site-config";

export const dynamic = "force-dynamic";

export default async function PostDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  let slug = rawSlug;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    // keep raw slug
  }
  const [post, allPosts] = await Promise.all([getPost(slug), getPosts()]);

  if (!post) {
    return (
      <div className="min-h-screen relative pb-20">
        <Navbar />
        <PageTransition>
          <main className="w-full max-w-3xl mx-auto mt-32 px-6 relative z-10 text-center">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4">
              笔记不存在或未公开
            </h1>
            <Link href="/posts" className="text-indigo-500 font-bold hover:underline">
              ← 返回笔记列表
            </Link>
          </main>
        </PageTransition>
      </div>
    );
  }

  const recentPosts = allPosts.filter((p) => p.slug !== slug).slice(0, 4);
  const cover = post.cover || DEFAULT_BACKGROUND.defaultPostCover;

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="article-reading-grid w-[95%] max-w-7xl mx-auto mt-24 md:mt-28 relative z-10">
          <div className="article-left-top">
            <div className="article-card-slot article-card-author">
              <AuthorCard />
            </div>
            <div className="article-card-slot article-card-recommended">
              <RecommendedCard
                items={recentPosts.map((item) => ({
                  title: item.title,
                  href: `/posts/${encodeURIComponent(item.slug)}`,
                  date: formatDay(item.date),
                }))}
              />
            </div>
          </div>

          <div className="article-cover">
            <img src={cover} alt={post.title} />
          </div>

          <aside className="article-left-bottom">
            <ArticleToc />
          </aside>

          <article className="article-content bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-b-3xl shadow-2xl border border-t-0 border-white/40 dark:border-white/10 overflow-hidden transition-colors duration-700">
            <div className="relative">
              <div className="article-header relative">
                <BackButton fallbackHref="/posts" />
                <header className="border-b border-slate-300/50 dark:border-slate-700 pb-5 md:pb-6 relative">
                  <h1 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight transition-colors duration-700 pr-16 md:pr-24 leading-snug">
                    {post.title}
                  </h1>

                  {post.description && (
                    <p className="article-summary text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                      {post.description}
                    </p>
                  )}

                  {post.fileUrl && (
                    <a
                      href={post.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary absolute top-0 right-0 p-2.5 md:p-3 rounded-xl md:rounded-2xl transition-all shadow-sm border flex items-center gap-2"
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
                        className="flex items-center gap-1 text-[var(--ui-accent-strong)] dark:text-[var(--ui-accent)] font-bold bg-[var(--ui-accent-soft)] px-2.5 md:px-3 py-1.5 md:py-2 rounded-full text-xs md:text-sm shadow-sm border border-white/20 dark:border-white/5"
                      >
                        <span className="text-[10px] md:text-xs opacity-70">#</span> {tag}
                      </div>
                    ))}
                  </div>
                </header>
              </div>

              <MarkdownReader html={post.htmlContent || ""} />
            </div>
          </article>

          <div className="article-comments">
            <CommentSection targetType="POST" targetId={post.id} />
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
