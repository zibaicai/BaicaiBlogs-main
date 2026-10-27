"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useParams } from "next/navigation";
import { BookOpen, Loader2 } from "lucide-react";
import Navbar from "../../../components/Navbar";
import PageTransition from "../../../components/PageTransition";
import BackButton from "../../../components/BackButton";
import ArticleImageLightbox from "../../../components/ArticleImageLightbox";
import ContentSidebar from "../../../components/ContentSidebar";
import CommentSection from "../../../components/comments/CommentSection";
import { articleApi, formatDay, type Article } from "../../../lib/api";

export default function ArticleDetailPage() {
  const params = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [viewer, setViewer] = useState<{ src: string; alt: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const slug = params?.slug ? decodeURIComponent(params.slug) : "";

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    articleApi.get(slug)
      .then(async (data) => {
        setArticle(data);
        try {
          const all = await articleApi.list();
          const others = all.filter((item) => item.id !== data.id);
          const sameCategory = others.filter((item) => data.category && item.category === data.category);
          const sameTags = others.filter((item) =>
            data.tags?.some((tag) => item.tags?.includes(tag))
          );
          const picked = [...sameCategory, ...sameTags, ...others].filter(
            (item, index, list) => list.findIndex((entry) => entry.id === item.id) === index
          );
          setRelated(picked.slice(0, 5));
        } catch {
          setRelated([]);
        }
      })
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const openImage = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.tagName !== "IMG") return;
    const image = target as HTMLImageElement;
    setViewer({ src: image.currentSrc || image.src, alt: image.alt || article?.title || "文章图片" });
  };

  const relatedItems = related.map((item) => ({
    title: item.title,
    href: `/articles/${encodeURIComponent(item.slug)}`,
    date: item.publishedAt ? formatDay(item.publishedAt) : undefined,
  }));

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell articles-shell">
          <div className="mx-auto max-w-[1112px]">
            {loading ? (
              <div className="py-24 text-center text-slate-400"><Loader2 className="mx-auto animate-spin" /></div>
            ) : !article ? (
              <div className="py-24 text-center text-sm text-slate-400"><BookOpen className="mx-auto mb-3" /> 文章不存在或未公开。</div>
            ) : (
              <div className="xl:grid xl:grid-cols-[320px_760px] xl:items-start xl:gap-8">
                <aside className="hidden xl:sticky xl:top-24 xl:block">
                  <ContentSidebar items={relatedItems} />
                </aside>

                <article className="min-w-0">
                  {article.cover && (
                    <img
                      src={article.cover}
                      alt={article.title}
                      className="mx-auto mb-8 block h-auto max-h-[70vh] w-auto max-w-full object-contain"
                    />
                  )}
                  <div className="rounded-[2rem] border border-white/30 bg-white/60 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/60 md:p-10">
                    <BackButton fallbackHref="/articles" label="返回文章列表" />
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
                    <div
                      className="wechat-article mt-8"
                      onClick={openImage}
                      dangerouslySetInnerHTML={{ __html: article.contentHtml }}
                    />
                    {article.tags && article.tags.length > 0 && (
                      <div className="mt-8 flex flex-wrap gap-2">
                        {article.tags.map((tag) => <span key={tag} className="rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-bold text-indigo-500">#{tag}</span>)}
                      </div>
                    )}
                  </div>

                  <div className="mt-8 xl:hidden">
                    <ContentSidebar items={relatedItems} />
                  </div>

                  <div className="mt-8">
                    <CommentSection targetType="ARTICLE" targetId={article.id} title="文章评论" />
                  </div>
                </article>
              </div>
            )}
          </div>
        </main>
      </PageTransition>
      {viewer && <ArticleImageLightbox src={viewer.src} alt={viewer.alt} onClose={() => setViewer(null)} />}
    </div>
  );
}
