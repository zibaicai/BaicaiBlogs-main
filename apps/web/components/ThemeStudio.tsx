"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Moon, Palette, RotateCcw, Sparkles, Sun, X } from "lucide-react";
import { useSiteConfigContext } from "../context/SiteConfigProvider";
import {
  DEFAULT_THEME_PALETTES,
  getDefaultPalettes,
  useTheme,
  type ThemeMode,
  type ThemePalette,
  type ThemePreset,
} from "./ThemeProvider";

interface ThemeStudioProps {
  open: boolean;
  onClose: () => void;
}

const FIELDS: Array<{ key: keyof ThemePalette; label: string }> = [
  { key: "bg", label: "页面背景" },
  { key: "surface", label: "卡片表面" },
  { key: "surfaceAlt", label: "次级表面" },
  { key: "text", label: "正文" },
  { key: "muted", label: "次要文字" },
  { key: "border", label: "边框" },
  { key: "accent", label: "主题色" },
  { key: "accentContrast", label: "主题色文字" },
  { key: "success", label: "成功" },
  { key: "warning", label: "警告" },
  { key: "danger", label: "危险" },
];

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((char) => char + char).join("") : value;
  return {
    r: parseInt(full.slice(0, 2), 16) || 0,
    g: parseInt(full.slice(2, 4), 16) || 0,
    b: parseInt(full.slice(4, 6), 16) || 0,
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((item) => Math.max(0, Math.min(255, Math.round(item))).toString(16).padStart(2, "0")).join("")}`;
}

function mix(hex: string, target: string, ratio: number) {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  return rgbToHex(a.r + (b.r - a.r) * ratio, a.g + (b.g - a.g) * ratio, a.b + (b.b - a.b) * ratio);
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const values = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}

function paletteFromColor(color: string, mode: ThemeMode): ThemePalette {
  const dark = mode === "dark";
  const base = dark ? "#020617" : "#ffffff";
  const surface = mix(color, base, dark ? 0.82 : 0.9);
  const surfaceAlt = mix(color, base, dark ? 0.7 : 0.82);
  const text = dark ? "#f1f5f9" : "#0f172a";
  return {
    bg: mix(color, base, dark ? 0.92 : 0.94),
    surface,
    surfaceAlt,
    text,
    muted: mix(text, surface, dark ? 0.35 : 0.5),
    border: mix(text, surface, dark ? 0.7 : 0.82),
    accent: color,
    accentContrast: luminance(color) > 0.55 ? "#111827" : "#ffffff",
    success: DEFAULT_THEME_PALETTES[mode].success,
    warning: DEFAULT_THEME_PALETTES[mode].warning,
    danger: DEFAULT_THEME_PALETTES[mode].danger,
  };
}

async function extractColors(url: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 32;
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return reject(new Error("canvas unavailable"));
        context.drawImage(image, 0, 0, size, size);
        const pixels = context.getImageData(0, 0, size, size).data;
        const buckets = new Map<string, number>();
        for (let index = 0; index < pixels.length; index += 16) {
          const r = Math.round(pixels[index] / 32) * 32;
          const g = Math.round(pixels[index + 1] / 32) * 32;
          const b = Math.round(pixels[index + 2] / 32) * 32;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max - min < 20) continue;
          const key = rgbToHex(r, g, b);
          buckets.set(key, (buckets.get(key) || 0) + 1);
        }
        const colors = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([color]) => color);
        resolve(colors.length ? colors : ["#6366f1"]);
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error("image unavailable"));
    image.src = url;
  });
}

export default function ThemeStudio({ open, onClose }: ThemeStudioProps) {
  const { mode, preset, setPreset, customThemes, setCustomTheme, copyToOtherMode, resetCurrentTheme, resetAllThemes } = useTheme();
  const { background } = useSiteConfigContext();
  const [tab, setTab] = useState<ThemeMode>(mode);
  const [recommended, setRecommended] = useState<string[]>([]);
  const [recommending, setRecommending] = useState(false);

  const palette = customThemes[tab] || getDefaultPalettes(preset)[tab];

  useEffect(() => {
    if (open) setTab(mode);
  }, [open, mode]);

  const update = (key: keyof ThemePalette, value: string) => {
    setCustomTheme(tab, { ...palette, [key]: value });
  };

  const recommend = async () => {
    setRecommending(true);
    try {
      const image = background.bgImages?.[0];
      const colors = image ? await extractColors(image).catch(() => []) : [];
      const fallback = background.themeColors?.length ? background.themeColors : ["#6366f1"];
      const next = (colors.length ? colors : fallback).slice(0, 6);
      setRecommended(next);
      setCustomTheme(tab, paletteFromColor(next[0], tab));
    } catch {
      setRecommended(["#6366f1"]);
    } finally {
      setRecommending(false);
    }
  };

  const copy = () => {
    copyToOtherMode(tab);
  };

  const preview = useMemo(() => palette, [palette]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="theme-studio max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/40 bg-white/95 p-5 text-slate-900 shadow-2xl dark:border-white/10 dark:bg-slate-900/95 dark:text-slate-100 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-meta font-black uppercase tracking-[0.2em] text-indigo-500">
              <Palette size={14} /> Reading appearance
            </div>
            <h2 className="mt-2 text-2xl font-black">配色工作台</h2>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              自定义会改变全站卡片与文字，可能影响对比度和观感。建议先使用背景推荐色。
            </p>
          </div>
          <button onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10" aria-label="关闭配色工作台">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {([
            { id: "ocean" as ThemePreset, name: "深海鲸歌", hint: "蓝调 / 海雾" },
            { id: "violet" as ThemePreset, name: "旧日紫夜", hint: "紫调 / 樱花" },
          ]).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPreset(item.id)}
              className={`rounded-2xl border p-3 text-left transition ${
                preset === item.id
                  ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-400/40 dark:bg-indigo-500/10 dark:text-indigo-200"
                  : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-white/10 dark:bg-slate-950/30 dark:text-slate-300"
              }`}
            >
              <span className="block text-xs font-black">{item.name}</span>
              <span className="mt-1 block text-meta font-medium opacity-60">{item.hint}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-slate-950/40">
          <div className="flex gap-1">
            {(["light", "dark"] as ThemeMode[]).map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition ${
                  tab === item ? "bg-indigo-500 text-white" : "text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-white/10"
                }`}
              >
                {item === "light" ? <Sun size={13} /> : <Moon size={13} />}
                {item === "light" ? "日间" : "夜间"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={recommend} disabled={recommending} className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-meta font-black text-indigo-600 disabled:opacity-50 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
              <Sparkles size={12} /> {recommending ? "取色中…" : "从背景推荐"}
            </button>
            <button onClick={copy} disabled={!customThemes[tab]} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-meta font-black text-slate-500 disabled:opacity-40 dark:border-white/10 dark:text-slate-300">
              <Copy size={12} /> 复制到另一模式
            </button>
            <button onClick={() => resetCurrentTheme(tab)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-meta font-black text-slate-500 dark:border-white/10 dark:text-slate-300">
              <RotateCcw size={12} /> 恢复当前
            </button>
          </div>
        </div>

        {recommended.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-meta font-black text-slate-400">背景推荐</span>
            {recommended.map((color) => (
              <button
                key={color}
                onClick={() => setCustomTheme(tab, paletteFromColor(color, tab))}
                className="h-7 w-7 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200 dark:border-slate-800 dark:ring-white/10"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <label key={field.key} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
              <span className="text-meta font-black text-slate-500 dark:text-slate-300">{field.label}</span>
              <span className="flex items-center gap-2">
                <code className="text-meta text-slate-400">{palette[field.key]}</code>
                <input
                  type="color"
                  value={palette[field.key]}
                  onChange={(event) => update(field.key, event.target.value)}
                  className="h-7 w-9 cursor-pointer rounded-md border-0 bg-transparent p-0"
                  aria-label={field.label}
                />
              </span>
            </label>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 p-4 dark:border-white/10" style={{ background: preview.bg, color: preview.text }}>
          <div className="text-sm font-black">预览 · {tab === "light" ? "日间" : "夜间"}</div>
          <div className="mt-2 rounded-xl p-3 text-xs" style={{ background: preview.surface, border: `1px solid ${preview.border}`, color: preview.muted }}>
            这是一段次要文字。正文颜色应该清晰可读，卡片表面要和页面背景有层次。
          </div>
          <button className="mt-3 rounded-lg px-3 py-2 text-xs font-black" style={{ background: preview.accent, color: preview.accentContrast }}>
            主题按钮
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button onClick={resetAllThemes} className="text-meta font-black text-red-500 hover:underline">
            一键初始化全部主题
          </button>
          <button onClick={onClose} className="btn btn-primary rounded-xl px-5 py-2.5 text-xs font-black">
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
