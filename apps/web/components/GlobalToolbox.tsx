"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Settings2, X } from "lucide-react";

type ToolId = "danmaku" | "click" | "pet";

type Tool = {
  id: ToolId;
  name: string;
  description: string;
};

const TOOLS: Tool[] = [
  { id: "danmaku", name: "弹幕", description: "首页漂浮弹幕与发送入口" },
  { id: "click", name: "点击特效", description: "点击页面时的水波涟漪" },
  { id: "pet", name: "桌面宠物", description: "右下角的鲸鱼娘" },
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

export default function GlobalToolbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [prefs, setPrefs] = useState<Record<ToolId, boolean>>(DEFAULT_PREFS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("toolbox-prefs");
      if (raw) {
        const stored = JSON.parse(raw) as Partial<Record<ToolId, boolean>>;
        const next = { ...DEFAULT_PREFS, ...stored };
        setPrefs(next);
        applyPrefs(next);
        return;
      }
    } catch {
      // ignore malformed local prefs
    }
    applyPrefs(DEFAULT_PREFS);
  }, []);

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

  return (
    <div className="global-toolbox fixed bottom-6 left-6 z-[9999] flex flex-col items-start gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="tool-directory mb-1 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/92"
          >
            <div className="flex items-start justify-between border-b border-slate-200/70 px-5 py-4 dark:border-white/10">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-400">TOOLS</span>
                <h3 className="mt-1 text-base font-black text-slate-800 dark:text-white">工具目录</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="关闭工具目录"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-2">
              {TOOLS.map((tool) => {
                const enabled = prefs[tool.id];
                return (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-slate-100/70 dark:hover:bg-white/5"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{tool.name}</div>
                      <div className="mt-0.5 truncate text-[10px] text-slate-400">{tool.description}</div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      aria-label={`${tool.name}${enabled ? "已开启" : "已关闭"}`}
                      onClick={() => toggle(tool.id)}
                      className={`tool-switch relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                        enabled ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-700"
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
            </div>

            <p className="border-t border-slate-200/70 px-5 py-3 text-[10px] text-slate-400 dark:border-white/10">
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
        className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/50 shadow-xl backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 dark:border-white/10 ${
          isOpen
            ? "bg-indigo-500 text-white"
            : "bg-white/80 text-slate-600 dark:bg-slate-900/80 dark:text-slate-200"
        }`}
      >
        {isOpen ? <X size={19} /> : <Settings2 size={19} />}
      </button>
    </div>
  );
}
