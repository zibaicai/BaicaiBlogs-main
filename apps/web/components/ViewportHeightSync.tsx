"use client";

import { useEffect } from "react";

function isEditable(element: Element | null) {
  return element instanceof HTMLTextAreaElement
    || element instanceof HTMLInputElement
    || (element instanceof HTMLElement && element.isContentEditable);
}

function keyboardInset() {
  const viewport = window.visualViewport;
  if (!viewport) return 0;
  return Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
}

/**
 * Keeps the backdrop at the last keyboard-closed viewport height.
 * Split-screen, fullscreen, rotation and desktop resizing still update it;
 * the virtual keyboard does not.
 */
export default function ViewportHeightSync() {
  useEffect(() => {
    const root = document.documentElement;
    let stableHeight = root.clientHeight || window.innerHeight;
    let pendingResize = false;

    const apply = (force = false) => {
      const keyboardOpen = isEditable(document.activeElement) && keyboardInset() > 150;
      if (keyboardOpen && !force) {
        pendingResize = true;
        return;
      }
      const next = root.clientHeight || window.innerHeight;
      if (Math.abs(next - stableHeight) < 2) return;
      stableHeight = next;
      root.style.setProperty("--app-height", `${Math.round(next)}px`);
    };

    root.style.setProperty("--app-height", `${Math.round(stableHeight)}px`);

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => apply());
    };

    const onOrientation = () => {
      window.setTimeout(() => {
        if (!isEditable(document.activeElement)) apply();
      }, 250);
    };

    const onFocusOut = () => {
      window.setTimeout(() => {
        if (pendingResize || !isEditable(document.activeElement)) {
          pendingResize = false;
          apply();
        }
      }, 180);
    };

    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", onOrientation);
    document.addEventListener("fullscreenchange", schedule);
    document.addEventListener("focusout", onFocusOut);
    window.visualViewport?.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", onOrientation);
      document.removeEventListener("fullscreenchange", schedule);
      document.removeEventListener("focusout", onFocusOut);
      window.visualViewport?.removeEventListener("resize", schedule);
    };
  }, []);

  return null;
}
