"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_DANMAKU } from "../lib/site-config";

interface DanmakuLane {
  id: number;
  text: string;
  top: number;
  duration: number;
  delay: number;
}

const LANE_MIN = 8;
const LANE_MAX = 12;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function laneCountFor(total: number) {
  return Math.min(LANE_MAX, LANE_MIN + Math.floor(total / 250));
}

/**
 * Decorative background danmaku.
 *
 * Lanes are stable and animated by CSS. When a lane finishes a pass we only
 * replace its text, so changing the pool or adding messages never restarts the
 * whole animation. The pool can grow to 1k strings while only 8-12 lanes are
 * ever mounted.
 */
export default function DanmakuBackground() {
  const [pool, setPool] = useState<string[]>([]);
  const [lanes, setLanes] = useState<DanmakuLane[]>([]);
  const poolRef = useRef<string[]>([]);
  const bagRef = useRef<string[]>([]);

  const takeText = () => {
    if (bagRef.current.length === 0) {
      bagRef.current = shuffle(poolRef.current.length ? poolRef.current : DEFAULT_DANMAKU);
    }
    return bagRef.current.pop() || DEFAULT_DANMAKU[0];
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/public/danmaku", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled && json?.success && Array.isArray(json.data)) {
          const items = json.data
            .filter((x: unknown) => typeof x === "string" && x.trim())
            .slice(0, 1000);
          const next = items.length > 0 ? items : DEFAULT_DANMAKU;
          poolRef.current = next;
          bagRef.current = shuffle(next);
          setPool(next);
        }
      } catch {
        if (!cancelled) {
          poolRef.current = DEFAULT_DANMAKU;
          bagRef.current = shuffle(DEFAULT_DANMAKU);
          setPool(DEFAULT_DANMAKU);
        }
      }
    };

    const onUpdated = () => void load();
    void load();
    window.addEventListener("danmaku-updated", onUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("danmaku-updated", onUpdated);
    };
  }, []);

  useEffect(() => {
    if (pool.length === 0) return;
    const count = laneCountFor(pool.length);
    setLanes((previous) => {
      const next: DanmakuLane[] = [];
      for (let id = 0; id < count; id += 1) {
        const existing = previous.find((lane) => lane.id === id);
        const duration = 32 + Math.random() * 12;
        const top = 8 + (id * 84) / Math.max(1, count - 1);
        next.push(
          existing
            ? { ...existing, top }
            : {
                id,
                text: takeText(),
                top,
                duration,
                // Start mid-cycle: no initial queue at the left edge.
                delay: -Math.random() * duration,
              }
        );
      }
      return next;
    });
    // takeText reads refs; the lane count only needs to react to pool size.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool.length]);

  const advance = (id: number) => {
    setLanes((previous) =>
      previous.map((lane) => (lane.id === id ? { ...lane, text: takeText() } : lane))
    );
  };

  return (
    <div className="danmaku-layer fixed left-0 right-0 top-28 z-0 h-[30vh] overflow-hidden pointer-events-none select-none">
      {lanes.map((lane) => (
        <div
          key={lane.id}
          className="danmaku-item absolute left-0 whitespace-nowrap font-medium text-[12px] tracking-[0.06em] text-white/35 dark:text-white/25 md:text-[14px]"
          style={{
            top: `${lane.top}%`,
            animation: `danmaku-flow ${lane.duration}s linear ${lane.delay}s infinite`,
            animationFillMode: "both",
            textShadow: "0 1px 3px rgba(15,23,42,0.42)",
          }}
          onAnimationIteration={() => advance(lane.id)}
        >
          {lane.text}
        </div>
      ))}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes danmaku-flow {
          0% { transform: translate3d(100vw, -50%, 0); }
          100% { transform: translate3d(-100%, -50%, 0); }
        }

        .danmaku-item {
          contain: layout style;
          backface-visibility: hidden;
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .danmaku-item { animation: none !important; opacity: 0; }
        }
      `}} />
    </div>
  );
}
