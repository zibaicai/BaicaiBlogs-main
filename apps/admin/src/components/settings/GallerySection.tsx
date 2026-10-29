import { motion } from "framer-motion";
import { Image as ImageIcon, Save } from "lucide-react";

export default function GallerySection({ formData, handleUpdate, pushToQueue }: any) {
  const save = () => {
    pushToQueue("照片墙配置", "galleryConfig", {
      photoWallImage: formData.photoWallImage,
    });
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
          <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ImageIcon size={22} className="text-pink-400" /> 照片墙
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-bold">
            设置首页照片墙的预览封面。
          </p>
        </div>
        <button
          onClick={save}
          className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-colors"
        >
          <Save size={16} /> 保存修改
        </button>
      </div>

      <div className="space-y-6 max-w-2xl">
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">首页照片墙预览图</label>
          <input
            type="text"
            value={formData.photoWallImage || ""}
            onChange={(e) => handleUpdate("photoWallImage", e.target.value)}
            className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm mt-1 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            placeholder="https://..."
          />
          {formData.photoWallImage && (
            <div className="mt-3 w-full aspect-video rounded-2xl overflow-hidden border border-white/40 dark:border-slate-700 bg-slate-200/40 dark:bg-slate-900/40">
              <img src={formData.photoWallImage} alt="preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
