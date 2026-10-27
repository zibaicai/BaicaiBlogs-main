"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Navbar from "../../../components/Navbar";
import PageTransition from "../../../components/PageTransition";
import BackButton from "../../../components/BackButton";
import MomentCard from "../../../components/MomentCard";
import CommentSection from "../../../components/comments/CommentSection";

interface Moment {
  id: number;
  slug: string;
  content: string;
  htmlContent: string;
  date: string;
  images?: string[];
  visibility?: string;
  authorName?: string;
  authorAvatar?: string;
}

export default function MomentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState("");
  const [moment, setMoment] = useState<Moment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void params.then((value) => setSlug(value.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    fetch("/api/public/moments", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        const found = (json?.data || []).find((item: Moment) => item.slug === slug);
        setMoment(found || null);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-full max-w-3xl mx-auto mt-28 px-4 relative z-10">
          <BackButton fallbackHref="/moments" label="返回说说" />
          {loading ? (
            <div className="flex justify-center py-24 text-slate-400">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : !moment ? (
            <div className="rounded-3xl border border-white/20 bg-white/50 p-10 text-center text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              这条说说不存在或未公开。
            </div>
          ) : (
            <>
              <MomentCard moment={moment} />
              <CommentSection targetType="MOMENT" targetId={moment.id} />
            </>
          )}
        </main>
      </PageTransition>
    </div>
  );
}
