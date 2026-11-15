"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { useRef } from "react";
import { formatDate } from "../lib/api";

export interface MomentStory {
  id?: number;
  slug: string;
  htmlContent?: string;
  content?: string;
  date: string;
  images?: string[];
  visibility?: string;
  authorId?: number;
  authorName?: string;
  authorAvatar?: string;
}

export default function MomentCard({
  moment,
  commentCount = 0,
  side = "left",
  onOpenComments,
  onCloseComments,
  comments,
  variant = "feed",
  isExpanded = false,
}: {
  moment: MomentStory;
  commentCount?: number;
  side?: "left" | "right";
  onOpenComments?: (rect: DOMRect) => void;
  onCloseComments?: () => void;
  comments?: ReactNode;
  variant?: "feed" | "overlay";
  isExpanded?: boolean;
}) {
  const resourceRef = useRef<HTMLDivElement>(null);
  const images = (moment.images || []).slice(0, 9);
  const total = moment.images?.length || 0;
  const html = moment.htmlContent || moment.content || "";
  const fallbackAuthor = moment.authorName || "匿名用户";

  const openComments = () => {
    if (!resourceRef.current) return;
    onOpenComments?.(resourceRef.current.getBoundingClientRect());
  };

  return (
    <div
      ref={resourceRef}
      className={`moment-resource moment-resource--${side} ${isExpanded ? "moment-resource--expanded" : ""}`}
      aria-hidden={isExpanded || undefined}
    >
      <div className="moment-person">
        <span className="moment-avatar">
          {moment.authorAvatar ? <img src={moment.authorAvatar} alt="" /> : fallbackAuthor.slice(0, 1)}
        </span>
        <strong>{fallbackAuthor}</strong>
      </div>

      <article className="moment-card" id={variant === "feed" ? moment.slug : undefined}>
        <div className="moment-head">
          <time>{formatDate(moment.date)}</time>
          {moment.visibility === "PRIVATE" && (
            <span className="archive-badge archive-badge-sky">
              <Lock size={9} /> 仅自己可见
            </span>
          )}
        </div>

        <div
          className="moment-text article-prose prose prose-slate dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {images.length > 0 && (
          <div className="moment-image-wrap">
            <div className="moment-images" data-count={Math.min(images.length, 9)}>
              {images.map((image, index) => (
                <a
                  key={image}
                  href={image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="moment-image"
                  aria-label={`查看第 ${index + 1} 张图片`}
                >
                  <img src={image} alt="" loading="lazy" />
                </a>
              ))}
            </div>
            {total > 4 && <span className="moment-more moment-more-desktop">+{total - 4}</span>}
            {total > 9 && <span className="moment-more moment-more-mobile">+{total - 9}</span>}
          </div>
        )}

        {comments}

        <div className="moment-foot">
          <span>{commentCount > 0 ? `${commentCount} 条留言` : "留言"}</span>
          {onOpenComments ? (
            <button type="button" className="moment-permalink" onClick={openComments}>
              查看留言 →
            </button>
          ) : onCloseComments ? (
            <button type="button" className="moment-permalink" onClick={onCloseComments}>
              收起留言 ↑
            </button>
          ) : (
            <Link href={`/moments/${encodeURIComponent(moment.slug)}`} className="moment-permalink">
              查看 →
            </Link>
          )}
        </div>
      </article>
    </div>
  );
}

export type MomentResourceRef = RefObject<HTMLDivElement | null>;
