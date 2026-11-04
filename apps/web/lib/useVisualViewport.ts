"use client";

import { useEffect, useState } from "react";

/**
 * Keeps a fixed composer above the mobile virtual keyboard.
 * Safari/WeChat may resize the layout viewport or only the visual viewport;
 * offsetTop is required when iOS shifts the visual viewport upward.
 */
export function useVisualViewport() {
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
        setKeyboardInset(inset > 120 ? inset : 0);
      });
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return { keyboardInset, keyboardOpen: keyboardInset > 120 };
}
