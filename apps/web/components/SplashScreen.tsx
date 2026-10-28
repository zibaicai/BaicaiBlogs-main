"use client";

import { useEffect, useRef, useState } from "react";
import { useSiteConfigContext } from "../context/SiteConfigProvider";

type SplashPhase = "idle" | "visible" | "closing";

const HOLD_MS = 2200;
const REVEAL_DELAY_MS = 500;
const FADE_MS = 800;

export default function SplashScreen() {
  const { siteInfo } = useSiteConfigContext();
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<SplashPhase>("idle");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    setMounted(true);

    const alreadySeen = sessionStorage.getItem("hasSeenSplash") === "true";
    if (alreadySeen) {
      document.documentElement.classList.add("splash-seen");
      return;
    }

    setPhase("visible");

    const hold = window.setTimeout(() => {
      sessionStorage.setItem("hasSeenSplash", "true");
      setPhase("closing");

      const reveal = window.setTimeout(() => {
        document.documentElement.classList.add("splash-seen");
      }, REVEAL_DELAY_MS);

      const finish = window.setTimeout(() => {
        setPhase("idle");
      }, FADE_MS);

      timers.current.push(reveal, finish);
    }, HOLD_MS);

    timers.current.push(hold);

    return () => {
      for (const timer of timers.current) window.clearTimeout(timer);
      timers.current = [];
    };
  }, []);

  if (!mounted || phase === "idle") return null;

  return (
    <div
      className={`splash-shell fixed inset-0 z-[100000] flex items-center justify-center bg-white transition-[opacity,transform,filter] duration-[800ms] ease-in-out dark:bg-slate-950 ${
        phase === "closing" ? "is-closing" : ""
      }`}
      role="status"
      aria-label="页面加载中"
    >
      <style>{`
        @keyframes splash-orbit { to { transform: rotate(360deg); } }
        @keyframes splash-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .splash-shell.is-closing {
          opacity: 0;
          transform: scale(1.06);
          filter: blur(14px);
        }
        .splash-orbit { animation: splash-orbit 4s linear infinite; }
        .splash-fill { animation: splash-fill 1.8s ease-in-out both; transform-origin: left center; }
        @media (prefers-reduced-motion: reduce) {
          .splash-orbit, .splash-fill { animation: none; }
          .splash-fill { transform: scaleX(1); }
        }
      `}</style>

      <div className="relative flex flex-col items-center">
        <div className="relative mb-8 h-24 w-24">
          <div className="splash-orbit absolute -inset-1.5 rounded-full bg-[conic-gradient(from_0deg,var(--ui-accent),transparent,var(--ui-accent))] opacity-60 blur-[3px]" />
          <div className="relative h-full w-full rounded-full bg-white p-1.5 shadow-xl dark:bg-slate-900">
            <img
              src={siteInfo?.avatarUrl}
              alt={siteInfo?.authorName ? `${siteInfo.authorName} 头像` : "站点头像"}
              className="h-full w-full rounded-full object-cover"
            />
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">
          {siteInfo?.authorName}
        </h1>
        <p className="mb-12 text-[10px] font-black tracking-[0.5em] text-slate-400">
          DIVING INTO THE ARCHIVE
        </p>

        <div className="relative h-[1.5px] w-40 overflow-hidden bg-slate-200 dark:bg-slate-800">
          <span className="splash-fill absolute inset-0 bg-[var(--ui-accent)] shadow-[0_0_12px_var(--ui-accent)]" />
        </div>
      </div>
    </div>
  );
}
