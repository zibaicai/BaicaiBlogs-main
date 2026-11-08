"use client";

import type { MouseEventHandler } from "react";
import { useReadingContext } from "./ReadingContext";

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
  const reading = useReadingContext();
  return (
    <div
      ref={reading?.contentRef}
      className={`reading-prose ${className}`.trim()}
      onClickCapture={onClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
