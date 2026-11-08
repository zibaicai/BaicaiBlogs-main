"use client";

import type { MouseEventHandler } from "react";

/**
 * Shared long-form content surface.
 * Layout/theme stay on ReadingSurface; this component only carries the prose class.
 */
export default function ReadingProse({
  html,
  className = "",
  onClick,
}: {
  html: string;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}) {
  return (
    <div
      className={`reading-prose ${className}`.trim()}
      onClickCapture={onClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
