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
  const communityName = siteInfo?.navAfter || siteInfo?.title || "云端小屋";

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
        .splash-shell.is-closing {
          opacity: 0;
          transform: scale(1.06);
          filter: blur(14px);
        }
        .splash-orbit { animation: splash-orbit 4s linear infinite; }
        .splash-spinner {
          border: 2px solid color-mix(in srgb, var(--ui-accent) 20%, transparent);
          border-top-color: var(--ui-accent);
          animation: splash-orbit 0.8s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .splash-orbit, .splash-spinner { animation: none; }
        }
      `}</style>

      <div className="relative flex flex-col items-center">
        <div className="relative mb-8 h-[100px] w-[100px]">
          <div className="splash-orbit absolute -inset-1 rounded-full bg-[conic-gradient(from_0deg,var(--ui-accent),transparent,var(--ui-accent))] opacity-60 blur-[3px]" />
          <div className="relative h-full w-full rounded-full bg-white p-1.5 shadow-xl dark:bg-slate-900">
            <img
              src="/pet/whale-idle.webp"
              alt="鲸鱼娘"
              className="h-full w-full rounded-full object-cover"
            />
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">
          {communityName}
        </h1>
        <p className="mb-12 text-meta font-black uppercase tracking-[0.35em] text-slate-400">
          CLOUD CABIN IS LOADING...
        </p>

        <div
          className="splash-spinner h-9 w-9 rounded-full"
          role="progressbar"
          aria-label="加载中"
        />
      </div>
    </div>
  );
}
