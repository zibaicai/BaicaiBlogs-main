"use client";

import type { ReactNode } from "react";
import { OptimizedImage } from "../ui/OptimizedImage";

export type MessageItemSurface = "plain" | "card" | "ghost";
export type MessageItemDensity = "compact" | "comfortable";
export type MessageAvatarSize = "sm" | "md" | "lg";

export interface MessageItemShellProps {
  avatar?: string | null;
  avatarAlt?: string;
  fallback?: string;

  name?: ReactNode;
  time?: ReactNode;
  meta?: ReactNode;
  badges?: ReactNode;

  children?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;

  surface?: MessageItemSurface;
  density?: MessageItemDensity;
  avatarSize?: MessageAvatarSize;
  className?: string;
}

/**
 * Presentation-only shell for one message/comment row.
 * The feature component supplies the author, time, content and actions.
 */
export default function MessageItemShell({
  avatar,
  avatarAlt = "",
  fallback,
  name,
  time,
  meta,
  badges,
  children,
  actions,
  footer,
  surface = "plain",
  density = "compact",
  avatarSize,
  className = "",
}: MessageItemShellProps) {
  const initial = (fallback || (typeof name === "string" ? name : "匿")).slice(0, 1);

  return (
    <article
      className={`message-item message-item--${surface} message-item--${density} ${
        avatarSize ? `message-item--avatar-${avatarSize}` : ""
      } ${className}`}
    >
      <div className="message-item-avatar">
        {avatar ? (
          <OptimizedImage src={avatar} alt={avatarAlt} className="message-item-avatar-image" />
        ) : (
          initial
        )}
      </div>

      <div className="message-item-main">
        <div className="message-item-head">
          <div className="message-item-identity">
            {name && <strong className="message-item-name">{name}</strong>}
            {time && <time className="message-item-time">{time}</time>}
            {meta && <span className="message-item-meta">{meta}</span>}
            {badges && <span className="message-item-badges">{badges}</span>}
          </div>
          {actions && <div className="message-item-actions">{actions}</div>}
        </div>

        {children && <div className="message-item-content">{children}</div>}
        {footer && <div className="message-item-footer">{footer}</div>}
      </div>
    </article>
  );
}
