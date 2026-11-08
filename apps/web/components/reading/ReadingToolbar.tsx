"use client";

import { glassProps } from "../ui/glass/GlassSurface";
import { READING_THEMES, type ReadingTheme } from "./useReadingTheme";

export default function ReadingToolbar({
  theme,
  onChange,
}: {
  theme: ReadingTheme;
  onChange: (theme: ReadingTheme) => void;
}) {
  return (
    <div className="markdown-theme-bar">
      <span className="markdown-theme-label">阅读主题</span>
      <div {...glassProps("field", "suspend", "markdown-theme-options")} role="group" aria-label="阅读主题">
        {READING_THEMES.map((option) => (
          <button
            key={option.value}
            type="button"
            title={option.hint}
            aria-pressed={theme === option.value}
            onClick={() => onChange(option.value)}
            className={`markdown-theme-option ${theme === option.value ? "is-active" : ""}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
