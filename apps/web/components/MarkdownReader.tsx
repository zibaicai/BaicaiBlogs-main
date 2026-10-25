"use client";

import { useEffect, useState } from "react";

type MarkdownTheme = "classic" | "github-light" | "github-dark";

const THEME_STORAGE_KEY = "markdown-reader-theme";

const THEMES: Array<{ value: MarkdownTheme; label: string; hint: string }> = [
  { value: "classic", label: "本站", hint: "当前文章样式" },
  { value: "github-light", label: "GitHub 日间", hint: "GitHub 浅色 Markdown" },
  { value: "github-dark", label: "GitHub 夜间", hint: "GitHub 深色 Markdown" },
];

function isMarkdownTheme(value: string | null): value is MarkdownTheme {
  return value === "classic" || value === "github-light" || value === "github-dark";
}

export default function MarkdownReader({ html }: { html: string }) {
  const [theme, setTheme] = useState<MarkdownTheme>("classic");

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

  const contentClass =
    theme === "classic"
      ? "markdown-content article-prose prose prose-slate dark:prose-invert prose-base md:prose-lg max-w-none"
      : "markdown-content markdown-body";

  return (
    <section className="markdown-reader" data-md-theme={theme}>
      <div className="markdown-theme-bar">
        <span className="markdown-theme-label">阅读主题</span>
        <div className="markdown-theme-options" role="group" aria-label="Markdown 阅读主题">
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

      <div
        className={`${contentClass} transition-colors duration-300`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
