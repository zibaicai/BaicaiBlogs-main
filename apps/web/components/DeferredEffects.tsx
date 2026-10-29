"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const DanmakuBackground = dynamic(() => import("./DanmakuBackground"), { ssr: false });
const DanmakuComposer = dynamic(() => import("./DanmakuComposer"), { ssr: false });
const GlobalSnow = dynamic(() => import("./GlobalSnow"), { ssr: false });
const ClickEffect = dynamic(() => import("./ClickEffect"), { ssr: false });
const FloatingPlayer = dynamic(() => import("./FloatingPlayer"), { ssr: false });
const WhalePet = dynamic(() => import("./WhalePet"), { ssr: false });

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

function isPlainMode() {
  return document.documentElement.getAttribute("data-visual-mode") === "plain";
}

export default function DeferredEffects() {
  const [effectsReady, setEffectsReady] = useState(false);
  const [petReady, setPetReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const idleWindow = window as IdleWindow;
    const timers: number[] = [];

    const enableEffects = () => {
      if (cancelled) return;
      setEffectsReady(true);
    };
    const enablePet = () => {
      if (cancelled) return;
      setPetReady(true);
    };
    const enableAll = () => {
      enableEffects();
      enablePet();
    };

    if (isPlainMode()) {
      const observer = new MutationObserver(() => {
        if (!isPlainMode()) {
          enableAll();
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-visual-mode"] });
      return () => {
        cancelled = true;
        observer.disconnect();
      };
    }

    // Effects wait for idle time; the pet waits a little longer so the first
    // paint and the first interaction always win over decorative animation.
    const scheduleIdle = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(() => {
        if (idleWindow.requestIdleCallback) {
          idleWindow.requestIdleCallback(callback, { timeout: 1800 });
        } else {
          callback();
        }
      }, delay);
      timers.push(timer);
    };

    scheduleIdle(enableEffects, 1200);
    scheduleIdle(enablePet, 3200);

    const onInteraction = () => enableAll();
    window.addEventListener("pointerdown", onInteraction, { once: true });
    window.addEventListener("keydown", onInteraction, { once: true });

    return () => {
      cancelled = true;
      for (const timer of timers) window.clearTimeout(timer);
      window.removeEventListener("pointerdown", onInteraction);
      window.removeEventListener("keydown", onInteraction);
    };
  }, []);

  return (
    <>
      {effectsReady && (
        <>
          <DanmakuBackground />
          <DanmakuComposer />
          <GlobalSnow />
          <ClickEffect />
          <FloatingPlayer />
        </>
      )}
      {petReady && <WhalePet />}
    </>
  );
}
