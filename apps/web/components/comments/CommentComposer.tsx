"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { useAuth } from "../../lib/auth";
import AutoGrowTextarea from "../ui/AutoGrowTextarea";

type CommentComposerProps = {
  targetType: "POST" | "MOMENT" | "ARTICLE" | "PROJECT" | "ALBUM" | "TRACK";
  targetId: number;
  parentId?: number;
  replyingTo?: { author: string } | null;
  onCancelReply?: () => void;
  onSubmitted?: () => void;
  readOnly?: boolean;
};

export default function CommentComposer({
  targetType,
  targetId,
  parentId,
  replyingTo,
  onCancelReply,
  onSubmitted,
  readOnly = false,
}: CommentComposerProps) {
  const { user, loading } = useAuth();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!content.trim() || !user || sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/user/comments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, parentId, content: content.trim() }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) throw new Error(json?.message || "评论失败");
      setContent("");
      onSubmitted?.();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "评论失败");
    } finally {
      setSending(false);
    }
  };

  if (readOnly) return <p className="text-xs text-slate-400">当前内容不可评论。</p>;
  if (loading) return null;
  if (!user) return <a href="/login" className="text-xs font-bold text-indigo-500">登录后参与评论</a>;

  return (
    <div className="comment-composer comment-composer--inline">
      {replyingTo && (
        <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>回复 @{replyingTo.author}</span>
          <button type="button" onClick={onCancelReply} className="font-bold text-indigo-500">取消</button>
        </div>
      )}
      <div className="comment-composer-inline-row">
        <AutoGrowTextarea
          value={content}
          onChange={setContent}
          onSubmit={() => void submit()}
          placeholder={replyingTo ? `回复 @${replyingTo.author}…` : "写下你的想法…"}
          minRows={1}
          maxRows={4}
          ariaLabel="评论内容"
          className="comment-composer-inline-input min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={sending || !content.trim()}
          className="comment-composer-inline-send flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white disabled:opacity-40"
          aria-label="发送评论"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
      {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
