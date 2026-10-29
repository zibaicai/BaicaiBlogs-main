import { motion } from "framer-motion";
import { Palette, Save, Sparkles } from "lucide-react";

/**
 * 显示 / 主题面板。
 * 旧版是 pywebview 窗口分辨率设置，Web 管理端改为控制 C 端背景表现，
 * 数据写入 background 配置组，与 BackgroundSection 共用同一份配置。
 */
export default function DisplaySection({ formData, handleUpdate, pushToQueue }: any) {
  const colors: string[] = formData.themeColors || [];
  const useGradient = Boolean(formData.useGradient);

  return (
    <motion.section
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-2xl"
    >
      <div className="flex justify-between items-center mb-8 border-b border-white/30 dark:border-slate-700/50 pb-6">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Palette size={22} className="text-fuchsia-400" /> 显示与主题
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-bold">
            控制首页背景渐变与 C 端整体氛围
          </p>
        </div>
        <button
          onClick={() => pushToQueue("显示与主题", "displayConfig")}
          className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-colors"
        >
          <Save size={16} /> 保存修改
        </button>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between p-5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
          <div>
            <div className="text-sm font-bold text-slate-700 dark:text-slate-200">使用纯渐变背景</div>
            <div className="text-[10px] text-slate-400 mt-1">
              关闭时展示背景图片轮播；开启后使用下方主题色渐变
            </div>
          </div>
          <button
            onClick={() => handleUpdate("useGradient", !useGradient)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              useGradient ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                useGradient ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
            主题颜色（每行一个）
          </label>
          <textarea
            rows={5}
            value={colors.join("\n")}
            onChange={(e) =>
              handleUpdate("themeColors", e.target.value.split("\n").map((v) => v.trim()).filter(Boolean))
            }
            className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm mt-1 outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-mono"
            placeholder="#a18cd1"
          />
        </div>

        <div className="rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <Sparkles size={12} className="text-indigo-400" /> 实时预览
          </div>
          <div className="flex flex-wrap gap-3 mb-4">
            {colors.map((color) => (
              <div key={color} className="flex flex-col items-center gap-1">
                <span
                  className="w-14 h-14 rounded-2xl shadow-lg border border-white/40"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[9px] font-mono text-slate-400">{color}</span>
              </div>
            ))}
          </div>
          <div
            className="h-24 rounded-2xl border border-white/30"
            style={{
              background: colors.length
                ? `linear-gradient(-45deg, ${colors.join(", ")})`
                : "linear-gradient(-45deg, #a18cd1, #fbc2eb, #a1c4fd, #c2e9fb)",
              backgroundSize: "400% 400%",
            }}
          />
        </div>
      </div>
    </motion.section>
  );
}
