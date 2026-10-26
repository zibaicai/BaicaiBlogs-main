"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark";

export interface ThemePalette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  accentContrast: string;
  success: string;
  warning: string;
  danger: string;
}

const STORAGE_KEY = "visitor-custom-themes";

const LIGHT_DEFAULT: ThemePalette = {
  bg: "#f8fafc",
  surface: "#ffffff",
  surfaceAlt: "#f1f5f9",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  accent: "#6366f1",
  accentContrast: "#ffffff",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
};

const DARK_DEFAULT: ThemePalette = {
  bg: "#020617",
  surface: "#0f172a",
  surfaceAlt: "#1e293b",
  text: "#f1f5f9",
  muted: "#94a3b8",
  border: "#334155",
  accent: "#818cf8",
  accentContrast: "#0f172a",
  success: "#34d399",
  warning: "#fbbf24",
  danger: "#f87171",
};

export const DEFAULT_THEME_PALETTES: Record<ThemeMode, ThemePalette> = {
  light: LIGHT_DEFAULT,
  dark: DARK_DEFAULT,
};

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
  mode: ThemeMode;
  customThemes: Record<ThemeMode, ThemePalette | null>;
  setCustomTheme: (mode: ThemeMode, palette: ThemePalette) => void;
  copyToOtherMode: (mode: ThemeMode) => void;
  resetCurrentTheme: (mode: ThemeMode) => void;
  resetAllThemes: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  toggleTheme: () => {},
  mode: "dark",
  customThemes: { light: null, dark: null },
  setCustomTheme: () => {},
  copyToOtherMode: () => {},
  resetCurrentTheme: () => {},
  resetAllThemes: () => {},
});

function applyPalette(palette: ThemePalette | null) {
  const root = document.documentElement;
  if (!palette) {
    root.removeAttribute("data-custom-theme");
    [
      "--ui-bg",
      "--ui-surface",
      "--ui-surface-alt",
      "--ui-text",
      "--ui-text-strong",
      "--ui-text-muted",
      "--ui-text-faint",
      "--ui-muted",
      "--ui-border",
      "--ui-border-strong",
      "--ui-accent",
      "--ui-accent-hover",
      "--ui-accent-contrast",
      "--ui-action",
      "--ui-action-hover",
      "--ui-action-contrast",
      "--ui-success",
      "--ui-warning",
      "--ui-danger",
      "--ui-secondary-bg",
      "--ui-secondary-text",
      "--ui-secondary-border",
    ].forEach((name) => root.style.removeProperty(name));
    return;
  }

  root.setAttribute("data-custom-theme", "true");
  root.style.setProperty("--ui-bg", palette.bg);
  root.style.setProperty("--ui-surface", palette.surface);
  root.style.setProperty("--ui-surface-alt", palette.surfaceAlt);
  root.style.setProperty("--ui-text", palette.text);
  root.style.setProperty("--ui-text-strong", palette.text);
  root.style.setProperty("--ui-text-muted", palette.muted);
  root.style.setProperty("--ui-text-faint", `color-mix(in srgb, ${palette.muted} 72%, transparent)`);
  root.style.setProperty("--ui-muted", palette.muted);
  root.style.setProperty("--ui-border", `color-mix(in srgb, ${palette.border} 55%, transparent)`);
  root.style.setProperty("--ui-border-strong", `color-mix(in srgb, ${palette.border} 78%, transparent)`);
  root.style.setProperty("--ui-accent", palette.accent);
  root.style.setProperty("--ui-accent-hover", palette.accent);
  root.style.setProperty("--ui-accent-contrast", palette.accentContrast);
  root.style.setProperty("--ui-action", `color-mix(in srgb, ${palette.accent} 58%, #111827)`);
  root.style.setProperty("--ui-action-hover", `color-mix(in srgb, ${palette.accent} 46%, #111827)`);
  root.style.setProperty("--ui-action-contrast", "#ffffff");
  root.style.setProperty("--ui-success", palette.success);
  root.style.setProperty("--ui-warning", palette.warning);
  root.style.setProperty("--ui-danger", palette.danger);
  root.style.setProperty("--ui-secondary-bg", palette.surfaceAlt);
  root.style.setProperty("--ui-secondary-text", palette.muted);
  root.style.setProperty("--ui-secondary-border", palette.border);
}

function loadThemes(): Record<ThemeMode, ThemePalette | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { light: null, dark: null };
    const parsed = JSON.parse(raw) as Partial<Record<ThemeMode, ThemePalette>>;
    return {
      light: parsed.light || null,
      dark: parsed.dark || null,
    };
  } catch {
    return { light: null, dark: null };
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [customThemes, setCustomThemes] = useState<Record<ThemeMode, ThemePalette | null>>({
    light: null,
    dark: null,
  });

  const mode: ThemeMode = isDark ? "dark" : "light";

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("blog-theme");
    // 默认日间模式：只有用户显式存过 "dark" 才用夜间
    const isDarkMode = savedTheme === "dark";
    setIsDark(isDarkMode);
    setCustomThemes(loadThemes());

    const root = document.documentElement;
    root.classList.toggle("dark", isDarkMode);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    applyPalette(customThemes[mode]);
  }, [isDark, mode, customThemes, mounted]);

  const persist = useCallback((themes: Record<ThemeMode, ThemePalette | null>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
    } catch {
      // ignore storage errors
    }
  }, []);

  const setCustomTheme = useCallback(
    (targetMode: ThemeMode, palette: ThemePalette) => {
      setCustomThemes((current) => {
        const next = { ...current, [targetMode]: palette };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const copyToOtherMode = useCallback(
    (sourceMode: ThemeMode) => {
      setCustomThemes((current) => {
        const other: ThemeMode = sourceMode === "light" ? "dark" : "light";
        const palette = current[sourceMode];
        if (!palette) return current;
        const next = { ...current, [other]: { ...palette } };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const resetCurrentTheme = useCallback(
    (targetMode: ThemeMode) => {
      setCustomThemes((current) => {
        const next = { ...current, [targetMode]: null };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const resetAllThemes = useCallback(() => {
    const next = { light: null, dark: null };
    setCustomThemes(next);
    persist(next);
  }, [persist]);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem("blog-theme", newDark ? "dark" : "light");
  };

  const value = useMemo(
    () => ({
      isDark,
      toggleTheme,
      mode,
      customThemes,
      setCustomTheme,
      copyToOtherMode,
      resetCurrentTheme,
      resetAllThemes,
    }),
    [isDark, mode, customThemes, setCustomTheme, copyToOtherMode, resetCurrentTheme, resetAllThemes]
  );

  if (!mounted) {
    return <div className="invisible">{children}</div>;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
