"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BookOpen, Loader2 } from "lucide-react";
import Navbar from "../../../components/Navbar";
import PageTransition from "../../../components/PageTransition";
import BackButton from "../../../components/BackButton";
import ArticleImageLightbox from "../../../components/ArticleImageLightbox";
import ReadingProse from "../../../components/reading/ReadingProse";
import ReadingSurface from "../../../components/reading/ReadingSurface";
import ReadingToolbar from "../../../components/reading/ReadingToolbar";
import { useReadingTheme } from "../../../components/reading/useReadingTheme";
import ContentSidebar from "../../../components/ContentSidebar";
import CommentSection from "../../../components/comments/CommentSection";
import { articleApi, formatDay, type Article } from "../../../lib/api";

export default function ArticleDetailPage() {
  const params = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [viewer, setViewer] = useState<{ src: string; alt: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme, setTheme, mode, scheme, resolvedScheme } = useReadingTheme();
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

  const openImage = (event: globalThis.MouseEvent) => {
    const image = (event.target as HTMLElement | null)?.closest("img");
    if (!(image instanceof HTMLImageElement)) return;
    if (!image.closest(".article-reading-surface")) return;
    setViewer({ src: image.currentSrc || image.src, alt: image.alt || article?.title || "文章图片" });
  };

  useEffect(() => {
    document.addEventListener("click", openImage, true);
    return () => document.removeEventListener("click", openImage, true);
  });

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
          <div className="mx-auto max-w-[1348px]">
            {loading ? (
              <div className="py-24 text-center text-slate-400"><Loader2 className="mx-auto animate-spin" /></div>
            ) : !article ? (
              <div className="py-24 text-center text-sm text-slate-400"><BookOpen className="mx-auto mb-3" /> 文章不存在或未公开。</div>
            ) : (
              <div className="xl:grid xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start xl:gap-8">
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
                  <div className="overflow-hidden rounded-[2rem] border border-white/30 bg-white/60 p-6 glass-blur glass-blur--xl dark:border-white/10 dark:bg-slate-800/60 md:p-10">
                    <BackButton fallbackHref="/articles" label="返回文章列表" />
                    <div className="flex flex-wrap items-center gap-2 text-meta font-bold text-slate-400">
                      <span>{article.category || "文章"}</span>
                      <span>·</span>
                      <span>{article.author}</span>
                      <span>·</span>
                      <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("zh-CN") : ""}</span>
                      {article.readingTime ? <><span>·</span><span>{article.readingTime} 分钟阅读</span></> : null}
                    </div>
                    <h1 className="detail-title mt-3 text-slate-900 dark:text-white">{article.title}</h1>
                    {article.subtitle && <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">{article.subtitle}</p>}
                    <ReadingSurface
                      className="article-reading-surface -mx-6 md:-mx-10"
                      variant="article"
                      mode={mode}
                      scheme={scheme}
                      resolvedScheme={resolvedScheme}
                      siteTheme={theme}
                      toolbar={<ReadingToolbar theme={theme} onChange={setTheme} />}
                    >
                      <ReadingProse
                        className={`markdown-body px-6 py-8 md:px-10 ${theme === "classic" ? "markdown-body--site" : ""}`}
                        html={article.contentHtml}
                      />
                    </ReadingSurface>
                    {article.tags && article.tags.length > 0 && (
                      <div className="mt-8 flex flex-wrap gap-2">
                        {article.tags.map((tag) => <span key={tag} className="rounded-full bg-indigo-500/10 px-3 py-1 text-meta font-bold text-indigo-500">#{tag}</span>)}
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
