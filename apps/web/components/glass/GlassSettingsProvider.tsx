"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type GlassScrollPauseMode = "off" | "content" | "all";

interface GlassSettingsValue {
  backgroundEnabled: boolean;
  contentEnabled: boolean;
  scrollPauseMode: GlassScrollPauseMode;
  setBackgroundEnabled: (enabled: boolean) => void;
  setContentEnabled: (enabled: boolean) => void;
  setScrollPauseMode: (mode: GlassScrollPauseMode) => void;
}

const STORAGE_KEY = "baicai:glass-settings";

const DEFAULT_SETTINGS = {
  backgroundEnabled: true,
  contentEnabled: true,
  scrollPauseMode: "off" as GlassScrollPauseMode,
};

const GlassSettingsContext = createContext<GlassSettingsValue | null>(null);

function readStoredSettings(): typeof DEFAULT_SETTINGS {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") as Partial<typeof DEFAULT_SETTINGS>;
    const scrollPauseMode: GlassScrollPauseMode =
      stored.scrollPauseMode === "content" || stored.scrollPauseMode === "all"
        ? stored.scrollPauseMode
        : "off";
    return {
      backgroundEnabled: stored.backgroundEnabled ?? true,
      contentEnabled: stored.contentEnabled ?? true,
      scrollPauseMode,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function GlassSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSettings(readStoredSettings());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const root = document.documentElement;
    if (settings.backgroundEnabled) delete root.dataset.glassBackground;
    else root.dataset.glassBackground = "off";
    if (settings.contentEnabled) delete root.dataset.glassContent;
    else root.dataset.glassContent = "off";
    if (settings.scrollPauseMode === "off") delete root.dataset.glassPauseMode;
    else root.dataset.glassPauseMode = settings.scrollPauseMode;

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings, loaded]);

  useEffect(() => {
    if (settings.scrollPauseMode === "off") {
      delete document.documentElement.dataset.glassScrollPaused;
      return;
    }

    let paused = false;
    let timer: number | null = null;
    const root = document.documentElement;

    const resume = () => {
      timer = null;
      if (!paused) return;
      paused = false;
      delete root.dataset.glassScrollPaused;
    };

    const onScroll = () => {
      if (!paused) {
        paused = true;
        root.dataset.glassScrollPaused = "true";
      }
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(resume, 300);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timer !== null) window.clearTimeout(timer);
      delete root.dataset.glassScrollPaused;
    };
  }, [settings.scrollPauseMode]);

  const setBackgroundEnabled = useCallback((backgroundEnabled: boolean) => {
    setSettings((current) => ({ ...current, backgroundEnabled }));
  }, []);
  const setContentEnabled = useCallback((contentEnabled: boolean) => {
    setSettings((current) => ({ ...current, contentEnabled }));
  }, []);
  const setScrollPauseMode = useCallback((scrollPauseMode: GlassScrollPauseMode) => {
    setSettings((current) => ({ ...current, scrollPauseMode }));
  }, []);

  const value = useMemo(
    () => ({
      ...settings,
      setBackgroundEnabled,
      setContentEnabled,
      setScrollPauseMode,
    }),
    [settings, setBackgroundEnabled, setContentEnabled, setScrollPauseMode]
  );

  return <GlassSettingsContext.Provider value={value}>{children}</GlassSettingsContext.Provider>;
}

export function useGlassSettings() {
  const context = useContext(GlassSettingsContext);
  if (!context) throw new Error("useGlassSettings must be used within GlassSettingsProvider");
  return context;
}
