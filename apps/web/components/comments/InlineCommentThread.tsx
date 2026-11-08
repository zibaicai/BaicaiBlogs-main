"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, Loader2, ThumbsDown } from "lucide-react";
import { formatDate } from "../../lib/api";
import CommentComposer from "./CommentComposer";

type Reply = {
  id: number;
  author: string;
  content: string;
  createdAt: string;
  parentId?: number;
  replyToAuthor?: string;
  likeCount?: number;
  dislikeCount?: number;
  myReaction?: "LIKE" | "DISLIKE" | null;
};

export default function InlineCommentThread({
  rootId,
  targetType,
  targetId,
  startReply,
  onCollapse,
  onSubmitted,
}: {
  rootId: number;
  targetType: "POST" | "MOMENT" | "ARTICLE" | "PROJECT" | "ALBUM" | "TRACK";
  targetId: number;
  startReply?: { id: number; author: string } | null;
  onCollapse: () => void;
  onSubmitted: () => void;
}) {
  const [items, setItems] = useState<Reply[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<Reply | null>(
    startReply ? { ...startReply, content: "", createdAt: "" } : null
  );
  const [composerOpen, setComposerOpen] = useState(Boolean(startReply));

  const load = useCallback(async (nextPage: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/public/comments/thread/${rootId}/page?page=${nextPage}&size=10`, { credentials: "include" });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) throw new Error(json?.message || "加载回复失败");
      setItems(json.data?.items || []);
      setPage(json.data?.page || nextPage);
      setTotalPages(json.data?.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [rootId]);

  const reactReply = async (reply: Reply, type: "LIKE" | "DISLIKE") => {
    try {
      const response = await fetch(`/api/user/comments/${reply.id}/reaction`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) return;
      setItems((prev) => prev.map((item) => item.id === reply.id ? { ...item, ...json.data } : item));
    } catch {
      // 静默失败，避免打断阅读
    }
  };

  useEffect(() => {
    void load(1);
  }, [load]);

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-black/10 p-3">
      {loading ? (
        <div className="flex items-center justify-center py-4 text-xs text-slate-400">
          <Loader2 className="mr-2 animate-spin" size={14} /> 加载回复…
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((reply) => (
              <div key={reply.id} id={`comment-${reply.id}`} className="rounded-lg border border-white/5 px-3 py-2">
                <div className="text-[11px] font-bold text-slate-300">
                  {reply.author || "用户"}
                  {reply.replyToAuthor && <span className="ml-1 text-slate-500">回复 @{reply.replyToAuthor}</span>}
                </div>
                <p className="mt-1 text-xs leading-6 text-slate-300">{reply.content}</p>
          <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-500">
            <time className="whitespace-nowrap">{formatDate(reply.createdAt)}</time>
            <button
              type="button"
              onClick={() => void reactReply(reply, "LIKE")}
              className={reply.myReaction === "LIKE" ? "text-indigo-400" : ""}
              aria-label="点赞"
            >
              <Heart size={11} className="inline" /> {reply.likeCount || 0}
            </button>
            <button
              type="button"
              onClick={() => void reactReply(reply, "DISLIKE")}
              className={reply.myReaction === "DISLIKE" ? "text-indigo-400" : ""}
              aria-label="踩"
            >
              <ThumbsDown size={11} className="inline" /> {reply.dislikeCount || 0}
            </button>
            <button type="button" onClick={() => { setReplyingTo(reply); setComposerOpen(true); }} className="font-bold text-indigo-400">回复</button>
          </div>
              </div>
            ))}
            {items.length === 0 && <p className="py-2 text-xs text-slate-500">暂无回复。</p>}
          </div>

          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
              <button type="button" disabled={page === 1} onClick={() => void load(page - 1)} className="font-bold disabled:opacity-30">上一页</button>
              <span>{page} / {totalPages}</span>
              <button type="button" disabled={page === totalPages} onClick={() => void load(page + 1)} className="font-bold disabled:opacity-30">下一页</button>
            </div>
          )}

          {composerOpen && (
            <div className="mt-3">
              <CommentComposer
                key={replyingTo?.id ?? rootId}
                targetType={targetType}
                targetId={targetId}
                parentId={replyingTo?.id ?? rootId}
                replyingTo={replyingTo}
                onCancelReply={() => { setComposerOpen(false); setReplyingTo(null); }}
                onSubmitted={() => {
                  setComposerOpen(false);
                  setReplyingTo(null);
                  void load(page);
                  onSubmitted();
                }}
              />
            </div>
          )}

          <div className="mt-2 text-right">
            <button type="button" onClick={onCollapse} className="text-[10px] font-bold text-slate-400 hover:text-white">
              收起楼中楼
            </button>
          </div>
        </>
      )}
    </div>
  );
}
