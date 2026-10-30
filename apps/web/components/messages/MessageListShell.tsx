"use client";

import { Children, type ReactNode } from "react";

export type MessageSurface = "plain" | "panel" | "ghost";
export type MessageDensity = "compact" | "comfortable";

export interface MessageListShellProps {
  title?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  count?: ReactNode;
  icon?: ReactNode;

  header?: ReactNode;
  toolbar?: ReactNode;
  headerActions?: ReactNode;
  beforeList?: ReactNode;
  footer?: ReactNode;

  children?: ReactNode;
  empty?: ReactNode;
  loading?: ReactNode;

  surface?: MessageSurface;
  density?: MessageDensity;
  divider?: boolean;
  className?: string;
  listClassName?: string;
}

/**
 * Layout-only shell for comment and guestbook feeds.
 *
 * It owns the list region, heading, toolbar and empty/loading states.
 * It intentionally does not own fetching, submitting, deleting or
 * page-level card styling.
 */
export default function MessageListShell({
  title,
  description,
  eyebrow,
  count,
  icon,
  header,
  toolbar,
  headerActions,
  beforeList,
  footer,
  children,
  empty,
  loading,
  surface = "plain",
  density = "compact",
  divider = true,
  className = "",
  listClassName = "",
}: MessageListShellProps) {
  const hasChildren = Children.count(children) > 0;

  return (
    <section
      className={`message-list message-list--${surface} message-list--${density} ${
        divider ? "message-list--divided" : ""
      } ${className}`}
    >
      {header ? (
        header
      ) : (
        (title || description || toolbar || headerActions) && (
          <div className="message-list-head">
            <div className="message-list-heading">
              {icon && <span className="message-list-icon">{icon}</span>}
              <div className="message-list-heading-copy">
                {eyebrow && <div className="message-list-eyebrow">{eyebrow}</div>}
                <div className="message-list-title-row">
                  {title && <h2 className="message-list-title">{title}</h2>}
                  {count !== undefined && count !== null && (
                    <span className="message-list-count">{count}</span>
                  )}
                </div>
                {description && <p className="message-list-description">{description}</p>}
              </div>
            </div>
            {(toolbar || headerActions) && (
              <div className="message-list-toolbar">
                {toolbar}
                {headerActions}
              </div>
            )}
          </div>
        )
      )}

      {beforeList}

      {loading ? (
        <div className="message-list-state">{loading}</div>
      ) : !hasChildren ? (
        <div className="message-list-state message-list-empty">{empty}</div>
      ) : (
        <div className={`message-list-body ${listClassName}`}>{children}</div>
      )}

      {footer}
    </section>
  );
}
