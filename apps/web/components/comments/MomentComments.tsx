"use client";

import { useCallback, useEffect, useState } from "react";
import { AtSign, Loader2, Send, Trash2 } from "lucide-react";
import { formatDate } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import AutoGrowTextarea from "../ui/AutoGrowTextarea";

export interface MomentComment {
  id: number;
  author: string;
  avatar?: string;
  content: string;
  createdAt: string;
  userId?: number;
  canDelete?: boolean;
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

export default function MomentComments({
  momentId,
  onCountChange,
}: {
  momentId: number;
  onCountChange?: (count: number) => void;
}) {
  const { user, loading: authLoading } = useAuth();
  const [comments, setComments] = useState<MomentComment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [mention, setMention] = useState<string | null>(null);
  const focusComposer = () => {
    window.setTimeout(() => {
      document.querySelector<HTMLTextAreaElement>(".moment-composer-input")?.focus();
    }, 0);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await commentRequest<MomentComment[]>(
        `/public/comments?targetType=MOMENT&targetId=${encodeURIComponent(String(momentId))}`
      );
      setComments(Array.isArray(data) ? data : []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "留言加载失败");
    } finally {
      setLoading(false);
    }
  }, [momentId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    onCountChange?.(comments.length);
  }, [comments.length, onCountChange]);

  const visibleComments = comments.slice(0, 10);
  const canComment = Boolean(user) && !authLoading;

  const mentionAuthor = (author: string) => {
    setMention(author);
    setContent((current) => (current.startsWith(`@${author}`) ? current : `@${author} ${current}`));
    focusComposer();
  };

  const submit = async () => {
    if (!canComment || sending) return;
    const value = content.trim();
    if (!value) return;
    setSending(true);
    setError("");
    try {
      const created = await commentRequest<MomentComment>("/user/comments", {
        method: "POST",
        body: JSON.stringify({ targetType: "MOMENT", targetId: momentId, content: value }),
      });
      setComments((current) => [created, ...current]);
      setContent("");
      setMention(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "留言失败");
    } finally {
      setSending(false);
    }
  };

  const remove = async (comment: MomentComment) => {
    if (!window.confirm("确定删除这条留言吗？")) return;
    try {
      await commentRequest(`/user/comments/${comment.id}`, { method: "DELETE" });
      setComments((current) => current.filter((item) => item.id !== comment.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "删除失败");
    }
  };

  return (
    <section className="moment-comments" aria-label="说说留言">
      <div className="moment-comments-head">
        <span>留言</span>
        <span>{comments.length > 10 ? `最近 10 / 共 ${comments.length} 条` : `${comments.length} 条`}</span>
      </div>

      {loading ? (
        <div className="moment-comments-state">
          <Loader2 className="animate-spin" size={14} /> 正在加载留言…
        </div>
      ) : visibleComments.length === 0 ? (
        <p className="moment-comments-empty">还没有留言，来@第一个留言者吧。</p>
      ) : (
        <div className="moment-comments-list">
          {visibleComments.map((comment) => (
            <div className="moment-comment" key={comment.id}>
              <span className="moment-avatar moment-comment-avatar">
                {comment.avatar ? <img src={comment.avatar} alt="" /> : (comment.author || "匿").slice(0, 1)}
              </span>
              <div className="moment-comment-main">
                <div className="moment-comment-meta">
                  <strong>{comment.author}</strong>
                  <time>{formatDate(comment.createdAt)}</time>
                </div>
                <p>{comment.content}</p>
                <div className="moment-comment-actions">
                  <button type="button" onClick={() => mentionAuthor(comment.author)}>
                    <AtSign size={12} /> {comment.author}
                  </button>
                  {comment.canDelete && (
                    <button type="button" onClick={() => void remove(comment)} aria-label="删除留言">
                      <Trash2 size={12} /> 删除
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {comments.length > 10 && (
        <p className="moment-comments-note">仅显示最近 10 条留言，保持气泡高度稳定。</p>
      )}

      {error && <p className="moment-comments-error">{error}</p>}

      {canComment ? (
        <div className="moment-composer">
          <div className="moment-composer-row">
            <span className="moment-avatar moment-comment-avatar">
              {user?.avatar ? <img src={user.avatar} alt="" /> : (user?.nickname || user?.username || "我").slice(0, 1)}
            </span>
            <AutoGrowTextarea
              value={content}
              onChange={(value) => {
                setContent(value);
                if (!value.trim()) setMention(null);
              }}
              onSubmit={() => void submit()}
              placeholder={mention ? `@${mention} 写下你的留言…` : "写下留言，可直接 @ 留言者…"}
              minRows={1}
              maxRows={3}
              ariaLabel="留言内容"
              className="moment-composer-input"
            />
            <button
              type="button"
              className="moment-composer-send"
              onClick={() => void submit()}
              disabled={sending || !content.trim()}
              aria-label="发送留言"
            >
              {sending ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
            </button>
          </div>
          {mention && <span className="moment-composer-mention">正在提及 @{mention}</span>}
        </div>
      ) : (
        <p className="moment-comments-login">
          <a href="/login">登录</a> 后参与留言，可直接 @ 留言者。
        </p>
      )}
    </section>
  );
}
