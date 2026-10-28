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

const STORAGE_KEY = "personal-view";
const COOKIE_NAME = "content-scope";

interface PersonalViewContextValue {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  toggle: () => void;
}

const PersonalViewContext = createContext<PersonalViewContextValue | null>(null);

function writeCookie(value: boolean) {
  const scope = value ? "mine" : "all";
  document.cookie = `${COOKIE_NAME}=${scope}; Path=/; Max-Age=${value ? 60 * 60 * 24 * 30 : 0}; SameSite=Lax`;
}

function apply(value: boolean) {
  document.documentElement.dataset.personalView = value ? "on" : "off";
}

export function PersonalViewProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) === "on";
      const cookie = document.cookie
        .split("; ")
        .find((item) => item.startsWith(`${COOKIE_NAME}=`))
        ?.split("=")[1];
      const next = saved || cookie === "mine";
      setEnabledState(next);
      apply(next);
      writeCookie(next);
    } catch {
      apply(false);
    }
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    apply(value);
    writeCookie(value);
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
      writeCookie(next);
      try {
        localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ enabled, setEnabled, toggle }), [enabled, setEnabled, toggle]);
  return <PersonalViewContext.Provider value={value}>{children}</PersonalViewContext.Provider>;
}

export function usePersonalView() {
  const context = useContext(PersonalViewContext);
  if (!context) throw new Error("usePersonalView must be used within PersonalViewProvider");
  return context;
}
