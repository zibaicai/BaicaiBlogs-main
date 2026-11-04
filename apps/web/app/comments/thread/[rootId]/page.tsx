"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Navbar from "../../../../components/Navbar";
import PageTransition from "../../../../components/PageTransition";
import CommentComposer from "../../../../components/comments/CommentComposer";
import { formatDate } from "../../../../lib/api";

type Comment = {
  id: number;
  targetType: string;
  targetId: number;
  author: string;
  avatar?: string;
  content: string;
  createdAt: string;
  parentId?: number;
  rootId?: number;
  replyToAuthor?: string;
};

export default function CommentThreadPage() {
  const params = useParams<{ rootId: string }>();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(comments.length / pageSize));
  const pageComments = comments.slice(page * pageSize, (page + 1) * pageSize);
  const targetType = comments[0]?.targetType;
  const backHref = targetType === "POST" ? "/posts"
    : targetType === "MOMENT" ? "/moments"
    : targetType === "ALBUM" ? "/photowall"
    : targetType === "PROJECT" ? "/projects"
    : targetType === "TRACK" ? "/music"
    : "/articles";

  useEffect(() => {
    if (!params?.rootId) return;
    setLoading(true);
    fetch(`/api/public/comments/thread/${encodeURIComponent(params.rootId)}`, { credentials: "include" })
      .then(async (response) => {
        const json = await response.json().catch(() => null);
        if (!response.ok || !json?.success) throw new Error(json?.message || "加载评论楼失败");
        setComments(json.data || []);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [params?.rootId, refreshKey]);

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell articles-shell">
          <div className="mx-auto max-w-3xl py-10">
            <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-500 hover:underline">
              <ArrowLeft size={14} /> 返回
            </Link>
            <h1 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">评论楼</h1>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-sm text-slate-400">
                <Loader2 className="mr-2 animate-spin" size={16} /> 加载中…
              </div>
            ) : error ? (
              <p className="py-10 text-sm text-red-400">{error}</p>
            ) : (
              <div className="mt-5 space-y-3">
                {pageComments.map((comment, index) => (
                  <div
                    key={comment.id}
                    className={`rounded-2xl border border-white/20 bg-white/50 p-4 dark:border-white/10 dark:bg-slate-900/50 ${
                      index > 0 ? "ml-6" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <span className="text-slate-800 dark:text-slate-100">{comment.author || "用户"}</span>
                      <span>·</span>
                      <span>{formatDate(comment.createdAt)}</span>
                      {comment.parentId && <span className="text-meta text-indigo-400">回复 {comment.replyToAuthor ? `@${comment.replyToAuthor}` : ""}</span>}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">{comment.content}</p>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(comment)}
                      className="mt-2 text-[11px] font-bold text-indigo-500"
                    >
                      回复
                    </button>
                  </div>
                ))}
                {comments.length === 0 && <p className="text-sm text-slate-400">暂无评论。</p>}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <button type="button" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className="font-bold disabled:opacity-30">上一页</button>
                <span>{page + 1} / {totalPages}</span>
                <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))} className="font-bold disabled:opacity-30">下一页</button>
              </div>
            )}

            {comments[0] && (
              <div className="mt-5">
                <CommentComposer
                  targetType={comments[0].targetType as "POST" | "MOMENT" | "ARTICLE" | "PROJECT" | "ALBUM" | "TRACK"}
                  targetId={comments[0].targetId}
                  parentId={replyingTo?.id ?? comments[0].id}
                  replyingTo={replyingTo}
                  onCancelReply={() => setReplyingTo(null)}
                  onSubmitted={() => {
                    setReplyingTo(null);
                    setRefreshKey((value) => value + 1);
                  }}
                />
              </div>
            )}
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
