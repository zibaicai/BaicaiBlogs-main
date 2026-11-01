"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

type ScrollListener = (scrolling: boolean) => void;

interface ScrollActivityStore {
  subscribe: (listener: ScrollListener) => () => void;
}

const ScrollActivityContext = createContext<ScrollActivityStore | null>(null);
const listeners = new Set<ScrollListener>();

function publish(scrolling: boolean) {
  document.documentElement.dataset.scrolling = scrolling ? "true" : "";
  if (!scrolling) delete document.documentElement.dataset.scrolling;
  listeners.forEach((listener) => listener(scrolling));
}

/**
 * Publishes one document-level "is scrolling" fact.
 * Components subscribe through useScrollActivity; no React state is updated
 * on every scroll event.
 */
export function ScrollActivityProvider({ children }: { children?: ReactNode }) {
  useEffect(() => {
    let active = false;
    let ticking = false;
    let timer: number | null = null;

    const start = () => {
      ticking = false;
      if (!active) {
        active = true;
        publish(true);
      }
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        if (!active) return;
        active = false;
        publish(false);
      }, 500);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(start);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timer !== null) window.clearTimeout(timer);
      if (active) publish(false);
    };
  }, []);

  return (
    <ScrollActivityContext.Provider value={{ subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    } }}>
      {children}
    </ScrollActivityContext.Provider>
  );
}

export function useScrollActivity(listener: ScrollListener) {
  const store = useContext(ScrollActivityContext);
  useEffect(() => {
    if (!store) return;
    return store.subscribe(listener);
  }, [store, listener]);
}
