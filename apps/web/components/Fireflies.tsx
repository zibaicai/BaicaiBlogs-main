"use client";

import { useEffect, useRef } from "react";

type Phase = {
  kind: "rise" | "fall" | "final-fall";
  from: number;
  to: number;
  seconds: number;
};

type Firefly = {
  id: number;
  x: number;
  y: number;
  depth: number;
  vx: number;
  vy: number;
  wander: number;
  wanderSpeed: number;
  phase: number;
  phaseIndex: number;
  phaseElapsed: number;
  intensity: number;
  visible: boolean;
  respawnAt: number;
  tint: "green" | "gold";
  alpha: number;
  glowMax: number;
  glowMin: number;
  coreMax: number;
  coreMin: number;
};

const RISE_SECONDS = 2.2;
const FALL_SECONDS = 2.4;
const VALLEY = 1 / 3;
const TOTAL_PARTICLES = 58;
const MOTION_SCALE = 3.78;
const HIDDEN_MIN = 1.2;
const HIDDEN_MAX = 3.8;

const PHASES: Phase[] = [
  { kind: "rise", from: 0, to: 1, seconds: RISE_SECONDS },
  { kind: "fall", from: 1, to: VALLEY, seconds: FALL_SECONDS },
  { kind: "rise", from: VALLEY, to: 1, seconds: RISE_SECONDS },
  { kind: "fall", from: 1, to: VALLEY, seconds: FALL_SECONDS },
  { kind: "rise", from: VALLEY, to: 1, seconds: RISE_SECONDS },
  { kind: "final-fall", from: 1, to: 0, seconds: FALL_SECONDS },
];

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randomInt(min: number, max: number) {
  return Math.floor(randomBetween(min, max + 1));
}

function easeInOut(t: number) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

function createGlowSprite(stops: Array<[number, string]>) {
  const size = 192;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  for (const [at, color] of stops) gradient.addColorStop(at, color);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

export default function Fireflies() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const preferReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const count = preferReducedMotion ? 28 : TOTAL_PARTICLES;
    const motionScale = preferReducedMotion ? 0.72 : MOTION_SCALE;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frameHandle = 0;
    let running = !document.hidden;
    let lastTime = performance.now();
    let particles: Firefly[] = [];

    const greenSprite = createGlowSprite([
      [0, "rgba(244, 255, 239, 1)"],
      [0.04, "rgba(232, 255, 226, 0.96)"],
      [0.12, "rgba(181, 255, 194, 0.68)"],
      [0.28, "rgba(128, 242, 157, 0.28)"],
      [0.48, "rgba(80, 213, 127, 0.1)"],
      [0.68, "rgba(44, 173, 102, 0.028)"],
      [0.86, "rgba(24, 126, 83, 0.006)"],
      [1, "rgba(24, 126, 83, 0)"],
    ]);

    const goldSprite = createGlowSprite([
      [0, "rgba(255, 253, 229, 1)"],
      [0.04, "rgba(255, 250, 211, 0.94)"],
      [0.12, "rgba(255, 229, 148, 0.62)"],
      [0.28, "rgba(246, 201, 96, 0.24)"],
      [0.48, "rgba(217, 162, 48, 0.08)"],
      [0.68, "rgba(161, 113, 22, 0.025)"],
      [1, "rgba(161, 113, 22, 0)"],
    ]);

    const makeParticle = (index: number): Firefly => {
      const depth = Math.random() < 0.18 ? randomBetween(0.72, 1) : randomBetween(0.32, 0.68);
      const phaseIndex = randomInt(0, 4);
      return {
        id: index,
        x: Math.random() * width,
        y: Math.random() * height,
        depth,
        vx: randomBetween(-0.8, 0.8),
        vy: randomBetween(-0.8, 0.8),
        wander: randomBetween(0.04, 0.16) * (0.4 + depth),
        wanderSpeed: randomBetween(0.08, 0.24),
        phase: Math.random() * Math.PI * 2,
        phaseIndex,
        phaseElapsed: Math.random() * PHASES[phaseIndex].seconds,
        intensity: 0,
        visible: true,
        respawnAt: 0,
        tint: Math.random() < 0.1 ? "gold" : "green",
        alpha: 0.22 + depth * 0.68,
        glowMax: 16 + depth * 40,
        glowMin: 8 + depth * 20,
        coreMax: 1.1 + depth * 2.2,
        coreMin: 0.7 + depth * 1.2,
      };
    };

    const rebuild = () => {
      particles = Array.from({ length: count }, (_, index) => makeParticle(index));
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      for (const particle of particles) {
        particle.x = Math.min(width, Math.max(0, particle.x));
        particle.y = Math.min(height, Math.max(0, particle.y));
      }
    };

    const hideParticle = (particle: Firefly, now: number) => {
      particle.visible = false;
      particle.intensity = 0;
      particle.respawnAt = now + randomBetween(HIDDEN_MIN, HIDDEN_MAX) * 1000;
    };

    const updateParticle = (particle: Firefly, dt: number, now: number, elapsed: number) => {
      if (!particle.visible) {
        if (now >= particle.respawnAt) {
          Object.assign(particle, makeParticle(particle.id));
        }
        return;
      }

      const speedScale = (0.3 + particle.depth * 0.7) * motionScale;
      const drift = Math.sin(elapsed * particle.wanderSpeed + particle.phase) * particle.wander;
      particle.x += (particle.vx + drift) * dt * 60 * speedScale;
      particle.y +=
        (particle.vy + Math.cos(elapsed * particle.wanderSpeed * 0.7 + particle.phase) * particle.wander * 0.65) *
        dt * 60 * speedScale;

      const margin = 40;
      if (particle.x < -margin) particle.x = width + margin;
      if (particle.x > width + margin) particle.x = -margin;
      if (particle.y < -margin) particle.y = height + margin;
      if (particle.y > height + margin) particle.y = -margin;

      particle.phaseElapsed += dt;

      while (particle.visible && particle.phaseElapsed >= PHASES[particle.phaseIndex].seconds) {
        const phase = PHASES[particle.phaseIndex];
        if (phase.kind === "final-fall") {
          hideParticle(particle, now);
          return;
        }
        particle.phaseElapsed -= phase.seconds;
        particle.phaseIndex += 1;
        if (particle.phaseIndex >= PHASES.length) {
          hideParticle(particle, now);
          return;
        }
      }

      const phase = PHASES[particle.phaseIndex];
      const progress = phase.seconds ? particle.phaseElapsed / phase.seconds : 1;
      particle.intensity = phase.from + (phase.to - phase.from) * easeInOut(progress);
    };

    const drawParticle = (particle: Firefly) => {
      if (!particle.visible) return;

      const visibility = Math.min(1, particle.intensity * 3);
      if (visibility <= 0.01) return;

      const glow = particle.glowMin + (particle.glowMax - particle.glowMin) * particle.intensity;
      const core = particle.coreMin + (particle.coreMax - particle.coreMin) * particle.intensity;
      const sprite = particle.tint === "gold" ? goldSprite : greenSprite;

      ctx.globalAlpha = (0.14 + particle.intensity * 0.86) * visibility * particle.alpha;
      ctx.drawImage(sprite, particle.x - glow / 2, particle.y - glow / 2, glow, glow);

      ctx.globalAlpha = (0.1 + particle.intensity * 0.9) * visibility * particle.alpha;
      ctx.fillStyle =
        particle.tint === "gold" ? "rgba(255, 251, 223, 0.98)" : "rgba(246, 255, 231, 0.98)";
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, Math.max(0.6, core), 0, Math.PI * 2);
      ctx.fill();
    };

    const draw = (now: number) => {
      if (!running) return;

      const rawDelta = Math.min(48, now - lastTime);
      lastTime = now;
      const dt = rawDelta / 1000;
      const elapsed = now / 1000;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";

      for (const particle of particles) {
        updateParticle(particle, dt, now, elapsed);
        drawParticle(particle);
      }

      ctx.globalAlpha = 1;
      frameHandle = requestAnimationFrame(draw);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frameHandle);
        return;
      }
      if (!running) {
        running = true;
        lastTime = performance.now();
        frameHandle = requestAnimationFrame(draw);
      }
    };

    resize();
    rebuild();
    frameHandle = requestAnimationFrame(draw);

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      running = false;
      cancelAnimationFrame(frameHandle);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
    />
  );
}
