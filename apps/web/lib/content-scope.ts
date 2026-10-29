const SCOPED_PREFIXES = [
  "/api/public/posts",
  "/api/public/moments",
  "/api/public/projects",
  "/api/public/albums",
  "/api/public/gallery",
  "/api/public/articles",
];

/** Category, tag, config, friend and music endpoints remain site-level. */
export function isScopedPath(path: string): boolean {
  const normalized = path.startsWith("/api/") ? path : `/api${path}`;
  return SCOPED_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`) || normalized.startsWith(`${prefix}?`)
  );
}

export function withContentScope(path: string): string {
  if (typeof document === "undefined" || document.documentElement.dataset.personalView !== "on") {
    return path;
  }
  if (!isScopedPath(path)) return path;
  return `${path}${path.includes("?") ? "&" : "?"}scope=mine`;
}
