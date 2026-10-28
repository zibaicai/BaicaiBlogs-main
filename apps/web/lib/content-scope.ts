export function withContentScope(path: string): string {
  if (typeof document === "undefined" || document.documentElement.dataset.personalView !== "on") {
    return path;
  }
  return `${path}${path.includes("?") ? "&" : "?"}scope=mine`;
}
