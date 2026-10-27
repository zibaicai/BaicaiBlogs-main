"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Loader2 } from "lucide-react";
import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import { articleApi, type Article } from "../../lib/api";

export default function ArticlesPage() {
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    articleApi.list().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell articles-shell">
          <header className="mb-8">
            <span className="font-mono text-[9px] font-black tracking-[0.2em] text-indigo-400">ARTICLES</span>
            <h1 className="mt-2 text-4xl font-black text-slate-900 dark:text-white">文章</h1>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">图文长文、专栏与更完整的表达。</p>
          </header>

          {loading ? (
            <div className="py-24 text-center text-slate-400"><Loader2 className="mx-auto animate-spin" /></div>
          ) : items.length === 0 ? (
            <div className="rounded-[2rem] border border-white/20 bg-white/40 p-16 text-center text-sm text-slate-400">
              <BookOpen className="mx-auto mb-3" size={24} /> 还没有发布文章。
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {items.map((item) => (
                <Link key={item.id} href={`/articles/${encodeURIComponent(item.slug)}`} className="group overflow-hidden rounded-[2rem] border border-white/30 bg-white/55 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/70 dark:border-white/10 dark:bg-slate-800/55">
                  {item.cover ? (
                    <div className="aspect-[16/8] overflow-hidden bg-slate-900/10">
                      <img src={item.cover} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/8] items-center justify-center bg-indigo-500/10 text-indigo-400"><BookOpen size={30} /></div>
                  )}
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-400">
                      <span>{item.category || "文章"}</span>
                      <span>·</span>
                      <span>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("zh-CN") : ""}</span>
                      {item.readingTime ? <><span>·</span><span>{item.readingTime} 分钟</span></> : null}
                    </div>
                    <h2 className="mt-2 line-clamp-2 text-xl font-black text-slate-900 dark:text-white">{item.title}</h2>
                    {item.subtitle && <p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-500">{item.subtitle}</p>}
                    <span className="mt-4 inline-flex items-center gap-1 text-[10px] font-black text-indigo-500">阅读全文 <ArrowRight size={12} /></span>
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
