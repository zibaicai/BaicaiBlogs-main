"use client";

import { createElement, type ElementType, type ReactNode } from "react";

export type GlassVariant = "panel" | "card" | "popover" | "nav" | "subtle" | "control" | "field" | "overlay" | "badge" | "dock";
export type GlassScrollBehavior = "suspend" | "keep";

interface GlassSurfaceProps {
  as?: ElementType;
  variant?: GlassVariant;
  scroll?: GlassScrollBehavior;
  className?: string;
  children?: ReactNode;
  [key: string]: unknown;
}

export function glassClassName(
  variant: GlassVariant = "panel",
  scroll: GlassScrollBehavior = "suspend",
  className = ""
) {
  return ["glass", `glass--${variant}`, scroll === "keep" ? "glass--scroll-keep" : "", className]
    .filter(Boolean)
    .join(" ");
}

export function glassProps(
  variant: GlassVariant = "panel",
  scroll: GlassScrollBehavior = "suspend",
  className = ""
) {
  return {
    className: glassClassName(variant, scroll, className),
    "data-glass": "true",
    "data-glass-variant": variant,
    "data-glass-scroll": scroll,
  };
}

/**
 * A visual-only glass surface. Layout, spacing, semantics and content stay
 * with the consuming component. `as` allows links, sections and motion
 * wrappers to opt in without an extra DOM layer.
 */
export default function GlassSurface({
  as = "div",
  variant = "panel",
  scroll = "suspend",
  className = "",
  children,
  ...rest
}: GlassSurfaceProps) {
  return createElement(
    as,
    {
      ...rest,
      ...glassProps(variant, scroll, className),
    },
    children
  );
}
