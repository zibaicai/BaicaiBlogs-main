"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type GlassScrollPauseMode = "off" | "content" | "all";

interface GlassSettingsValue {
  backgroundEnabled: boolean;
  contentEnabled: boolean;
  scrollPauseMode: GlassScrollPauseMode;
  sakuraCount: number;
  fireflyCount: number;
  setBackgroundEnabled: (enabled: boolean) => void;
  setContentEnabled: (enabled: boolean) => void;
  setScrollPauseMode: (mode: GlassScrollPauseMode) => void;
  setSakuraCount: (count: number) => void;
  setFireflyCount: (count: number) => void;
}

const STORAGE_KEY = "baicai:glass-settings";

const DEFAULT_SETTINGS = {
  backgroundEnabled: true,
  contentEnabled: true,
  scrollPauseMode: "off" as GlassScrollPauseMode,
  sakuraCount: 1200,
  fireflyCount: 42,
};

const clampCount = (value: unknown, fallback: number, min: number, max: number) => {
  const number = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.min(max, Math.max(min, number));
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
      sakuraCount: clampCount(stored.sakuraCount, DEFAULT_SETTINGS.sakuraCount, 100, 2000),
      fireflyCount: clampCount(stored.fireflyCount, DEFAULT_SETTINGS.fireflyCount, 0, 120),
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
    let frame = 0;
    let lastY = window.scrollY;
    let lastActivity = performance.now();
    const root = document.documentElement;

    const resume = () => {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      if (!paused) return;
      paused = false;
      delete root.dataset.glassScrollPaused;
    };

    const watch = () => {
      frame = 0;
      if (!paused) return;
      const y = window.scrollY;
      if (y !== lastY) {
        lastY = y;
        lastActivity = performance.now();
      }
      if (performance.now() - lastActivity >= 300) {
        resume();
        return;
      }
      frame = requestAnimationFrame(watch);
    };

    const onScroll = () => {
      lastActivity = performance.now();
      if (!paused) {
        paused = true;
        lastY = window.scrollY;
        root.dataset.glassScrollPaused = "true";
        frame = requestAnimationFrame(watch);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
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
  const setSakuraCount = useCallback((sakuraCount: number) => {
    setSettings((current) => ({ ...current, sakuraCount: clampCount(sakuraCount, current.sakuraCount, 100, 2000) }));
  }, []);
  const setFireflyCount = useCallback((fireflyCount: number) => {
    setSettings((current) => ({ ...current, fireflyCount: clampCount(fireflyCount, current.fireflyCount, 0, 120) }));
  }, []);

  const value = useMemo(
    () => ({
      ...settings,
      setBackgroundEnabled,
      setContentEnabled,
      setScrollPauseMode,
      setSakuraCount,
      setFireflyCount,
    }),
    [settings, setBackgroundEnabled, setContentEnabled, setScrollPauseMode, setSakuraCount, setFireflyCount]
  );

  return <GlassSettingsContext.Provider value={value}>{children}</GlassSettingsContext.Provider>;
}

export function useGlassSettings() {
  const context = useContext(GlassSettingsContext);
  if (!context) throw new Error("useGlassSettings must be used within GlassSettingsProvider");
  return context;
}
