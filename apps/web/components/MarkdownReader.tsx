"use client";

import ReadingSurface from "./reading/ReadingSurface";
import ReadingProse from "./reading/ReadingProse";
import ReadingToolbar from "./reading/ReadingToolbar";
import { useReadingTheme } from "./reading/useReadingTheme";

export default function MarkdownReader({ html }: { html: string }) {
  const { theme, setTheme, mode, scheme, resolvedScheme } = useReadingTheme();
  const contentClass = "markdown-content markdown-body";

  return (
    <ReadingSurface
      className="markdown-reader"
      mode={mode}
      scheme={scheme}
      resolvedScheme={resolvedScheme}
      siteTheme={theme}
      toolbar={<ReadingToolbar theme={theme} onChange={setTheme} />}
    >
      <ReadingProse
        html={html}
        className={`${contentClass} ${theme === "classic" ? "markdown-body--site" : ""} transition-colors duration-300`}
      />
    </ReadingSurface>
  );
}
