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
  window.dispatchEvent(new CustomEvent("scroll-activity", { detail: { scrolling } }));
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
    let fallbackTimer: number | null = null;

    const stop = () => {
      if (fallbackTimer !== null) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      if (!active) return;
      active = false;
      publish(false);
    };

    const start = () => {
      ticking = false;
      if (!active) {
        active = true;
        publish(true);
      }
      if (fallbackTimer !== null) {
        window.clearTimeout(fallbackTimer);
      }
      // scrollend is not reliable for every input source; this short fallback
      // keeps the background from staying frozen if the event is missed.
      fallbackTimer = window.setTimeout(stop, 60);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(start);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", stop);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", stop);
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
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
