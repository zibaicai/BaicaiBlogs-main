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
 * The keyboard lock starts on pointerdown/focusin, before Android resize events,
 * and is released only after focus leaves editable content.
 */
export default function ViewportHeightSync() {
  useEffect(() => {
    const root = document.documentElement;
    let stableHeight = root.clientHeight || window.innerHeight;
    let keyboardLock = false;
    let unlockTimer = 0;
    let frame = 0;

    const apply = (force = false) => {
      if (keyboardLock && !force) return;
      if (!force && isEditable(document.activeElement) && keyboardInset() > 120) return;
      const next = root.clientHeight || window.innerHeight;
      if (Math.abs(next - stableHeight) < 2) return;
      stableHeight = next;
      root.style.setProperty("--app-height", `${Math.round(next)}px`);
    };

    root.style.setProperty("--app-height", `${Math.round(stableHeight)}px`);

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => apply());
    };

    const lock = () => {
      keyboardLock = true;
      window.clearTimeout(unlockTimer);
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) lock();
    };

    const onFocusIn = (event: FocusEvent) => {
      if (isEditable(event.target as Element | null)) lock();
    };

    const onFocusOut = () => {
      window.clearTimeout(unlockTimer);
      unlockTimer = window.setTimeout(() => {
        if (isEditable(document.activeElement)) return;
        keyboardLock = false;
        apply(true);
      }, 320);
    };

    const onOrientation = () => {
      window.setTimeout(() => apply(), 260);
    };

    document.addEventListener("pointerdown", onPointerDown, { capture: true });
    document.addEventListener("focusin", onFocusIn, { capture: true });
    document.addEventListener("focusout", onFocusOut);
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", onOrientation);
    document.addEventListener("fullscreenchange", schedule);
    window.visualViewport?.addEventListener("resize", schedule);

    return () => {
      window.clearTimeout(unlockTimer);
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", onPointerDown, { capture: true });
      document.removeEventListener("focusin", onFocusIn, { capture: true });
      document.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", onOrientation);
      document.removeEventListener("fullscreenchange", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
    };
  }, []);

  return null;
}
