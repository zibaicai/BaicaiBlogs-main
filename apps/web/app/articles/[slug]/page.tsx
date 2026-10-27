"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BookOpen, Loader2 } from "lucide-react";
import Navbar from "../../../components/Navbar";
import PageTransition from "../../../components/PageTransition";
import BackButton from "../../../components/BackButton";
import CommentSection from "../../../components/comments/CommentSection";
import { articleApi, type Article } from "../../../lib/api";

export default function ArticleDetailPage() {
  const params = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const slug = params?.slug ? decodeURIComponent(params.slug) : "";

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    articleApi.get(slug).then(setArticle).catch(() => setArticle(null)).finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell articles-shell">
          <BackButton fallbackHref="/articles" label="返回文章列表" />
          {loading ? (
            <div className="py-24 text-center text-slate-400"><Loader2 className="mx-auto animate-spin" /></div>
          ) : !article ? (
            <div className="py-24 text-center text-sm text-slate-400"><BookOpen className="mx-auto mb-3" /> 文章不存在或未公开。</div>
          ) : (
            <article className="mx-auto max-w-[760px]">
              {article.cover && <img src={article.cover} alt={article.title} className="mb-8 aspect-[16/8] w-full rounded-[2rem] object-cover shadow-xl" />}
              <div className="rounded-[2rem] border border-white/30 bg-white/60 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/60 md:p-10">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-400">
                  <span>{article.category || "文章"}</span>
                  <span>·</span>
                  <span>{article.author}</span>
                  <span>·</span>
                  <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("zh-CN") : ""}</span>
                  {article.readingTime ? <><span>·</span><span>{article.readingTime} 分钟阅读</span></> : null}
                </div>
                <h1 className="mt-3 text-4xl font-black leading-tight text-slate-900 dark:text-white md:text-5xl">{article.title}</h1>
                {article.subtitle && <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">{article.subtitle}</p>}
                <div className="wechat-article mt-8" dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
                {article.tags && article.tags.length > 0 && (
                  <div className="mt-8 flex flex-wrap gap-2">
                    {article.tags.map((tag) => <span key={tag} className="rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-bold text-indigo-500">#{tag}</span>)}
                  </div>
                )}
              </div>
              <div className="mt-8">
                <CommentSection targetType="ARTICLE" targetId={article.id} title="文章评论" />
              </div>
            </article>
          )}
        </main>
      </PageTransition>
    </div>
  );
}
