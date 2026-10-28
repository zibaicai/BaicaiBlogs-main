import { useState } from "react";
import { motion } from "framer-motion";
import { Music2, Plus, Save, Trash2 } from "lucide-react";

export default function MusicSection({ formData, handleUpdate, pushToQueue }: any) {
  const ids: string[] = Array.isArray(formData.cloudMusicIds) ? formData.cloudMusicIds : [];
  const [newId, setNewId] = useState("");

  const add = () => {
    const id = newId.trim();
    if (!id) return;
    if (ids.includes(id)) {
      setNewId("");
      return;
    }
    handleUpdate("cloudMusicIds", [...ids, id]);
    setNewId("");
  };

  const remove = (index: number) => {
    handleUpdate(
      "cloudMusicIds",
      ids.filter((_, i) => i !== index)
    );
  };

  return (
    <motion.section
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-2xl"
    >
      <div className="flex justify-between items-center mb-8 border-b border-white/30 dark:border-slate-700/50 pb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Music2 size={22} className="text-pink-400" /> 歌单管理
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-bold">
            管理 C 端播放器使用的网易云歌曲 ID 列表
          </p>
        </div>
        <button
          onClick={() => pushToQueue("网易云歌单")}
          className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-colors"
        >
          <Save size={16} /> 保存修改
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-4">
            当前绑定 ({ids.length})
          </p>
          <div className="max-h-[380px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {ids.map((id, index) => (
              <div
                key={`${id}-${index}`}
                className="flex justify-between items-center p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-white/20 dark:border-slate-700/50 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center text-sm">
                    ♪
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200 truncate">
                    #{id}
                  </span>
                </div>
                <button
                  onClick={() => remove(index)}
                  className="w-8 h-8 shrink-0 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white flex items-center justify-center"
                  title="移除"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {ids.length === 0 && (
              <div className="text-center py-10 text-xs font-bold text-slate-500">暂无歌曲 ID</div>
            )}
          </div>
        </div>

        <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-3xl p-6 space-y-5 h-fit">
          <p className="text-[10px] font-black text-slate-400 uppercase">添加歌曲 ID</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="输入歌曲 ID"
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") add();
              }}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-500 font-mono"
            />
            <button
              onClick={add}
              className="px-5 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-pink-500/20 flex items-center gap-1 transition-colors"
            >
              <Plus size={14} /> 加入
            </button>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            这里只保存 ID，歌曲地址由后端 `/api/public/music` 实时解析；解析失败的 ID 不会出现在 C 端播放器。
          </p>
          <button
            onClick={() => pushToQueue("网易云歌单")}
            className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-xl active:scale-95 transition-all"
          >
            保存歌单
          </button>
        </div>
      </div>
    </motion.section>
  );
}
