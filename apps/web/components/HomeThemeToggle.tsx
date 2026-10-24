"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function HomeThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button type="button" onClick={toggleTheme} className="hv-theme">
      <span className="hv-theme-icon">{isDark ? <Moon size={16} /> : <Sun size={16} />}</span>
      <span className="hv-theme-copy">
        <span className="hv-profile-label">APPEARANCE</span>
        <strong>{isDark ? "夜间模式" : "日间模式"}</strong>
      </span>
      <span className="hv-theme-switch" aria-hidden="true">
        <i />
      </span>
    </button>
  );
}
