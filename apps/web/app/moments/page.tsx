"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import DirectoryExplorer from "../../components/DirectoryExplorer";
import MomentCard from "../../components/MomentCard";
import { useAuth } from "../../lib/auth";

type Moment = {
  id: number;
  slug: string;
  content: string;
  htmlContent: string;
  date: string;
  images?: string[];
  status?: string;
  visibility?: string;
  authorId?: number;
  authorName?: string;
  authorAvatar?: string;
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
        node: <MomentCard moment={moment} />,
        searchText: [moment.date, (moment.htmlContent || "").replace(/<[^>]+>/g, " ")].join(" "),
        filterValues: [moment.visibility === "PRIVATE" ? "private" : "public"],
        title: (moment.content || "").replace(/<[^>]+>/g, " ").trim().slice(0, 60),
        date: moment.date,
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
              subtitle="一些没写成长文，但值得留下的瞬间。"
              count={`${moments.length} 条记录`}
              items={items}
              filters={filters}
              views={["thread"]}
              initialMode="thread"
              pageSize={20}
              defaultSort="newest"
              searchPlaceholder="搜索说说内容..."
              empty={
                <div className="directory-card p-10 text-center">
                  <div className="mb-5 text-5xl">💤</div>
                  <h2 className="mb-3 text-xl font-bold text-slate-800 dark:text-white">这里还很安静</h2>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    第一条说说出现时，这里会亮起来。
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
