"use client";

import type { ReactNode } from "react";

export type ReadingMode = "classic" | "github";
export type ReadingScheme = "auto" | "light" | "dark";

/**
 * Long-form reading shell.
 * Owns theme state attributes only; typography lives in ReadingProse.
 */
export default function ReadingSurface({
  mode,
  scheme,
  resolvedScheme,
  variant = "note",
  siteTheme,
  toolbar,
  className = "",
  children,
}: {
  mode: ReadingMode;
  scheme: ReadingScheme;
  resolvedScheme: "light" | "dark";
  variant?: "note" | "article";
  siteTheme?: string;
  toolbar?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`reading-surface reading-surface--${variant} ${className}`.trim()}
      data-reading-mode={mode}
      data-reading-scheme={scheme}
      data-reading-resolved-scheme={resolvedScheme}
      data-site-theme={siteTheme}
    >
      {toolbar}
      {children}
    </section>
  );
}
