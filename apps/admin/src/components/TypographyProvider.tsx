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

export type AdminFontPreset = "editorial" | "modern" | "system";

const PRESETS: Record<AdminFontPreset, { body: string; serif: string; mono: string }> = {
  editorial: {
    body: '"Source Han Serif SC", "Noto Serif SC", "Microsoft YaHei", system-ui, sans-serif',
    serif: '"Source Han Serif SC", "Noto Serif SC", "Songti SC", Georgia, serif',
    mono: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
  },
  modern: {
    body: '"Inter", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    serif: '"Noto Serif SC", "Source Han Serif SC", Georgia, serif',
    mono: '"JetBrains Mono", "Cascadia Code", Consolas, monospace',
  },
  system: {
    body: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif',
    serif: 'ui-serif, Georgia, "Times New Roman", "Songti SC", serif',
    mono: 'ui-monospace, "SFMono-Regular", Consolas, monospace',
  },
};

const STORAGE_KEY = "admin-font-preset";

const TypographyContext = createContext<{
  preset: AdminFontPreset;
  setPreset: (preset: AdminFontPreset) => void;
}>({ preset: "editorial", setPreset: () => {} });

function apply(preset: AdminFontPreset) {
  const tokens = PRESETS[preset] || PRESETS.editorial;
  const root = document.documentElement;
  root.dataset.adminFont = preset;
  root.style.setProperty("--font-body", tokens.body);
  root.style.setProperty("--font-serif", tokens.serif);
  root.style.setProperty("--font-mono", tokens.mono);
}

export function TypographyProvider({ children }: { children: ReactNode }) {
  const [preset, setPresetState] = useState<AdminFontPreset>("editorial");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as AdminFontPreset | null;
    const next = saved && PRESETS[saved] ? saved : "editorial";
    setPresetState(next);
    apply(next);
  }, []);

  const setPreset = useCallback((next: AdminFontPreset) => {
    setPresetState(next);
    apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  }, []);

  const value = useMemo(() => ({ preset, setPreset }), [preset, setPreset]);
  return <TypographyContext.Provider value={value}>{children}</TypographyContext.Provider>;
}

export function useAdminTypography() {
  return useContext(TypographyContext);
}
