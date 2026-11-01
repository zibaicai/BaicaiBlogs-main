"use client";

import { useEffect } from "react";

/**
 * Toggles a single document-level flag while the page is scrolling.
 * The CSS layer uses this to temporarily suspend expensive backdrop filters.
 * This component does not render anything and does not use React state.
 */
export default function ScrollActivity() {
  useEffect(() => {
    const root = document.documentElement;
    let active = false;
    let ticking = false;
    let timer: number | null = null;

    const setScrolling = (value: boolean) => {
      if (value === active) return;
      active = value;
      if (value) {
        root.dataset.scrolling = "true";
        window.dispatchEvent(new CustomEvent("scroll-activity", { detail: { scrolling: true } }));
      } else {
        delete root.dataset.scrolling;
        window.dispatchEvent(new CustomEvent("scroll-activity", { detail: { scrolling: false } }));
      }
    };

    const end = () => {
      timer = null;
      setScrolling(false);
    };

    const update = () => {
      ticking = false;
      setScrolling(true);
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(end, 500);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timer !== null) window.clearTimeout(timer);
      setScrolling(false);
    };
  }, []);

  return null;
}
