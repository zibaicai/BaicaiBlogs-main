"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import CommentComposer from "./CommentComposer";

type Reply = {
  id: number;
  author: string;
  content: string;
  createdAt: string;
  parentId?: number;
  replyToAuthor?: string;
};

export default function InlineCommentThread({
  rootId,
  targetType,
  targetId,
  rootAuthor,
  onCollapse,
  onSubmitted,
}: {
  rootId: number;
  targetType: "POST" | "MOMENT" | "ARTICLE" | "PROJECT" | "ALBUM" | "TRACK";
  targetId: number;
  rootAuthor?: string;
  onCollapse: () => void;
  onSubmitted: () => void;
}) {
  const [items, setItems] = useState<Reply[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<Reply | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

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
                <button type="button" onClick={() => { setReplyingTo(reply); setComposerOpen(true); }} className="mt-1 text-[10px] font-bold text-indigo-400">回复</button>
              </div>
            ))}
            {items.length === 0 && <p className="py-2 text-xs text-slate-500">暂无回复。</p>}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setReplyingTo(null); setComposerOpen(true); }}
              className="text-[10px] font-bold text-indigo-400"
            >
              回复楼主{rootAuthor ? ` @${rootAuthor}` : ""}
            </button>
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
                replyingTo={replyingTo ?? (rootAuthor ? { author: rootAuthor } : null)}
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
