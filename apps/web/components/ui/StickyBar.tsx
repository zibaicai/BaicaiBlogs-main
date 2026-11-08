"use client";

import type { ReactNode } from "react";

/**
 * Generic sticky bar.
 * Position is controlled by the consumer:
 *   --sticky-top
 *   --sticky-z
 */
export default function StickyBar({
  children,
  className = "",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <div className={`sticky-bar ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
