"use client";

/**
 * 樱花背景层（WebGL / 真 alpha / 带泛光）—— 仅日间模式使用
 *
 * 默认值集中在 SAKURA_DEFAULTS，运行时还能被 localStorage / URL 参数覆盖：
 *   petals        粒子数量（越大越密）
 *   bloom.*       泛光三参数：阈值 / 强度 / 半径
 *   color.*       花瓣基础色（内圈 → 外圈）
 *   diffuse       环境光基底（越大越亮）
 *   alphaBoost    不透明度倍率（原版上限只有 0.5，乘这个）
 *
 * ?sakura={"petals":1500,"bloom":{"strength":0.8}}\n * localStorage["sakura-config"] 存同样的 JSON；控制台可用 __sakura.set({...}) 写入后自动刷新。\n *\n * 注意：color / diffuse / alphaBoost 是在编译着色器时写进源码的，
 * 改完需要组件重新挂载才会生效（热更新通常会触发重挂载）。
 */

import { useEffect, useRef } from "react";

export interface SakuraConfig {
  petals: number;
  bloom: { threshold: number; strength: number; radius: number };
  color: { inner: number[]; outer: number[] };
  diffuse: number;
  alphaBoost: number;
}

/** 默认值：改这里就是改线上默认表现 */
export const SAKURA_DEFAULTS: SakuraConfig = {
  /** 粒子数量 */
  petals: 1200,

  /** 泛光：三个参数 */
  bloom: {
    /** 只有比这更亮的部分才发光（0~1） */
    threshold: 0.55,
    /** 光晕叠加强度 */
    strength: 0.55,
    /** 模糊起点步长（每轮按平方递增） */
    radius: 1.0,
  },

  /** 花瓣基础色：内圈 → 外圈 */
  color: {
    inner: [0.45, 0.65, 0.92],
    outer: [0.82, 0.91, 1.0],
  },

  /** 环境光基底（原版 0.4，浅色页面需要更高） */
  diffuse: 0.62,

  /** 不透明度倍率（原版公式上限 0.5） */
  alphaBoost: 1.9,
};

const STORAGE_KEY = "sakura-config";

const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
const vec3 = (v: unknown, d: number[]) =>
  Array.isArray(v) && v.length === 3 && v.every((x) => typeof x === "number" && Number.isFinite(x))
    ? (v as number[])
    : d;

/** 把任意（不可信的）对象合并到默认值上，缺字段/类型不对就回退 */
function mergeConfig(base: SakuraConfig, patch: unknown): SakuraConfig {
  if (!patch || typeof patch !== "object") return base;
  const p = patch as Record<string, unknown>;
  const bloom = (p.bloom ?? {}) as Record<string, unknown>;
  const color = (p.color ?? {}) as Record<string, unknown>;
  return {
    petals: Math.max(50, Math.round(num(p.petals, base.petals))),
    bloom: {
      threshold: num(bloom.threshold, base.bloom.threshold),
      strength: num(bloom.strength, base.bloom.strength),
      radius: num(bloom.radius, base.bloom.radius),
    },
    color: {
      inner: vec3(color.inner, base.color.inner),
      outer: vec3(color.outer, base.color.outer),
    },
    diffuse: num(p.diffuse, base.diffuse),
    alphaBoost: num(p.alphaBoost, base.alphaBoost),
  };
}

/**
 * 解析运行时覆盖，优先级：URL 参数 > localStorage > 默认值
 *   ?sakura={"petals":1500,"bloom":{"strength":0.8}}
 *   localStorage["sakura-config"] 存同样的 JSON
 */
export function resolveSakuraConfig(color?: { inner: number[]; outer: number[] }): SakuraConfig {
  if (typeof window === "undefined") {
    return color ? { ...SAKURA_DEFAULTS, color } : SAKURA_DEFAULTS;
  }

  let cfg = SAKURA_DEFAULTS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) cfg = mergeConfig(cfg, JSON.parse(raw));
  } catch {
    /* 忽略损坏的存储 */
  }

  try {
    const q = new URLSearchParams(window.location.search).get("sakura");
    if (q) cfg = mergeConfig(cfg, JSON.parse(q));
  } catch {
    /* 忽略非法参数 */
  }

  if (color) cfg = { ...cfg, color };
  return cfg;
}

const MAX_DPR = 1.5;

const v3 = (a: number[]) => `vec3(${a.map((x) => x.toFixed(3)).join(", ")})`;

const makeVert = (c: SakuraConfig) => `
uniform mat4 uProjection;
uniform mat4 uModelview;
uniform vec3 uResolution;
uniform vec3 uOffset;
uniform vec3 uDOF;
uniform vec3 uFade;

attribute vec3 aPosition;
attribute vec3 aEuler;
attribute vec2 aMisc;

varying float palpha;
varying float pdist;

varying vec3 normX;
varying vec3 normY;
varying vec3 normZ;

varying float diffuse;
varying float specular;
varying float rstop;
varying float distancefade;

void main(void) {
    vec4 pos = uModelview * vec4(aPosition + uOffset, 1.0);
    gl_Position = uProjection * pos;
    gl_PointSize = aMisc.x * uProjection[1][1] / -pos.z * uResolution.y * 0.5;

    pdist = length(pos.xyz);
    palpha = smoothstep(0.0, 1.0, (pdist - 0.1) / uFade.z);

    vec3 elrsn = sin(aEuler);
    vec3 elrcs = cos(aEuler);
    mat3 rotx = mat3(1.0, 0.0, 0.0, 0.0, elrcs.x, elrsn.x, 0.0, -elrsn.x, elrcs.x);
    mat3 roty = mat3(elrcs.y, 0.0, -elrsn.y, 0.0, 1.0, 0.0, elrsn.y, 0.0, elrcs.y);
    mat3 rotz = mat3(elrcs.z, elrsn.z, 0.0, -elrsn.z, elrcs.z, 0.0, 0.0, 0.0, 1.0);
    mat3 rotmat = rotx * roty * rotz;
    vec3 normal = rotmat[2];

    mat3 trrotm = mat3(
        rotmat[0][0], rotmat[1][0], rotmat[2][0],
        rotmat[0][1], rotmat[1][1], rotmat[2][1],
        rotmat[0][2], rotmat[1][2], rotmat[2][2]
    );
    normX = trrotm[0];
    normY = trrotm[1];
    normZ = trrotm[2];

    const vec3 lit = vec3(0.6917144638660746, 0.6917144638660746, -0.20751433915982237);

    float tmpdfs = dot(lit, normal);
    if (tmpdfs < 0.0) { normal = -normal; tmpdfs = dot(lit, normal); }
    diffuse = ${c.diffuse.toFixed(3)} + tmpdfs;

    vec3 eyev = normalize(-pos.xyz);
    if (dot(eyev, normal) > 0.0) {
        vec3 hv = normalize(eyev + lit);
        specular = pow(max(dot(hv, normal), 0.0), 20.0);
    } else {
        specular = 0.0;
    }

    rstop = clamp((abs(pdist - uDOF.x) - uDOF.y) / uDOF.z, 0.0, 1.0);
    rstop = pow(rstop, 0.5);
    distancefade = min(1.0, exp((uFade.x - pdist) * 0.69315 / uFade.y));
}
`;

const makeFrag = (c: SakuraConfig) => `
precision highp float;

varying float palpha;
varying float pdist;

varying vec3 normX;
varying vec3 normY;
varying vec3 normZ;

varying float diffuse;
varying float specular;
varying float rstop;
varying float distancefade;

float ellipse(vec2 p, vec2 o, vec2 r) {
    vec2 lp = (p - o) / r;
    return length(lp) - 1.0;
}

void main(void) {
    vec3 p = vec3(gl_PointCoord - vec2(0.5, 0.5), 0.0) * 2.0;
    vec3 d = vec3(0.0, 0.0, -1.0);
    float nd = normZ.z;
    if (abs(nd) < 0.0001) discard;

    float np = dot(normZ, p);
    vec3 tp = p + d * np / nd;
    vec2 coord = vec2(dot(normX, tp), dot(normY, tp));

    const float flwrsn = 0.258819045102521;
    const float flwrcs = 0.965925826289068;
    mat2 flwrm = mat2(flwrcs, -flwrsn, flwrsn, flwrcs);
    vec2 flwrp = vec2(abs(coord.x), coord.y) * flwrm;

    float r;
    if (flwrp.x < 0.0) {
        r = ellipse(flwrp, vec2(0.065, 0.024) * 0.5, vec2(0.36, 0.96) * 0.5);
    } else {
        r = ellipse(flwrp, vec2(0.065, 0.024) * 0.5, vec2(0.58, 0.96) * 0.5);
    }

    if (r > rstop) discard;

    vec3 col = mix(${v3(c.color.inner)}, ${v3(c.color.outer)}, r);
    float grady = mix(0.0, 1.0, pow(coord.y * 0.5 + 0.5, 0.35));
    col *= vec3(1.0, grady, grady);
    col *= mix(0.8, 1.0, pow(abs(coord.x), 0.3));
    col = col * diffuse + specular;

    float alpha = (rstop > 0.001) ? (0.5 - r / (rstop * 2.0)) : 1.0;
    alpha = smoothstep(0.0, 1.0, alpha) * palpha;
    alpha *= distancefade;
    alpha = clamp(alpha * ${c.alphaBoost.toFixed(3)}, 0.0, 1.0);

    vec3 outc = pow(clamp(col, 0.0, 1.0), vec3(0.45454545454545));
    gl_FragColor = vec4(outc * alpha, alpha);
}
`;

const FX_VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const BRIGHT_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uThreshold;
void main() {
    vec4 c = texture2D(uTex, vUv);
    vec3 b = max(c.rgb - uThreshold, 0.0);
    gl_FragColor = vec4(b, 1.0);
}
`;

const BLUR_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uDir;
void main() {
    vec4 sum = texture2D(uTex, vUv) * 1.0;
    sum += (texture2D(uTex, vUv + uDir * 1.0) + texture2D(uTex, vUv - uDir * 1.0)) * 0.88;
    sum += (texture2D(uTex, vUv + uDir * 2.0) + texture2D(uTex, vUv - uDir * 2.0)) * 0.61;
    sum += (texture2D(uTex, vUv + uDir * 3.0) + texture2D(uTex, vUv - uDir * 3.0)) * 0.33;
    sum += (texture2D(uTex, vUv + uDir * 4.0) + texture2D(uTex, vUv - uDir * 4.0)) * 0.14;
    gl_FragColor = sum / 4.90;
}
`;

const COMP_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uStrength;
void main() {
    vec4 s = texture2D(uScene, vUv);
    vec3 b = texture2D(uBloom, vUv).rgb;
    // 只加亮、不动 alpha：预乘下不会产生黑边
    vec3 rgb = clamp(s.rgb + b * uStrength, 0.0, 1.0);
    gl_FragColor = vec4(rgb, s.a);
}
`;

export default function SakuraGL({ color }: { color?: { inner: number[]; outer: number[] } }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let started = false;
    let raf = 0;
    let gl: WebGLRenderingContext | null = null;
    let idleHandle = 0;
    let timeoutHandle = 0;

    const cleanup: Array<() => void> = [];

    function boot() {
      if (disposed || started) return;
      started = true;

      try {
        gl = canvas!.getContext("webgl", {
          alpha: true,
          premultipliedAlpha: true,
          antialias: false,
          depth: true,
          powerPreference: "low-power",
        }) as WebGLRenderingContext | null;
      } catch {
        gl = null;
      }
      if (!gl) return;
      const ctx = gl;

      const compile = (type: number, src: string) => {
        const sh = ctx.createShader(type)!;
        ctx.shaderSource(sh, src);
        ctx.compileShader(sh);
        if (!ctx.getShaderParameter(sh, ctx.COMPILE_STATUS)) {
          console.warn("[sakura]", ctx.getShaderInfoLog(sh));
          return null;
        }
        return sh;
      };

      const link = (vsSrc: string, fsSrc: string, uniforms: string[], attribs: string[]) => {
        const vs = compile(ctx.VERTEX_SHADER, vsSrc);
        const fs = compile(ctx.FRAGMENT_SHADER, fsSrc);
        if (!vs || !fs) return null;
        const p = ctx.createProgram()!;
        ctx.attachShader(p, vs);
        ctx.attachShader(p, fs);
        ctx.linkProgram(p);
        ctx.deleteShader(vs);
        ctx.deleteShader(fs);
        if (!ctx.getProgramParameter(p, ctx.LINK_STATUS)) {
          console.warn("[sakura]", ctx.getProgramInfoLog(p));
          return null;
        }
        const u: Record<string, WebGLUniformLocation | null> = {};
        uniforms.forEach((n) => (u[n] = ctx.getUniformLocation(p, n)));
        const a: Record<string, number> = {};
        attribs.forEach((n) => (a[n] = ctx.getAttribLocation(p, n)));
        return { program: p, u, a };
      };

      const CFG = resolveSakuraConfig(color);

      // 调试入口：控制台里可以直接改
      //   __sakura.config.bloom.strength = 0.8;   ← 立刻生效（每帧读取）
      //   __sakura.set({ petals: 1500 });         ← 需要重建，自动刷新
      //   __sakura.reset();
      const dbg = {
        config: CFG,
        set(patch: Record<string, unknown>) {
          try {
            const cur = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, ...patch }));
          } catch {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(patch));
          }
          window.location.reload();
        },
        reset() {
          window.localStorage.removeItem(STORAGE_KEY);
          window.location.reload();
        },
      };
      (window as unknown as { __sakura?: typeof dbg }).__sakura = dbg;
      cleanup.push(() => {
        delete (window as unknown as { __sakura?: typeof dbg }).__sakura;
      });

      const petal = link(
        makeVert(CFG),
        makeFrag(CFG),
        ["uProjection", "uModelview", "uResolution", "uOffset", "uDOF", "uFade"],
        ["aPosition", "aEuler", "aMisc"]
      );
      if (!petal) return;

      const brightPass = link(FX_VERT, BRIGHT_FRAG, ["uTex", "uThreshold"], ["aPos"]);
      const blurPass = link(FX_VERT, BLUR_FRAG, ["uTex", "uDir"], ["aPos"]);
      const compPass = link(FX_VERT, COMP_FRAG, ["uScene", "uBloom", "uStrength"], ["aPos"]);
      if (!brightPass || !blurPass || !compPass) return;

      const quad = ctx.createBuffer();
      ctx.bindBuffer(ctx.ARRAY_BUFFER, quad);
      ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), ctx.STATIC_DRAW);
      ctx.bindBuffer(ctx.ARRAY_BUFFER, null);

      const area = { x: 20, y: 20, z: 20 };
      const projection = { matrix: new Float32Array(16) };
      const camera = { z: 20.1, matrix: new Float32Array(16), dof: [10, 4, 8], fade: [10, 20, 0.1] };

      const loadProjection = (m: Float32Array, aspect: number, vdeg: number, near: number, far: number) => {
        const h = near * Math.tan((vdeg * Math.PI) / 180 * 0.5) * 2;
        const w = h * aspect;
        m[0] = (2 * near) / w; m[1] = 0; m[2] = 0; m[3] = 0;
        m[4] = 0; m[5] = (2 * near) / h; m[6] = 0; m[7] = 0;
        m[8] = 0; m[9] = 0; m[10] = -(far + near) / (far - near); m[11] = -1;
        m[12] = 0; m[13] = 0; m[14] = (-2 * far * near) / (far - near); m[15] = 0;
      };

      const loadLookAt = (m: Float32Array, ez: number) => {
        m[0] = 1; m[1] = 0; m[2] = 0; m[3] = 0;
        m[4] = 0; m[5] = 1; m[6] = 0; m[7] = 0;
        m[8] = 0; m[9] = 0; m[10] = 1; m[11] = 0;
        m[12] = 0; m[13] = 0; m[14] = -ez; m[15] = 1;
      };

      const N = CFG.petals;
      const buf = new Float32Array(N * 8);
      const px = new Float32Array(N), py = new Float32Array(N), pz = new Float32Array(N);
      const vx = new Float32Array(N), vy = new Float32Array(N), vz = new Float32Array(N);
      const ex = new Float32Array(N), ey = new Float32Array(N), ez = new Float32Array(N);
      const rx = new Float32Array(N), ry = new Float32Array(N), rz = new Float32Array(N);
      const sz = new Float32Array(N);
      const idx = new Int32Array(N);

      const PI2 = Math.PI * 2;
      const rnd = () => Math.random() * 2 - 1;

      for (let i = 0; i < N; i++) {
        const dx = rnd() * 0.3 + 0.8;
        const dy = rnd() * 0.2 - 1.0;
        const dz = rnd() * 0.3 + 0.5;
        const len = Math.hypot(dx, dy, dz) || 1;
        const sp = 2.0 + Math.random();
        vx[i] = (dx / len) * sp;
        vy[i] = (dy / len) * sp;
        vz[i] = (dz / len) * sp;

        rx[i] = rnd() * PI2 * 0.5;
        ry[i] = rnd() * PI2 * 0.5;
        rz[i] = rnd() * PI2 * 0.5;

        px[i] = rnd() * area.x;
        py[i] = rnd() * area.y;
        pz[i] = rnd() * area.z;

        ex[i] = Math.random() * PI2;
        ey[i] = Math.random() * PI2;
        ez[i] = Math.random() * PI2;

        sz[i] = 0.9 + Math.random() * 0.1;
      }

      const vbo = ctx.createBuffer();
      ctx.bindBuffer(ctx.ARRAY_BUFFER, vbo);
      ctx.bufferData(ctx.ARRAY_BUFFER, buf.byteLength, ctx.DYNAMIC_DRAW);
      ctx.bindBuffer(ctx.ARRAY_BUFFER, null);

      type Target = { tex: WebGLTexture; fb: WebGLFramebuffer; w: number; h: number };
      const makeTarget = (w: number, h: number): Target => {
        const tex = ctx.createTexture()!;
        ctx.bindTexture(ctx.TEXTURE_2D, tex);
        ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, w, h, 0, ctx.RGBA, ctx.UNSIGNED_BYTE, null);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
        const fb = ctx.createFramebuffer()!;
        ctx.bindFramebuffer(ctx.FRAMEBUFFER, fb);
        ctx.framebufferTexture2D(ctx.FRAMEBUFFER, ctx.COLOR_ATTACHMENT0, ctx.TEXTURE_2D, tex, 0);
        ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
        return { tex, fb, w, h };
      };
      const freeTarget = (t: Target | null) => {
        if (!t) return;
        ctx.deleteTexture(t.tex);
        ctx.deleteFramebuffer(t.fb);
      };

      let sceneT: Target | null = null;
      let bloomA: Target | null = null;
      let bloomB: Target | null = null;

      const res = new Float32Array([1, 1, 1]);
      let W = 1, H = 1;

      const resize = () => {
        const rect = canvas!.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        W = Math.max(1, Math.round(rect.width * dpr));
        H = Math.max(1, Math.round(rect.height * dpr));
        if (canvas!.width !== W || canvas!.height !== H) {
          canvas!.width = W;
          canvas!.height = H;
        }
        res[0] = W; res[1] = H; res[2] = W / H;
        area.x = area.y * (W / H);
        camera.z = area.z + 0.1;
        const angle = (Math.atan2(area.y, camera.z + area.z) * 180) / Math.PI * 2;
        loadProjection(projection.matrix, W / H, angle, 0.1, 100);

        freeTarget(sceneT);
        freeTarget(bloomA);
        freeTarget(bloomB);
        sceneT = makeTarget(W, H);
        bloomA = makeTarget(Math.max(1, Math.round(W / 2)), Math.max(1, Math.round(H / 2)));
        bloomB = makeTarget(Math.max(1, Math.round(W / 2)), Math.max(1, Math.round(H / 2)));
      };

      resize();

      let resizeTimer = 0;
      const onResize = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(resize, 180);
      };
      window.addEventListener("resize", onResize);
      cleanup.push(() => window.removeEventListener("resize", onResize));

      const drawQuad = (pass: { program: WebGLProgram; a: Record<string, number> }) => {
        ctx.bindBuffer(ctx.ARRAY_BUFFER, quad);
        ctx.vertexAttribPointer(pass.a.aPos, 2, ctx.FLOAT, false, 0, 0);
        ctx.enableVertexAttribArray(pass.a.aPos);
        ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
      };

      let prev = performance.now();
      const offsets = [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ];

      const frame = () => {
        if (disposed) return;

        const now = performance.now();
        let dt = (now - prev) / 1000;
        prev = now;
        if (dt > 0.05) dt = 0.05;

        loadLookAt(camera.matrix, camera.z);

        for (let i = 0; i < N; i++) {
          px[i] += vx[i] * dt;
          py[i] += vy[i] * dt;
          pz[i] += vz[i] * dt;

          ex[i] += rx[i] * dt;
          ey[i] += ry[i] * dt;
          ez[i] += rz[i] * dt;

          if (px[i] > area.x) px[i] -= area.x * 2; else if (px[i] < -area.x) px[i] += area.x * 2;
          if (py[i] < -area.y) py[i] += area.y * 2; else if (py[i] > area.y) py[i] -= area.y * 2;
          if (pz[i] > area.z) pz[i] -= area.z * 2; else if (pz[i] < -area.z) pz[i] += area.z * 2;

          ex[i] %= PI2; if (ex[i] < 0) ex[i] += PI2;
          ey[i] %= PI2; if (ey[i] < 0) ey[i] += PI2;
          ez[i] %= PI2; if (ez[i] < 0) ez[i] += PI2;

          idx[i] = i;
        }

        const m = camera.matrix;
        idx.subarray(0, N).sort((a, b) => {
          const za = m[2] * px[a] + m[6] * py[a] + m[10] * pz[a] + m[14];
          const zb = m[2] * px[b] + m[6] * py[b] + m[10] * pz[b] + m[14];
          return za - zb;
        });

        let o = 0;
        for (let k = 0; k < N; k++) {
          const j = idx[k];
          buf[o++] = px[j];
          buf[o++] = py[j];
          buf[o++] = pz[j];
          buf[o++] = ex[j];
          buf[o++] = ey[j];
          buf[o++] = ez[j];
          buf[o++] = sz[j];
          buf[o++] = 1;
        }

        // 1. 花瓣 → scene
        ctx.bindFramebuffer(ctx.FRAMEBUFFER, sceneT!.fb);
        ctx.viewport(0, 0, W, H);
        ctx.clearColor(0, 0, 0, 0);
        ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);

        ctx.enable(ctx.DEPTH_TEST);
        ctx.enable(ctx.BLEND);
        ctx.blendFunc(ctx.ONE, ctx.ONE_MINUS_SRC_ALPHA);

        ctx.useProgram(petal.program);
        ctx.uniformMatrix4fv(petal.u.uProjection, false, projection.matrix);
        ctx.uniformMatrix4fv(petal.u.uModelview, false, camera.matrix);
        ctx.uniform3fv(petal.u.uResolution, res);
        ctx.uniform3fv(petal.u.uDOF, camera.dof);
        ctx.uniform3fv(petal.u.uFade, camera.fade);

        ctx.bindBuffer(ctx.ARRAY_BUFFER, vbo);
        ctx.bufferData(ctx.ARRAY_BUFFER, buf, ctx.DYNAMIC_DRAW);
        ctx.enableVertexAttribArray(petal.a.aPosition);
        ctx.vertexAttribPointer(petal.a.aPosition, 3, ctx.FLOAT, false, 32, 0);
        ctx.enableVertexAttribArray(petal.a.aEuler);
        ctx.vertexAttribPointer(petal.a.aEuler, 3, ctx.FLOAT, false, 32, 12);
        ctx.enableVertexAttribArray(petal.a.aMisc);
        ctx.vertexAttribPointer(petal.a.aMisc, 2, ctx.FLOAT, false, 32, 24);

        for (let d = 1; d < 2; d++) {
          const zpos = d * -2;
          for (let q = 0; q < 4; q++) {
            ctx.uniform3f(petal.u.uOffset, offsets[q][0] * area.x, offsets[q][1] * area.y, area.z * zpos);
            ctx.drawArrays(ctx.POINTS, 0, N);
          }
        }
        ctx.uniform3f(petal.u.uOffset, 0, 0, 0);
        ctx.drawArrays(ctx.POINTS, 0, N);

        ctx.disable(ctx.BLEND);
        ctx.disableVertexAttribArray(petal.a.aPosition);
        ctx.disableVertexAttribArray(petal.a.aEuler);
        ctx.disableVertexAttribArray(petal.a.aMisc);

        // 2. 提亮 → bloomA（半分辨率）
        ctx.disable(ctx.DEPTH_TEST);
        ctx.bindFramebuffer(ctx.FRAMEBUFFER, bloomA!.fb);
        ctx.viewport(0, 0, bloomA!.w, bloomA!.h);
        ctx.useProgram(brightPass.program);
        ctx.activeTexture(ctx.TEXTURE0);
        ctx.bindTexture(ctx.TEXTURE_2D, sceneT!.tex);
        ctx.uniform1i(brightPass.u.uTex, 0);
        ctx.uniform1f(brightPass.u.uThreshold, CFG.bloom.threshold);
        drawQuad(brightPass);
        ctx.disableVertexAttribArray(brightPass.a.aPos);

        // 3. 双向模糊 ×2
        ctx.useProgram(blurPass.program);
        ctx.uniform1i(blurPass.u.uTex, 0);
        for (let it = 0; it < 2; it++) {
          const step = CFG.bloom.radius * (1 + it) ** 2;

          ctx.bindFramebuffer(ctx.FRAMEBUFFER, bloomB!.fb);
          ctx.viewport(0, 0, bloomB!.w, bloomB!.h);
          ctx.activeTexture(ctx.TEXTURE0);
          ctx.bindTexture(ctx.TEXTURE_2D, bloomA!.tex);
          ctx.uniform2f(blurPass.u.uDir, step / bloomA!.w, 0);
          drawQuad(blurPass);
          ctx.disableVertexAttribArray(blurPass.a.aPos);

          ctx.bindFramebuffer(ctx.FRAMEBUFFER, bloomA!.fb);
          ctx.viewport(0, 0, bloomA!.w, bloomA!.h);
          ctx.activeTexture(ctx.TEXTURE0);
          ctx.bindTexture(ctx.TEXTURE_2D, bloomB!.tex);
          ctx.uniform2f(blurPass.u.uDir, 0, step / bloomA!.h);
          drawQuad(blurPass);
          ctx.disableVertexAttribArray(blurPass.a.aPos);
        }

        // 4. 合成到画布
        ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
        ctx.viewport(0, 0, W, H);
        ctx.clearColor(0, 0, 0, 0);
        ctx.clear(ctx.COLOR_BUFFER_BIT);

        ctx.useProgram(compPass.program);
        ctx.activeTexture(ctx.TEXTURE0);
        ctx.bindTexture(ctx.TEXTURE_2D, sceneT!.tex);
        ctx.uniform1i(compPass.u.uScene, 0);
        ctx.activeTexture(ctx.TEXTURE1);
        ctx.bindTexture(ctx.TEXTURE_2D, bloomA!.tex);
        ctx.uniform1i(compPass.u.uBloom, 1);
        ctx.uniform1f(compPass.u.uStrength, CFG.bloom.strength);
        drawQuad(compPass);
        ctx.disableVertexAttribArray(compPass.a.aPos);
        ctx.activeTexture(ctx.TEXTURE0);

        raf = requestAnimationFrame(frame);
      };

      frame();

      const onVisibility = () => {
        if (document.hidden) {
          if (raf) cancelAnimationFrame(raf);
          raf = 0;
        } else if (!raf) {
          prev = performance.now();
          raf = requestAnimationFrame(frame);
        }
      };
      document.addEventListener("visibilitychange", onVisibility);
      cleanup.push(() => document.removeEventListener("visibilitychange", onVisibility));

      cleanup.push(() => {
        if (raf) cancelAnimationFrame(raf);
        window.clearTimeout(resizeTimer);
        freeTarget(sceneT);
        freeTarget(bloomA);
        freeTarget(bloomB);
        ctx.deleteBuffer(vbo);
        ctx.deleteBuffer(quad);
        ctx.deleteProgram(petal.program);
        ctx.deleteProgram(brightPass.program);
        ctx.deleteProgram(blurPass.program);
        ctx.deleteProgram(compPass.program);
        ctx.getExtension("WEBGL_lose_context")?.loseContext();
      });
    }

    // 等页面资源加载完再启动；页面上只要有一个资源挂住，load 就永远不会触发，
    // 所以加一个 3 秒兜底。
    let armed = false;
    const arm = () => {
      if (disposed || armed) return;
      armed = true;
      const go = () => {
        if (!disposed) boot();
      };
      // lib.dom 里 requestIdleCallback 是必有的，用 `in` 判断会被 TS 判成恒真，
      // 所以这里取出来再判空。
      const ric = (window as unknown as {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      }).requestIdleCallback;
      if (ric) {
        idleHandle = ric(go, { timeout: 2000 });
      } else {
        timeoutHandle = window.setTimeout(go, 300);
      }
    };

    if (document.readyState === "complete") {
      arm();
    } else {
      window.addEventListener("load", arm, { once: true });
      timeoutHandle = window.setTimeout(arm, 3000);
    }

    return () => {
      disposed = true;
      window.removeEventListener("load", arm);
      if (idleHandle && "cancelIdleCallback" in window) window.cancelIdleCallback(idleHandle);
      if (timeoutHandle) window.clearTimeout(timeoutHandle);
      cleanup.forEach((fn) => {
        try {
          fn();
        } catch {
          /* ignore */
        }
      });
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}


