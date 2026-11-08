"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Flag, Loader2, MessageCircle, Send, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { formatDate } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import MessageListShell from "../messages/MessageListShell";
import MessageItemShell from "../messages/MessageItemShell";
import AutoGrowTextarea from "../ui/AutoGrowTextarea";
import InlineCommentThread from "./InlineCommentThread";
import CommentComposer from "./CommentComposer";
import CommentThreadPreview from "./CommentThreadPreview";
import { useVisualViewport } from "../../lib/useVisualViewport";

export interface CommentItem {
  id: number;
  targetType: string;
  targetId: number;
  userId?: number;
  parentId?: number;
  rootId?: number;
  replyToUserId?: number;
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
  variant = "card",
  itemLayout = "inline",
}: {
  targetType: "POST" | "ALBUM" | "MOMENT" | "TRACK" | "ARTICLE" | "PROJECT";
  targetId: number;
  title?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  externalHref?: string;
  externalLabel?: string;
  readOnly?: boolean;
  variant?: "card" | "embedded";
  itemLayout?: "inline" | "stacked";
}) {
  const { user, loading: authLoading } = useAuth();
  const { keyboardInset } = useVisualViewport();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [rootComposerVisible, setRootComposerVisible] = useState(true);
  const [sectionVisible, setSectionVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [content, setContent] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [expandedRootId, setExpandedRootId] = useState<number | null>(null);
  const [replyTarget, setReplyTarget] = useState<{ rootId: number; id: number; author: string } | null>(null);
  const [replyingRootId, setReplyingRootId] = useState<number | null>(null);
  const [localReplies, setLocalReplies] = useState<Record<number, CommentItem[]>>({});
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const focusComposer = () => {
    document.querySelector<HTMLTextAreaElement>(".comment-textarea")?.focus();
  };
  const rootComments = useMemo(() => comments.filter((comment) => !comment.parentId), [comments]);
  const replyCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const comment of comments) {
      if (!comment.rootId) continue;
      counts.set(comment.rootId, (counts.get(comment.rootId) || 0) + 1);
    }
    return counts;
  }, [comments]);
  const topReplies = useMemo(() => {
    const tops = new Map<number, CommentItem>();
    for (const comment of comments) {
      if (!comment.rootId || comment.id === comment.rootId) continue;
      const current = tops.get(comment.rootId);
      if (
        !current ||
        comment.likeCount > current.likeCount ||
        (comment.likeCount === current.likeCount && comment.createdAt < current.createdAt)
      ) {
        tops.set(comment.rootId, comment);
      }
    }
    return tops;
  }, [comments]);
  const previewTops = useMemo(() => {
    const tops = new Map(topReplies);
    for (const [rootId, replies] of Object.entries(localReplies)) {
      const id = Number(rootId);
      if (!tops.has(id) && replies[0]) tops.set(id, replies[0]);
    }
    return tops;
  }, [topReplies, localReplies]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const composer = section.querySelector(".comment-composer");
    const rootObserver = composer ? new IntersectionObserver(([entry]) => setRootComposerVisible(entry.isIntersecting)) : null;
    const sectionObserver = new IntersectionObserver(([entry]) => setSectionVisible(entry.isIntersecting));
    if (rootObserver && composer) rootObserver.observe(composer);
    sectionObserver.observe(section);
    return () => {
      rootObserver?.disconnect();
      sectionObserver.disconnect();
    };
  }, [loading]);

  const showStickyComposer = !rootComposerVisible && sectionVisible;

  useEffect(() => {
    if (loading) return;
    const match = window.location.hash.match(/^#comment-(\d+)$/);
    if (!match) return;
    const id = Number(match[1]);
    const timer = window.setTimeout(() => {
      document.getElementById(`comment-${id}`)?.scrollIntoView({ block: "center" });
      setHighlightedId(id);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [loading, comments.length]);

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
    <div ref={sectionRef}>
    <MessageListShell
      className={`comment-section ${variant === "embedded" ? "comment-section--embedded" : ""}`}
      glass={variant === "card" ? "card" : undefined}
      header={
        <div className="comment-head">
          <div>
            <span className="comment-eyebrow">DISCUSSION</span>
            <h2>{title}<span>{count}</span></h2>
          </div>
          <MessageCircle size={18} />
        </div>
      }
      beforeList={
        <>
          {readOnly ? (
            <div className="comment-login-hint">该歌曲当前不可播放，评论暂时只读</div>
          ) : canComment ? (
            <div
              ref={composerRef}
              className={`comment-composer ${variant === "embedded" ? "sticky-bar comment-sticky-bar" : ""} ${expanded ? "is-expanded" : ""}`}
              // 收起状态下整条框都可以点：否则用户点边框/padding 没反应（移动端尤其明显）
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("button")) return;
                if (!expanded) focusComposer();
              }}
            >
              <div className="comment-avatar">
                {user?.avatar ? <img src={user.avatar} alt="" /> : (user?.nickname || user?.username || "我").slice(0, 1)}
              </div>
              <div className="comment-composer-body">
                <AutoGrowTextarea
                  value={content}
                  onChange={setContent}
                  onSubmit={() => void submit()}
                  placeholder="写下你的想法..."
                  minRows={1}
                  maxRows={4}
                  ariaLabel="评论内容"
                  className="comment-textarea"
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
        </>
      }
      loading={loading ? <div className="comment-loading"><Loader2 className="animate-spin" size={16} /> 正在加载评论…</div> : undefined}
      empty={
        emptyTitle || emptyDescription ? (
          <div className="comment-empty">
            {emptyTitle && <strong>{emptyTitle}</strong>}
            {emptyDescription && <span>{emptyDescription}</span>}
            <div className="comment-empty-actions">
              <button
                type="button"
                onClick={() => {
                  if (canComment) focusComposer();
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
      }
    >
      {rootComments.map((comment) => (
        <div key={comment.id} id={`comment-${comment.id}`} className={highlightedId === comment.id ? "rounded-xl ring-2 ring-indigo-400/60" : ""}>
        <MessageItemShell
          avatar={comment.avatar}
          fallback={(comment.author || "匿").slice(0, 1)}
          name={comment.author}
          time={formatDate(comment.createdAt)}
          density="comfortable"
          layout={itemLayout}
          actions={
            <div className="comment-actions" style={readOnly ? { pointerEvents: "none", opacity: 0.45 } : undefined}>
              <button
                type="button"
                onClick={() => void react(comment, "LIKE")}
                disabled={!user || comment.userId === user.id}
                className={comment.myReaction === "LIKE" ? "is-active" : ""}
                aria-label="点赞"
              >
                <ThumbsUp size={13} /> {comment.likeCount}
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
              <button
                type="button"
                onClick={() => {
                  setReplyingRootId((current) => current === comment.id ? null : comment.id);
                  setReplyTarget(null);
                }}
                aria-label="回复楼主"
              >
                <MessageCircle size={13} /> 回复
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
          }
        >
          {comment.content}
        </MessageItemShell>
        {expandedRootId !== comment.id && ((replyCounts.get(comment.id) || 0) + (localReplies[comment.id]?.length || 0)) > 0 && previewTops.get(comment.id) && (
          <CommentThreadPreview
            reply={previewTops.get(comment.id)!}
            extraReplies={topReplies.has(comment.id) ? (localReplies[comment.id] || []) : (localReplies[comment.id] || []).slice(1)}
            count={(replyCounts.get(comment.id) || 0) + (localReplies[comment.id]?.length || 0)}
            onExpand={() => {
              setExpandedRootId(comment.id);
              setReplyTarget(null);
              setReplyingRootId(null);
              setLocalReplies((prev) => {
                const next = { ...prev };
                delete next[comment.id];
                return next;
              });
            }}
            onReply={() => {
              const top = previewTops.get(comment.id);
              if (!top) return;
              setReplyingRootId(comment.id);
              setReplyTarget({ rootId: comment.id, id: top.id, author: top.author });
            }}
          />
        )}
        {replyingRootId === comment.id && (
          <CommentComposer
            targetType={targetType as "POST" | "MOMENT" | "ARTICLE" | "PROJECT" | "ALBUM" | "TRACK"}
            targetId={targetId}
            parentId={replyTarget?.rootId === comment.id ? replyTarget.id : comment.id}
            replyingTo={replyTarget?.rootId === comment.id ? replyTarget : { author: comment.author }}
            onCancelReply={() => {
              setReplyingRootId(null);
              setReplyTarget(null);
            }}
            onSubmitted={(created) => {
              if (created) {
                setLocalReplies((prev) => ({
                  ...prev,
                  [comment.id]: [...(prev[comment.id] || []), created as CommentItem],
                }));
              }
              setReplyingRootId(null);
              setReplyTarget(null);
            }}
          />
        )}
        {expandedRootId === comment.id && (
          <InlineCommentThread
            rootId={comment.id}
            targetType={targetType as "POST" | "MOMENT" | "ARTICLE" | "PROJECT" | "ALBUM" | "TRACK"}
            targetId={targetId}
            startReply={replyTarget?.rootId === comment.id ? replyTarget : null}
            onCollapse={() => {
              setExpandedRootId(null);
              setReplyTarget(null);
            }}
            onSubmitted={() => void load()}
          />
        )}
        </div>
      ))}
    </MessageListShell>

    {variant === "card" && showStickyComposer && mounted && createPortal(
      <div
        className="fixed inset-x-0 z-[9999] border-t border-white/20 bg-white/90 p-2 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90"
        style={{ bottom: `calc(${keyboardInset}px + env(safe-area-inset-bottom))`, paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <span className="shrink-0 text-[11px] font-bold text-slate-500">{user?.nickname || user?.username || "我"}</span>
          <AutoGrowTextarea
            value={content}
            onChange={setContent}
            onSubmit={() => void submit()}
            placeholder="继续写根评论…"
            maxRows={2}
            ariaLabel="继续写根评论"
            className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/60 px-3 py-1.5 text-base text-slate-700 outline-none sm:text-xs dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
          />
          <button type="button" onClick={() => void submit()} disabled={sending || !content.trim()} className="rounded-full bg-indigo-500 px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-40">
            {sending ? <Loader2 size={12} className="animate-spin" /> : "发送"}
          </button>
        </div>
      </div>,
      document.body
    )}
    </div>
  );
}
