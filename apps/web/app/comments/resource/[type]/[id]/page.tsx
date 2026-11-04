"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Navbar from "../../../../../components/Navbar";
import PageTransition from "../../../../../components/PageTransition";
import CommentSection from "../../../../../components/comments/CommentSection";

const TARGET_TYPES = ["POST", "ALBUM", "MOMENT", "TRACK", "ARTICLE", "PROJECT"] as const;
type TargetType = (typeof TARGET_TYPES)[number];

export default function ResourceCommentsPage() {
  const params = useParams<{ type: string; id: string }>();
  const type = params?.type?.toUpperCase() as TargetType;
  const id = Number(params?.id);

  if (!TARGET_TYPES.includes(type) || !Number.isFinite(id)) {
    return (
      <div className="min-h-screen relative pb-20">
        <Navbar />
        <main className="directory-shell py-20 text-center text-sm text-slate-400">评论目标无效。</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell">
          <div className="mx-auto max-w-3xl py-10">
            <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-indigo-500 hover:underline">
              <ArrowLeft size={14} /> 返回
            </Link>
            <CommentSection targetType={type} targetId={id} title="资源评论" />
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
