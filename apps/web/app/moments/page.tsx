"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import DirectoryExplorer from "../../components/DirectoryExplorer";
import { useAuth } from "../../lib/auth";
import { formatDate } from "../../lib/api";

type Moment = {
  id: number;
  slug: string;
  content: string;
  htmlContent: string;
  date: string;
  images?: string[];
  status?: string;
  visibility?: string;
};

export default function MomentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const endpoint = user ? "/api/user/moments" : "/api/public/moments";
    fetch(endpoint, { credentials: "include", cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (active && json?.success) setMoments(Array.isArray(json.data) ? json.data : []);
      })
      .catch(() => {
        if (active) setMoments([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const items = useMemo(
    () =>
      moments.map((moment) => ({
        key: String(moment.slug || moment.id),
        node: (
          <article className="directory-card p-6 md:p-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {formatDate(moment.date)}
              </div>
              {user && moment.visibility === "PRIVATE" && (
                <span className="rounded-full bg-red-500/10 px-2 py-1 text-[9px] font-black text-red-400">
                  仅自己可见
                </span>
              )}
            </div>
            <div
              className="article-prose prose prose-slate dark:prose-invert max-w-none text-sm text-slate-800 dark:text-slate-200 md:text-base"
              dangerouslySetInnerHTML={{ __html: moment.htmlContent || "" }}
            />
            {(moment.images || []).length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {moment.images!.map((img) => (
                  <a key={img} href={img} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden rounded-2xl bg-white/40 dark:bg-slate-900/40">
                    <img src={img} alt="" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                  </a>
                ))}
              </div>
            )}
          </article>
        ),
        searchText: [moment.date, (moment.htmlContent || "").replace(/<[^>]+>/g, " ")].join(" "),
        filterValues: [moment.visibility === "PRIVATE" ? "private" : "public"],
      })),
    [moments, user]
  );

  const filters = [
    { value: "all", label: "全部", count: moments.length },
    ...(user
      ? [
          { value: "public", label: "公开", count: moments.filter((m) => m.visibility !== "PRIVATE").length },
          { value: "private", label: "私密", count: moments.filter((m) => m.visibility === "PRIVATE").length },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell">
          {loading || authLoading ? (
            <div className="flex min-h-[40vh] items-center justify-center gap-2 text-slate-400">
              <Loader2 className="animate-spin" size={18} /> 加载中…
            </div>
          ) : (
            <DirectoryExplorer
              eyebrow="BAICAI / MOMENTS"
              title="说说"
              subtitle="零散的念头，落在时间里"
              count={`${moments.length} 条记录`}
              items={items}
              filters={filters}
              searchPlaceholder="搜索说说内容..."
              empty={
                <div className="directory-card p-10 text-center">
                  <div className="mb-5 text-5xl">🫧</div>
                  <h2 className="mb-3 text-xl font-bold text-slate-800 dark:text-white">这里还很安静</h2>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    说说模块已接入，等第一条记录出现时，它会在这里亮起来。
                  </p>
                </div>
              }
            />
          )}
        </main>
      </PageTransition>
    </div>
  );
}
