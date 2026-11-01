"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppIcon } from "./ui/AppIcon";
import { usePathname } from "next/navigation";
import { useMusic } from "./MusicProvider";
import { useTheme } from "./ThemeProvider";
import ThemeStudio from "./ThemeStudio";
import Tabs, { type TabItem } from "./ui/Tabs";
import { glassProps } from "./ui/glass/GlassSurface";
import { useGlassSettings, type GlassScrollPauseMode } from "./glass/GlassSettingsProvider";

type ToolboxTab = "appearance" | "atmosphere" | "performance" | "music";

const TOOLBOX_TABS: TabItem[] = [
  { value: "appearance", label: "外观", icon: <AppIcon name="palette" size={13} /> },
  { value: "atmosphere", label: "氛围", icon: <AppIcon name="sparkles" size={13} /> },
  { value: "performance", label: "性能", icon: <AppIcon name="settings" size={13} /> },
  { value: "music", label: "音乐", icon: <AppIcon name="music" size={13} /> },
];

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
  const [tab, setTab] = useState<ToolboxTab>("appearance");
  const [prefs, setPrefs] = useState<Record<ToolId, boolean>>(DEFAULT_PREFS);
  const [visualEffects, setVisualEffects] = useState(true);
  const [musicVisible, setMusicVisible] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const pathname = usePathname();
  const { currentSong, isPlaying, togglePlay } = useMusic();
  const { preset, setPreset } = useTheme();
  const {
    backgroundEnabled,
    contentEnabled,
    scrollPauseMode,
    sakuraCount,
    fireflyCount,
    setBackgroundEnabled,
    setContentEnabled,
    setScrollPauseMode,
    setSakuraCount,
    setFireflyCount,
  } = useGlassSettings();

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
            {...glassProps("popover", "suspend", "tool-directory mb-1 flex max-h-[min(78vh,560px)] w-[min(320px,calc(100vw-2rem))] flex-col overflow-hidden")}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between border-b border-slate-200/70 px-5 py-4 dark:border-white/10">
              <div>
                <span className="font-mono text-meta uppercase tracking-[0.2em] text-slate-400">PREFERENCES</span>
                <h3 className="mt-1 text-base font-black text-slate-800 dark:text-white">站点设置</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="关闭站点设置"
              >
                <AppIcon name="close" size={16} />
              </button>
            </div>

            <div className="px-3 pb-2 pt-3">
              <Tabs
                items={TOOLBOX_TABS}
                value={tab}
                onValueChange={(value) => setTab(value as ToolboxTab)}
                id="toolbox-tabs"
                ariaLabel="站点设置分类"
                size="sm"
              />
            </div>

            <div className="tool-tab-viewport min-h-0 p-2">
              {tab === "appearance" && (
                <div
                  role="tabpanel"
                  id="toolbox-tabs-panel-appearance"
                  aria-labelledby="toolbox-tabs-tab-appearance"
                >
                  <div className="flex items-center justify-between gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-slate-100/70 dark:hover:bg-white/5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                        <AppIcon name="sparkles" size={15} />
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100">博客模式</div>
                        <div className="mt-0.5 truncate text-meta text-slate-400">关闭背景、粒子与动效</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!visualEffects}
                      aria-label={`博客模式${!visualEffects ? "已开启" : "已关闭"}`}
                      onClick={toggleVisualEffects}
                      className={`tool-switch relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                        !visualEffects ? "bg-[var(--ui-accent)]" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                          !visualEffects ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
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
              )}

              {tab === "atmosphere" && (
                <div
                  role="tabpanel"
                  id="toolbox-tabs-panel-atmosphere"
                  aria-labelledby="toolbox-tabs-tab-atmosphere"
                >
                  <div className="px-3 pb-1 text-meta font-black uppercase tracking-[0.16em] text-slate-400">
                    氛围效果
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
                          disabled={!visualEffects}
                          onClick={() => toggle(tool.id)}
                          className={`tool-switch relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
                            enabled && visualEffects ? "bg-[var(--ui-accent)]" : "bg-slate-300 dark:bg-slate-700"
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                              enabled && visualEffects ? "left-6" : "left-1"
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                  <p className="px-3 pt-2 text-meta text-slate-400">
                    开启博客模式后，氛围效果会暂时停用。
                  </p>
                </div>
              )}

              {tab === "performance" && (
                <div
                  role="tabpanel"
                  id="toolbox-tabs-panel-performance"
                  aria-labelledby="toolbox-tabs-tab-performance"
                >
                  <div className="flex items-center justify-between gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-slate-100/70 dark:hover:bg-white/5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                        <AppIcon name="image" size={15} />
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100">背景毛玻璃</div>
                        <div className="mt-0.5 text-meta text-slate-400">关闭背景层的模糊，不影响内容</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={backgroundEnabled}
                      aria-label={`背景毛玻璃${backgroundEnabled ? "已开启" : "已关闭"}`}
                      onClick={() => setBackgroundEnabled(!backgroundEnabled)}
                      className={`tool-switch relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                        backgroundEnabled ? "bg-[var(--ui-accent)]" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                          backgroundEnabled ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-4 border-t border-slate-200/70 px-3 py-3 dark:border-white/10">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                        <AppIcon name="sparkles" size={15} />
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100">内容毛玻璃</div>
                        <div className="mt-0.5 text-meta text-slate-400">关闭卡片、面板和弹层的模糊</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={contentEnabled}
                      aria-label={`内容毛玻璃${contentEnabled ? "已开启" : "已关闭"}`}
                      onClick={() => setContentEnabled(!contentEnabled)}
                      className={`tool-switch relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                        contentEnabled ? "bg-[var(--ui-accent)]" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                          contentEnabled ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className={`mt-1 border-t border-slate-200/70 px-3 py-3 dark:border-white/10 ${contentEnabled ? "" : "opacity-50"}`}>
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                        <AppIcon name="pause" size={15} />
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100">滚动暂停</div>
                        <div className="mt-0.5 text-meta text-slate-400">停止滚动 300ms 后恢复</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1.5" role="group" aria-label="滚动暂停范围">
                      {([
                        ["off", "关闭"],
                        ["content", "仅内容"],
                        ["all", "全部"],
                      ] as const).map(([value, label]) => (
                        <button
                          key={value as GlassScrollPauseMode}
                          type="button"
                          disabled={!contentEnabled}
                          onClick={() => setScrollPauseMode(value)}
                          className={`rounded-lg border px-2 py-1.5 text-meta font-black transition ${
                            scrollPauseMode === value
                              ? "border-[var(--ui-accent)] bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]"
                              : "border-slate-200 text-slate-500 hover:border-[var(--ui-accent)]/40 dark:border-white/10 dark:text-slate-400"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-1 border-t border-slate-200/70 px-3 py-3 dark:border-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                          <AppIcon name="sparkles" size={15} />
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">樱花数量</div>
                          <div className="mt-0.5 text-meta text-slate-400">白天背景花瓣密度</div>
                        </div>
                      </div>
                      <span className="text-meta font-black text-slate-500 dark:text-slate-300">{sakuraCount}</span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={2000}
                      step={100}
                      value={sakuraCount}
                      onChange={(event) => setSakuraCount(Number(event.target.value))}
                      aria-label="樱花数量"
                      className="mt-2 w-full accent-[var(--ui-accent)]"
                    />
                  </div>

                  <div className="mt-1 border-t border-slate-200/70 px-3 py-3 dark:border-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                          <AppIcon name="sparkles" size={15} />
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">萤火虫数量</div>
                          <div className="mt-0.5 text-meta text-slate-400">夜间背景光点密度</div>
                        </div>
                      </div>
                      <span className="text-meta font-black text-slate-500 dark:text-slate-300">{fireflyCount}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={120}
                      step={2}
                      value={fireflyCount}
                      onChange={(event) => setFireflyCount(Number(event.target.value))}
                      aria-label="萤火虫数量"
                      className="mt-2 w-full accent-[var(--ui-accent)]"
                    />
                  </div>

                  <p className="px-3 pt-2 text-meta text-slate-400">
                    关闭毛玻璃可以明显降低滚动合成开销。滚动暂停可能产生层重建抖动，建议仅在需要时开启。粒子数量修改后会立即重建背景效果。
                  </p>
                </div>
              )}

              {tab === "music" && (
                <div
                  role="tabpanel"
                  id="toolbox-tabs-panel-music"
                  aria-labelledby="toolbox-tabs-tab-music"
                >
                  <div className="flex items-center justify-between gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-slate-100/70 dark:hover:bg-white/5">
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
              )}
            </div>

            <p className="border-t border-slate-200/70 px-5 py-3 text-meta text-slate-400 dark:border-white/10">
              开关会保存在当前浏览器。
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-label="打开工具目录"
        aria-expanded={isOpen}
        className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/50 shadow-xl glass-blur glass-blur--xl transition-all duration-300 hover:scale-105 active:scale-95 dark:border-white/10 ${
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
