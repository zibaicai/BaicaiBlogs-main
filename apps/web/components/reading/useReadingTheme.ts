"use client";

import { useCallback, useEffect, useState } from "react";
import { resolveReadingScheme, useSiteDark, type ReadingScheme } from "./useReadingScheme";

export type ReadingTheme = "classic" | "github-light" | "github-dark";
export type ReadingMode = "classic" | "github";

export const READING_THEMES: Array<{ value: ReadingTheme; label: string; hint: string }> = [
  { value: "classic", label: "本站", hint: "跟随站点明暗" },
  { value: "github-light", label: "GitHub 日间", hint: "GitHub 浅色 Markdown" },
  { value: "github-dark", label: "GitHub 夜间", hint: "GitHub 深色 Markdown" },
];

const STORAGE_KEY = "markdown-reader-theme";

export function isReadingTheme(value: string | null): value is ReadingTheme {
  return value === "classic" || value === "github-light" || value === "github-dark";
}

export function useReadingTheme() {
  const [theme, setThemeState] = useState<ReadingTheme>("classic");
  const isDark = useSiteDark();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isReadingTheme(stored)) setThemeState(stored);
    } catch {
      // ignore storage errors
    }
  }, []);

  const setTheme = useCallback((next: ReadingTheme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  }, []);

  const mode: ReadingMode = theme === "classic" ? "classic" : "github";
  const scheme: ReadingScheme =
    theme === "classic" ? "auto" : theme === "github-light" ? "light" : "dark";

  return {
    theme,
    setTheme,
    mode,
    scheme,
    resolvedScheme: resolveReadingScheme(scheme, isDark),
  };
}
