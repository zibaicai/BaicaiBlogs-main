"use client";

import type { ElementType, ReactNode } from "react";

/**
 * Generic sticky shell.
 * Position is controlled by the consumer via CSS variables:
 *   --sticky-top
 *   --sticky-max-height
 *   --sticky-overflow
 *
 * The consumer must provide a non-clipping scroll ancestor and a
 * containing block taller than the panel.
 */
export default function StickyPanel({
  as: Tag = "div",
  header,
  footer,
  children,
  className = "",
  bodyClassName = "",
  scroll = false,
  ...rest
}: {
  as?: ElementType;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  scroll?: boolean;
  [key: string]: unknown;
}) {
  return (
    <Tag className={`sticky-panel ${className}`.trim()} {...rest}>
      {header && <div className="sticky-panel-header">{header}</div>}
      <div
        className={`sticky-panel-body ${bodyClassName}`.trim()}
        style={scroll ? { ["--sticky-overflow" as string]: "auto" } : undefined}
      >
        {children}
      </div>
      {footer && <div className="sticky-panel-footer">{footer}</div>}
    </Tag>
  );
}
