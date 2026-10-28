"use client";

import { useEffect, useState } from "react";

type Snowflake = {
  id: number;
  glyph: string;
  size: number;
  left: number;
  duration: number;
  delay: number;
  opacity: number;
  drift: number;
};

const GLYPHS = ["❄", "❅", "❆"];
const FLAKE_COUNT = 40;

function makeFlakes(): Snowflake[] {
  return Array.from({ length: FLAKE_COUNT }, (_, id) => ({
    id,
    glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
    size: 10 + Math.random() * 15,
    left: Math.random() * 100,
    duration: 4 + Math.random() * 6,
    delay: Math.random() * 5,
    opacity: 0.3 + Math.random() * 0.5,
    drift: Math.random() * 30 - 15,
  }));
}

export default function GlobalSnow() {
  const [flakes, setFlakes] = useState<Snowflake[]>([]);
  const [winter, setWinter] = useState(false);

  useEffect(() => {
    const sync = () => {
      const stored = localStorage.getItem("winter-mode") === "true";
      const active = stored || document.body.classList.contains("winter-mode");
      if (active) document.body.classList.add("winter-mode");
      setWinter(active);
    };

    sync();
    setFlakes(makeFlakes());

    const observer = new MutationObserver((entries) => {
      for (const entry of entries) {
        if (entry.attributeName === "class") {
          setWinter(document.body.classList.contains("winter-mode"));
        }
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  if (!winter || flakes.length === 0) return null;

  return (
    <div className="global-snow pointer-events-none fixed inset-0 z-[190] overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes snow-fall {
          from { transform: translate3d(0, -24px, 0) rotate(0deg); }
          to { transform: translate3d(var(--snow-drift), 108vh, 0) rotate(300deg); }
        }
        .global-snow-flake {
          animation: snow-fall var(--snow-duration) linear var(--snow-delay) infinite;
          will-change: transform;
        }
      `}</style>

      <div className="absolute inset-0 bg-sky-500/5 mix-blend-overlay dark:bg-sky-900/10" />

      {flakes.map((flake) => (
        <span
          key={flake.id}
          className="global-snow-flake pointer-events-none absolute select-none text-white"
          style={{
            top: "-24px",
            left: `${flake.left}vw`,
            fontSize: flake.size,
            opacity: flake.opacity,
            filter: "drop-shadow(0 0 2px rgba(255,255,255,0.65))",
            ["--snow-duration" as string]: `${flake.duration}s`,
            ["--snow-delay" as string]: `${flake.delay}s`,
            ["--snow-drift" as string]: `${flake.drift}px`,
          }}
        >
          {flake.glyph}
        </span>
      ))}
    </div>
  );
}
