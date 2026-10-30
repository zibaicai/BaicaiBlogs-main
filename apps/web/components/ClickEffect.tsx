"use client";

import { useEffect, useRef } from "react";

type Ripple = {
  x: number;
  y: number;
  startedAt: number;
  duration: number;
  from: number;
  to: number;
};

const RIPPLE_LIFE = 620;
const RIPPLE_START = 6;
const RIPPLE_END = 64;

export default function ClickEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let pixelRatio = 1;
    let frame = 0;
    let disposed = false;
    const ripples: Ripple[] = [];

    const applySize = () => {
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const accent = () => {
      const value = getComputedStyle(document.documentElement).getPropertyValue("--ui-accent").trim();
      return value || "#5b8bd0";
    };

    const addRipple = (event: MouseEvent) => {
      if (document.body.classList.contains("tool-click-off")) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      ripples.push({
        x: event.clientX,
        y: event.clientY,
        startedAt: performance.now(),
        duration: RIPPLE_LIFE,
        from: RIPPLE_START,
        to: RIPPLE_END,
      });
    };

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const paint = (now: number) => {
      if (disposed) return;

      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "lighter";
      context.strokeStyle = accent();
      context.lineWidth = 1.6;

      for (let index = ripples.length - 1; index >= 0; index -= 1) {
        const ripple = ripples[index];
        const elapsed = now - ripple.startedAt;
        const progress = Math.min(1, Math.max(0, elapsed / Math.max(1, ripple.duration)));
        if (progress >= 1) {
          ripples.splice(index, 1);
          continue;
        }

        const radius = Math.max(
          0.01,
          ripple.from + (ripple.to - ripple.from) * easeOut(progress)
        );
        if (!Number.isFinite(radius)) continue;
        const alpha = Math.pow(1 - progress, 1.8);

        context.globalAlpha = alpha * 0.75;
        context.beginPath();
        context.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
        context.stroke();

        context.globalAlpha = alpha * 0.16;
        context.beginPath();
        context.arc(ripple.x, ripple.y, Math.max(0.01, radius * 0.48), 0, Math.PI * 2);
        context.fillStyle = context.strokeStyle;
        context.fill();
      }

      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
      frame = requestAnimationFrame(paint);
    };

    applySize();
    window.addEventListener("resize", applySize);
    window.addEventListener("click", addRipple);
    frame = requestAnimationFrame(paint);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", applySize);
      window.removeEventListener("click", addRipple);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="click-effect pointer-events-none fixed inset-0 z-[9999]"
    />
  );
}
