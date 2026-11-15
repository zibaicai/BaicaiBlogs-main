"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import MomentCard, { type MomentStory } from "../MomentCard";
import MomentComments from "../comments/MomentComments";

export default function MomentOverlay({
  moment,
  side,
  anchorRect,
  onClose,
}: {
  moment: MomentStory;
  side: "left" | "right";
  anchorRect: DOMRect;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onScroll = () => onClose();
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = Math.min(720, viewportWidth - 32);
  const preferredLeft = side === "left" ? anchorRect.left : anchorRect.right - width;
  const left = Math.min(Math.max(16, preferredLeft), viewportWidth - width - 16);
  const top = Math.min(Math.max(88, anchorRect.top - 12), Math.max(88, viewportHeight - 180));

  return createPortal(
    <div className="moment-overlay-root">
      <button type="button" className="moment-overlay-scrim" aria-label="关闭留言" onClick={onClose} />
      <div
        className="moment-expanded-surface"
        role="dialog"
        aria-modal="true"
        aria-label={`${moment.authorName || "匿名用户"}的说说留言`}
        style={{ top, left, width }}
      >
        <button ref={closeRef} type="button" className="moment-overlay-close" onClick={onClose} aria-label="关闭留言">
          <X size={16} />
        </button>

        <MomentCard
          moment={moment}
          side={side}
          commentCount={commentCount}
          variant="overlay"
          comments={
            moment.id ? (
              <MomentComments momentId={moment.id} onCountChange={setCommentCount} />
            ) : (
              <p className="moment-comments-empty">留言暂不可用。</p>
            )
          }
          onCloseComments={onClose}
        />
      </div>
    </div>,
    document.body
  );
}
