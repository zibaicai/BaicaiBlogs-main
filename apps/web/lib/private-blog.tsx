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

const STORAGE_KEY = "private-blog-mode";

interface PrivateBlogContextValue {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  toggle: () => void;
}

const PrivateBlogContext = createContext<PrivateBlogContextValue | null>(null);

function apply(value: boolean) {
  document.documentElement.dataset.privateBlog = value ? "on" : "off";
}

export function PrivateBlogProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) === "on";
      setEnabledState(saved);
      apply(saved);
    } catch {
      apply(false);
    }
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    apply(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? "on" : "off");
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggle = useCallback(() => {
    setEnabledState((current) => {
      const next = !current;
      apply(next);
      try {
        localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ enabled, setEnabled, toggle }), [enabled, setEnabled, toggle]);
  return <PrivateBlogContext.Provider value={value}>{children}</PrivateBlogContext.Provider>;
}

export function usePrivateBlog() {
  const context = useContext(PrivateBlogContext);
  if (!context) throw new Error("usePrivateBlog must be used within PrivateBlogProvider");
  return context;
}
