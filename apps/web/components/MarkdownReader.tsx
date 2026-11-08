"use client";

import { useEffect, useState } from "react";
import { glassProps } from "./ui/glass/GlassSurface";
import ReadingSurface from "./reading/ReadingSurface";
import ReadingProse from "./reading/ReadingProse";
import { resolveReadingScheme, useSiteDark, type ReadingScheme } from "./reading/useReadingScheme";

type MarkdownTheme = "classic" | "github-light" | "github-dark";

const THEME_STORAGE_KEY = "markdown-reader-theme";

const THEMES: Array<{ value: MarkdownTheme; label: string; hint: string }> = [
  { value: "classic", label: "本站", hint: "当前笔记样式" },
  { value: "github-light", label: "GitHub 日间", hint: "GitHub 浅色 Markdown" },
  { value: "github-dark", label: "GitHub 夜间", hint: "GitHub 深色 Markdown" },
];

function isMarkdownTheme(value: string | null): value is MarkdownTheme {
  return value === "classic" || value === "github-light" || value === "github-dark";
}

export default function MarkdownReader({ html }: { html: string }) {
  const [theme, setTheme] = useState<MarkdownTheme>("classic");
  const isDark = useSiteDark();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (isMarkdownTheme(stored)) setTheme(stored);
    } catch {
      // ignore storage errors
    }
  }, []);

  const changeTheme = (next: MarkdownTheme) => {
    setTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  };

  const contentClass = "markdown-content markdown-body";
  const mode: "classic" | "github" = theme === "classic" ? "classic" : "github";
  const scheme: ReadingScheme =
    theme === "classic" ? "auto" : theme === "github-light" ? "light" : "dark";
  const resolvedScheme = resolveReadingScheme(scheme, isDark);

  return (
    <ReadingSurface
      className="markdown-reader"
      mode={mode}
      scheme={scheme}
      resolvedScheme={resolvedScheme}
      siteTheme={theme}
      toolbar={
        <div className="markdown-theme-bar">
          <span className="markdown-theme-label">阅读主题</span>
          <div {...glassProps("field", "suspend", "markdown-theme-options")} role="group" aria-label="Markdown 阅读主题">
            {THEMES.map((option) => (
              <button
                key={option.value}
                type="button"
                title={option.hint}
                aria-pressed={theme === option.value}
                onClick={() => changeTheme(option.value)}
                className={`markdown-theme-option ${theme === option.value ? "is-active" : ""}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <ReadingProse
        html={html}
        className={`${contentClass} ${theme === "classic" ? "markdown-body--site" : ""} transition-colors duration-300`}
      />
    </ReadingSurface>
  );
}
