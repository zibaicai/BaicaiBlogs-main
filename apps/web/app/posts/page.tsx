import Link from "next/link";
import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import { formatDay } from "../../lib/api";
import { getPosts } from "../../lib/server-api";
import { DEFAULT_BACKGROUND } from "../../lib/site-config";

export const dynamic = "force-dynamic";
export const metadata = { title: "全部文章" };

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-full max-w-6xl mx-auto mt-28 px-4 sm:px-10 relative z-10">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
              研究档案
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              共 {posts.length} 篇公开记录
            </p>
          </header>

          {posts.length === 0 ? (
            <div className="text-center py-24 text-slate-500 dark:text-slate-400 font-bold">
              暂无公开文章，稍后再来看看吧。
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/posts/${encodeURIComponent(post.slug)}`}
                  className="group bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-3xl overflow-hidden shadow-xl hover:-translate-y-1 transition-all duration-500"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={post.cover || DEFAULT_BACKGROUND.defaultPostCover}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-3 left-4 text-white/90 text-[10px] font-mono font-bold bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md">
                      {formatDay(post.date)}
                    </span>
                  </div>
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-500 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {post.description || "暂无摘要"}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {(post.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </PageTransition>
    </div>
  );
}
