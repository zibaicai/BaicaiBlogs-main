"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type FontPreset = "editorial" | "modern" | "system";

type FontTokens = {
  body: string;
  serif: string;
  display: string;
  mono: string;
};

/**
 * Font presets are intentionally data-only. Adding a new preset here is enough
 * for every component that uses --font-body / --font-serif / --font-mono.
 */
export const FONT_PRESETS: Record<FontPreset, FontTokens> = {
  editorial: {
    body: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Noto Sans", sans-serif',
    serif: '"Source Han Serif SC", "Noto Serif SC", "Songti SC", "SimSun", Georgia, serif',
    display: '"Source Han Serif SC", "Noto Serif SC", "Songti SC", Georgia, serif',
    mono: '"JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
  },
  modern: {
    body: '"Inter", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    serif: '"Noto Serif SC", "Source Han Serif SC", "Songti SC", Georgia, serif',
    display: '"Inter", "Noto Sans SC", "PingFang SC", sans-serif',
    mono: '"JetBrains Mono", "Cascadia Code", Consolas, monospace',
  },
  system: {
    body: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif',
    serif: 'ui-serif, Georgia, "Times New Roman", "Songti SC", serif',
    display: 'ui-serif, Georgia, "Times New Roman", "Songti SC", serif',
    mono: 'ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace',
  },
};

const STORAGE_KEY = "font-preset";

interface TypographyContextValue {
  preset: FontPreset;
  setPreset: (preset: FontPreset) => void;
}

const TypographyContext = createContext<TypographyContextValue>({
  preset: "editorial",
  setPreset: () => {},
});

function applyFontPreset(preset: FontPreset) {
  const root = document.documentElement;
  const tokens = FONT_PRESETS[preset] || FONT_PRESETS.editorial;
  root.dataset.fontPreset = preset;
  root.style.setProperty("--font-body", tokens.body);
  root.style.setProperty("--font-serif", tokens.serif);
  root.style.setProperty("--font-display", tokens.display);
  root.style.setProperty("--font-mono", tokens.mono);
}

export function TypographyProvider({ children }: { children: ReactNode }) {
  const [preset, setPresetState] = useState<FontPreset>("editorial");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as FontPreset | null;
    const next = saved && FONT_PRESETS[saved] ? saved : "editorial";
    setPresetState(next);
    applyFontPreset(next);
  }, []);

  const setPreset = useCallback((next: FontPreset) => {
    setPresetState(next);
    applyFontPreset(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  }, []);

  const value = useMemo(() => ({ preset, setPreset }), [preset, setPreset]);

  return <TypographyContext.Provider value={value}>{children}</TypographyContext.Provider>;
}

export function useTypography() {
  return useContext(TypographyContext);
}
