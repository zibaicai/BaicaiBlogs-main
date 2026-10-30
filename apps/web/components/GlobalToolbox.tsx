"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppIcon } from "./ui/AppIcon";
import { usePathname, useRouter } from "next/navigation";
import { useMusic } from "./MusicProvider";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "../lib/auth";
import { usePersonalView } from "../lib/personal-view";
import ThemeStudio from "./ThemeStudio";

type ToolId = "danmaku" | "click" | "pet";

type Tool = {
  id: ToolId;
  name: string;
  description: string;
};

const TOOLS: Tool[] = [
  { id: "danmaku", name: "海面弹幕", description: "让一些话从海面上飘过" },
  { id: "click", name: "水波", description: "点击页面，荡开一圈涟漪" },
  { id: "pet", name: "鲸鱼娘", description: "陪你写代码，也提醒你休息" },
];

const DEFAULT_PREFS: Record<ToolId, boolean> = {
  danmaku: true,
  click: true,
  pet: true,
};

function applyPrefs(prefs: Record<ToolId, boolean>) {
  document.body.classList.toggle("tool-danmaku-off", !prefs.danmaku);
  document.body.classList.toggle("tool-click-off", !prefs.click);
  document.body.classList.toggle("tool-pet-off", !prefs.pet);
}

function applyVisualEffects(enabled: boolean) {
  if (enabled) document.documentElement.removeAttribute("data-visual-mode");
  else document.documentElement.setAttribute("data-visual-mode", "plain");
}

export default function GlobalToolbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [prefs, setPrefs] = useState<Record<ToolId, boolean>>(DEFAULT_PREFS);
  const [visualEffects, setVisualEffects] = useState(true);
  const [musicVisible, setMusicVisible] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { currentSong, isPlaying, togglePlay } = useMusic();
  const { preset, setPreset } = useTheme();
  const { enabled: personalView, toggle: togglePersonalView } = usePersonalView();

  useEffect(() => {
    if (!user || personalView) return;
    if (sessionStorage.getItem("personal-view-pending") !== "1") return;
    sessionStorage.removeItem("personal-view-pending");
    togglePersonalView();
    window.setTimeout(() => window.location.reload(), 0);
  }, [user, personalView, togglePersonalView]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("toolbox-prefs");
      if (raw) {
        const stored = JSON.parse(raw) as Partial<Record<ToolId, boolean>>;
        const next = { ...DEFAULT_PREFS, ...stored };
        setPrefs(next);
        applyPrefs(next);
      } else {
        applyPrefs(DEFAULT_PREFS);
      }
      const storedVisibility = localStorage.getItem("musicMiniPlayerVisible");
      setMusicVisible(storedVisibility === null ? pathname === "/" : storedVisibility === "true");
      const storedEffects = localStorage.getItem("visual-effects");
      const effectsEnabled = storedEffects === null
        ? !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : storedEffects !== "off";
      setVisualEffects(effectsEnabled);
      applyVisualEffects(effectsEnabled);
    } catch {
      applyPrefs(DEFAULT_PREFS);
    }
  }, [pathname]);

  const toggle = (id: ToolId) => {
    setPrefs((current) => {
      const next = { ...current, [id]: !current[id] };
      applyPrefs(next);
      try {
        localStorage.setItem("toolbox-prefs", JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const toggleVisualEffects = () => {
    setVisualEffects((current) => {
      const next = !current;
      applyVisualEffects(next);
      try {
        localStorage.setItem("visual-effects", next ? "on" : "off");
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const toggleMusicVisible = () => {
    setMusicVisible((current) => {
      const next = !current;
      try {
        localStorage.setItem("musicMiniPlayerVisible", String(next));
      } catch {
        // ignore storage errors
      }
      window.dispatchEvent(new CustomEvent("music-player-visibility", { detail: next }));
      return next;
    });
  };

  return (
    <div className="global-toolbox fixed bottom-6 left-6 z-[9999] flex flex-col items-start gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="tool-directory mb-1 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/95"
          >
            <div className="flex items-start justify-between border-b border-slate-200/70 px-5 py-4 dark:border-white/10">
              <div>
                <span className="font-mono text-meta uppercase tracking-[0.2em] text-slate-400">TOOLS</span>
                <h3 className="mt-1 text-base font-black text-slate-800 dark:text-white">工具目录</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="关闭工具目录"
              >
                <AppIcon name="close" size={16} />
              </button>
            </div>

            <div className="p-2">
              <div className="flex items-center justify-between gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-slate-100/70 dark:hover:bg-white/5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <AppIcon name="sparkles" size={15} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100">背景特效</div>
                    <div className="mt-0.5 truncate text-meta text-slate-400">关闭背景图、渐变与粒子动画</div>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={visualEffects}
                  aria-label={`背景特效${visualEffects ? "已开启" : "已关闭"}`}
                  onClick={toggleVisualEffects}
                  className={`tool-switch relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    visualEffects ? "bg-[var(--ui-accent)]" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                      visualEffects ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>
              {TOOLS.map((tool) => {
                const enabled = prefs[tool.id];
                return (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-slate-100/70 dark:hover:bg-white/5"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{tool.name}</div>
                      <div className="mt-0.5 truncate text-meta text-slate-400">{tool.description}</div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      aria-label={`${tool.name}${enabled ? "已开启" : "已关闭"}`}
                      onClick={() => toggle(tool.id)}
                      className={`tool-switch relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                        enabled ? "bg-[var(--ui-accent)]" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                          enabled ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}

              <div className="mt-1 border-t border-slate-200/70 px-3 py-3 dark:border-white/10">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                      <AppIcon name="music" size={15} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100">音乐</div>
                      <div className="truncate text-meta text-slate-400">
                        {currentSong ? `${currentSong.title} · ${currentSong.artist}` : "暂无播放歌曲"}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={togglePlay}
                      disabled={!currentSong}
                      aria-label={isPlaying ? "暂停音乐" : "播放音乐"}
                      className="btn btn-primary flex h-8 w-8 items-center justify-center rounded-full disabled:opacity-40"
                    >
                      {isPlaying ? <AppIcon name="pause" size={13} /> : <AppIcon name="play" size={13} />}
                    </button>
                    <button
                      type="button"
                      onClick={toggleMusicVisible}
                      disabled={!currentSong}
                      aria-label={musicVisible ? "隐藏迷你播放器" : "显示迷你播放器"}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 disabled:opacity-30 dark:border-white/10 dark:text-slate-300"
                    >
                      {musicVisible ? <AppIcon name="eyeOff" size={13} /> : <AppIcon name="eye" size={13} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-1 border-t border-slate-200/70 px-3 py-3 dark:border-white/10">
                <div className="text-meta font-black uppercase tracking-[0.16em] text-slate-400">主题风格</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPreset("ocean")}
                    className={`rounded-xl border px-3 py-2 text-left transition ${
                      preset === "ocean"
                        ? "border-[var(--ui-accent)] bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]"
                        : "border-slate-200 text-slate-500 hover:border-[var(--ui-accent)]/40 dark:border-white/10 dark:text-slate-400"
                    }`}
                  >
                    <span className="block text-meta font-black">深海鲸歌</span>
                    <span className="mt-0.5 block text-meta opacity-60">蓝调 / 海雾</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreset("violet")}
                    className={`rounded-xl border px-3 py-2 text-left transition ${
                      preset === "violet"
                        ? "border-[var(--ui-accent)] bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]"
                        : "border-slate-200 text-slate-500 hover:border-[var(--ui-accent)]/40 dark:border-white/10 dark:text-slate-400"
                    }`}
                  >
                    <span className="block text-meta font-black">旧日紫夜</span>
                    <span className="mt-0.5 block text-meta opacity-60">紫调 / 樱花</span>
                  </button>
                </div>
              </div>

              <div className="mt-1 border-t border-slate-200/70 px-3 py-3 dark:border-white/10">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]">
                      <AppIcon name="palette" size={15} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100">配色工作台</div>
                      <div className="truncate text-meta text-slate-400">日间 / 夜间独立自定义</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setThemeOpen(true);
                    }}
                    className="rounded-full bg-[var(--ui-accent)] px-3 py-2 text-meta font-black text-[var(--ui-accent-contrast)]"
                  >
                    调整
                  </button>
                </div>
              </div>
            </div>

            <p className="border-t border-slate-200/70 px-5 py-3 text-meta text-slate-400 dark:border-white/10">
              开关会保存在当前浏览器。
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => {
          setIsOpen(false);
          if (!personalView && !user) {
            sessionStorage.setItem("personal-view-pending", "1");
            router.push(`/login?next=${encodeURIComponent(pathname)}`);
            return;
          }
          togglePersonalView();
          window.setTimeout(() => window.location.reload(), 0);
        }}
        aria-label={personalView ? "查看全部内容" : "仅看我的内容"}
        aria-pressed={personalView}
        title={personalView ? "查看全部内容" : "仅看我的内容"}
        className={`mb-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/50 shadow-xl backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 dark:border-white/10 ${
          personalView
            ? "bg-emerald-500 text-emerald-950"
            : "bg-white/80 text-slate-600 dark:bg-slate-900/80 dark:text-slate-200"
        }`}
      >
        <AppIcon name={personalView ? "unlock" : "lock"} size={17} />
      </button>

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-label="打开工具目录"
        aria-expanded={isOpen}
        className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/50 shadow-xl backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 dark:border-white/10 ${
          isOpen
            ? "bg-[var(--ui-accent)] text-[var(--ui-accent-contrast)]"
            : "bg-white/80 text-slate-600 dark:bg-slate-900/80 dark:text-slate-200"
        }`}
      >
        {isOpen ? <AppIcon name="close" size={19} /> : <AppIcon name="settings" size={19} />}
      </button>
      <ThemeStudio open={themeOpen} onClose={() => setThemeOpen(false)} />
    </div>
  );
}
