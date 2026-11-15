"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const closeTimerRef = useRef<number | null>(null);
  const closingRef = useRef(false);
  const [commentCount, setCommentCount] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(onClose, 150);
  }, [onClose]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    const onScroll = () => requestClose();
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll);
    };
  }, [requestClose]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  if (typeof document === "undefined") return null;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = Math.min(anchorRect.width + 20, viewportWidth - 24);
  const preferredLeft = anchorRect.left - 10;
  const left = Math.min(Math.max(12, preferredLeft), Math.max(12, viewportWidth - width - 12));
  const top = Math.min(Math.max(12, anchorRect.top - 10), Math.max(12, viewportHeight - 160));
  const closeTop = Math.max(0, top - 14);
  const closeLeft = Math.min(left + width - 16, viewportWidth - 40);

  return createPortal(
    <div className="moment-overlay-root">
      <button type="button" className="moment-overlay-catcher" aria-label="关闭留言" onClick={requestClose} />
      <div
        className={`moment-expanded-surface${isClosing ? " is-closing" : ""}`}
        role="dialog"
        aria-label={`${moment.authorName || "匿名用户"}的说说留言`}
        style={{ top, left, width }}
      >
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
          onCloseComments={requestClose}
        />
      </div>
      <button
        ref={closeRef}
        type="button"
        className="moment-overlay-close"
        style={{ top: closeTop, left: closeLeft }}
        onClick={requestClose}
        aria-label="关闭留言"
      >
        <X size={16} />
      </button>
    </div>,
    document.body
  );
}
