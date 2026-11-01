"use client";

import { createElement, type ElementType, type ReactNode } from "react";

export type GlassVariant = "panel" | "card" | "popover" | "nav" | "subtle" | "control" | "field" | "overlay" | "badge" | "dock";
export type GlassScrollBehavior = "suspend" | "keep";
export type GlassScope = "content" | "background";

export interface GlassOptions {
  id?: string;
  scope?: GlassScope;
}

interface GlassSurfaceProps extends GlassOptions {
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

function resolveOptions(options?: string | GlassOptions): GlassOptions {
  if (typeof options === "string") return { id: options };
  return options || {};
}

/**
 * Shared glass props for polymorphic elements (motion wrappers, links, etc.).
 * Pass a semantic id as the fourth argument so the instance can be controlled
 * with setGlassEnabled("home.posts", false).
 */
export function glassProps(
  variant: GlassVariant = "panel",
  scroll: GlassScrollBehavior = "suspend",
  className = "",
  options?: string | GlassOptions
) {
  const { id, scope = "content" } = resolveOptions(options);
  return {
    className: glassClassName(variant, scroll, className),
    "data-glass": "true",
    ...(id ? { "data-glass-id": id } : {}),
    "data-glass-variant": variant,
    "data-glass-scroll": scroll,
    "data-glass-scope": scope,
  };
}

export function setGlassEnabled(id: string, enabled: boolean) {
  if (typeof document === "undefined") return;
  const escaped = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(id) : id;
  document.querySelectorAll<HTMLElement>(`[data-glass-id="${escaped}"]`).forEach((element) => {
    element.toggleAttribute("data-glass-disabled", !enabled);
  });
}

export function getGlassEnabled(id: string) {
  if (typeof document === "undefined") return true;
  const escaped = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(id) : id;
  const element = document.querySelector<HTMLElement>(`[data-glass-id="${escaped}"]`);
  return !element?.hasAttribute("data-glass-disabled");
}

/**
 * Disable a whole class of surfaces without maintaining a list of page
 * selectors. Scope defaults to content; background.blur is explicitly marked
 * as background in ThemeBackdrop.
 */
export function setGlassScopeEnabled(scope: GlassScope, enabled: boolean) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const key = scope === "background" ? "glassBackground" : "glassContent";
  if (enabled) delete root.dataset[key];
  else root.dataset[key] = "off";
}

export function getGlassScopeEnabled(scope: GlassScope) {
  if (typeof document === "undefined") return true;
  const root = document.documentElement;
  const key = scope === "background" ? "glassBackground" : "glassContent";
  return root.dataset[key] !== "off";
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
  glassId,
  scope = "content",
  className = "",
  children,
  ...rest
}: GlassSurfaceProps & { glassId?: string }) {
  return createElement(
    as,
    {
      ...rest,
      ...glassProps(variant, scroll, className, {
        ...(glassId ? { id: glassId } : {}),
        scope,
      }),
    },
    children
  );
}
