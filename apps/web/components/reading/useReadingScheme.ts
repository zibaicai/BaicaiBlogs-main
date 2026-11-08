"use client";

import { useEffect, useState } from "react";

export type ReadingScheme = "auto" | "light" | "dark";

export function useSiteDark() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export function resolveReadingScheme(
  scheme: ReadingScheme,
  isDark: boolean
): "light" | "dark" {
  if (scheme === "auto") return isDark ? "dark" : "light";
  return scheme;
}
