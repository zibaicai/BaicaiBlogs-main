"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flag, Heart, Loader2, MessageCircle, Send, ThumbsDown, Trash2 } from "lucide-react";
import { formatDate } from "../../lib/api";
import { useAuth } from "../../lib/auth";

export interface CommentItem {
  id: number;
  targetType: string;
  targetId: number;
  userId?: number;
  author: string;
  avatar?: string;
  content: string;
  status: string;
  createdAt: string;
  likeCount: number;
  dislikeCount: number;
  myReaction?: "LIKE" | "DISLIKE" | null;
  canDelete: boolean;
  canReport: boolean;
}

async function commentRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers as Record<string, string>) },
    ...init,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new Error(json?.message || `请求失败 (${res.status})`);
  return json.data as T;
}

export default function CommentSection({
  targetType,
  targetId,
  title = "评论",
  emptyTitle,
  emptyDescription,
  emptyActionLabel = "写评论",
  externalHref,
  externalLabel,
  readOnly = false,
}: {
  targetType: "POST" | "ALBUM" | "MOMENT" | "TRACK";
  targetId: number;
  title?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  externalHref?: string;
  externalLabel?: string;
  readOnly?: boolean;
}) {
  const { user, loading: authLoading } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [content, setContent] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // 点击输入框以外区域时收回单行（草稿保留在 textarea 里，重新点开即可继续编辑）
  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (event: PointerEvent) => {
      if (composerRef.current && !composerRef.current.contains(event.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [expanded]);

  // Esc 也能收回
  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.currentTarget.blur();
      setExpanded(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await commentRequest<CommentItem[]>(
        `/public/comments?targetType=${encodeURIComponent(targetType)}&targetId=${targetId}`
      );
      setComments(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "评论加载失败");
    } finally {
      setLoading(false);
    }
  }, [targetId, targetType]);

  useEffect(() => {
    void load();
  }, [load]);

  const count = comments.length;
  const canComment = useMemo(() => Boolean(user) && !authLoading && !readOnly, [user, authLoading, readOnly]);

  const submit = async () => {
    if (!canComment || sending) return;
    const value = content.trim();
    if (!value) return;
    setSending(true);
    setError("");
    try {
      const created = await commentRequest<CommentItem>("/user/comments", {
        method: "POST",
        body: JSON.stringify({ targetType, targetId, content: value }),
      });
      setComments((prev) => [created, ...prev]);
      setContent("");
      setExpanded(false);
      setNotice("评论已发布");
    } catch (e) {
      setError(e instanceof Error ? e.message : "评论失败");
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm("确定删除这条评论吗？")) return;
    try {
      await commentRequest(`/user/comments/${id}`, { method: "DELETE" });
      setComments((prev) => prev.filter((item) => item.id !== id));
      setNotice("评论已删除");
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    }
  };

  const react = async (comment: CommentItem, type: "LIKE" | "DISLIKE") => {
    if (!user) return;
    try {
      const updated = await commentRequest<CommentItem>(`/user/comments/${comment.id}/reaction`, {
        method: "POST",
        body: JSON.stringify({ type }),
      });
      setComments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    }
  };

  const report = async (comment: CommentItem) => {
    if (!user) return;
    const reason = window.prompt("举报理由：广告 / 辱骂 / 色情低俗 / 违法违规 / 侵权 / 其他");
    if (!reason) return;
    try {
      await commentRequest(`/user/comments/${comment.id}/report`, {
        method: "POST",
        body: JSON.stringify({ reason, detail: "" }),
      });
      setNotice("举报已提交");
    } catch (e) {
      setError(e instanceof Error ? e.message : "举报失败");
    }
  };

  return (
    <section className="comment-section">
      <div className="comment-head">
        <div>
          <span className="comment-eyebrow">DISCUSSION</span>
          <h2>{title}<span>{count}</span></h2>
        </div>
        <MessageCircle size={18} />
      </div>

      {readOnly ? (
        <div className="comment-login-hint">该歌曲当前不可播放，评论暂时只读</div>
      ) : canComment ? (
        <div
          ref={composerRef}
          className={`comment-composer ${expanded ? "is-expanded" : ""}`}
          // 收起状态下整条框都可以点：否则用户点边框/padding 没反应（移动端尤其明显）
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("button")) return;
            if (!expanded) textareaRef.current?.focus();
          }}
        >
          <div className="comment-avatar">
            {user?.avatar ? <img src={user.avatar} alt="" /> : (user?.nickname || user?.username || "我").slice(0, 1)}
          </div>
          <div className="comment-composer-body">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              onFocus={() => setExpanded(true)}
              onKeyDown={onKeyDown}
              placeholder="写下你的想法..."
              maxLength={1000}
              rows={1}
            />
            <div className="comment-composer-foot">
              <span>{content.length} / 1000</span>
              <button type="button" onClick={() => void submit()} disabled={sending || !content.trim()}>
                {sending ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                发布
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="comment-login-hint">
          登录后参与评论
          <a href="/login">去登录</a>
        </div>
      )}

      {(error || notice) && (
        <div className={`comment-message ${error ? "is-error" : ""}`}>
          {error || notice}
        </div>
      )}

      {loading ? (
        <div className="comment-loading"><Loader2 className="animate-spin" size={16} /> 正在加载评论…</div>
      ) : comments.length === 0 ? (
        emptyTitle || emptyDescription ? (
          <div className="comment-empty">
            {emptyTitle && <strong>{emptyTitle}</strong>}
            {emptyDescription && <span>{emptyDescription}</span>}
            <div className="comment-empty-actions">
              <button
                type="button"
                onClick={() => {
                  if (canComment) textareaRef.current?.focus();
                  else window.location.href = "/login";
                }}
              >
                {emptyActionLabel}
              </button>
              {externalHref && externalLabel && (
                <a href={externalHref} target="_blank" rel="noopener noreferrer">{externalLabel}</a>
              )}
            </div>
          </div>
        ) : (
          <div className="comment-empty">还没有评论，来写第一条吧。</div>
        )
      ) : (
        <div className="comment-list">
          {comments.map((comment) => (
            <article className="comment-item" key={comment.id}>
              <div className="comment-avatar">
                {comment.avatar ? <img src={comment.avatar} alt="" /> : (comment.author || "匿").slice(0, 1)}
              </div>
              <div className="comment-main">
                <div className="comment-meta">
                  <strong>{comment.author}</strong>
                  <time>{formatDate(comment.createdAt)}</time>
                </div>
                <p className="comment-content">{comment.content}</p>
                <div className="comment-actions" style={readOnly ? { pointerEvents: "none", opacity: 0.45 } : undefined}>
                  <button
                    type="button"
                    onClick={() => void react(comment, "LIKE")}
                    disabled={!user || comment.userId === user.id}
                    className={comment.myReaction === "LIKE" ? "is-active" : ""}
                    aria-label="点赞"
                  >
                    <Heart size={13} /> {comment.likeCount}
                  </button>
                  <button
                    type="button"
                    onClick={() => void react(comment, "DISLIKE")}
                    disabled={!user || comment.userId === user.id}
                    className={comment.myReaction === "DISLIKE" ? "is-active" : ""}
                    aria-label="踩"
                  >
                    <ThumbsDown size={13} /> {comment.dislikeCount}
                  </button>
                  {comment.canDelete && (
                    <button type="button" onClick={() => void remove(comment.id)} aria-label="删除">
                      <Trash2 size={13} /> 删除
                    </button>
                  )}
                  {comment.canReport && (
                    <button type="button" onClick={() => void report(comment)} aria-label="举报">
                      <Flag size={13} /> 举报
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
