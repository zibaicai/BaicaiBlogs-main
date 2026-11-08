"use client";

import { Heart, MessageCircle, ThumbsDown } from "lucide-react";
import { formatDate } from "../../lib/api";

type PreviewReply = {
  id: number;
  author: string;
  content: string;
  createdAt: string;
  likeCount: number;
  dislikeCount: number;
};

export default function CommentThreadPreview({
  reply,
  count,
  onExpand,
  onReply,
}: {
  reply: PreviewReply;
  count: number;
  onExpand: () => void;
  onReply: () => void;
}) {
  return (
    <div className="mt-2 rounded-lg border border-white/5 bg-black/10 px-3 py-2">
      <button type="button" onClick={onExpand} className="block w-full min-w-0 text-left">
        <p className="flex min-w-0 items-baseline gap-1 text-xs text-slate-300">
          <strong className="shrink-0 font-bold text-slate-200">{reply.author}</strong>
          <span className="text-slate-500">：</span>
          <span className="truncate">{reply.content}</span>
        </p>
      </button>

      <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-500">
        <time className="whitespace-nowrap">{formatDate(reply.createdAt)}</time>
        <span className="inline-flex items-center gap-1"><Heart size={11} /> {reply.likeCount}</span>
        <span className="inline-flex items-center gap-1"><ThumbsDown size={11} /> {reply.dislikeCount}</span>
        <button type="button" onClick={onReply} className="ml-auto inline-flex items-center gap-1 font-bold text-indigo-400">
          <MessageCircle size={11} /> 回复
        </button>
      </div>

      <button type="button" onClick={onExpand} className="mt-1 text-[10px] font-bold text-indigo-400">
        共 {count} 条回复
      </button>
    </div>
  );
}
