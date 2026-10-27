"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function HomeThemeToggle({ updatedAt }: { updatedAt?: string }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button type="button" onClick={toggleTheme} className="hv-theme">
      <span className="hv-theme-icon">{isDark ? <Moon size={14} /> : <Sun size={14} />}</span>
      <span className="hv-theme-label">{isDark ? "夜间模式" : "日间模式"}</span>
      {updatedAt && <span className="hv-theme-updated">UPDATED {updatedAt}</span>}
      <span className="hv-theme-switch" aria-hidden="true">
        <i />
      </span>
    </button>
  );
}
