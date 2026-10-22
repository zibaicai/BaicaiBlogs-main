import { motion } from "framer-motion";
import { ExternalLink, GitBranch, Save, Server, ShieldCheck } from "lucide-react";

/**
 * 仓库 / 部署面板。
 *
 * 旧版依赖桌面端 Python 引擎在本机执行 git、rsync、SSH 等命令；纯 Web 管理端
 * 不直接操作服务器，改为把仓库地址与部署备注保存到站点 misc 配置，
 * 实际发布仍走部署文档与服务器脚本。
 */
export default function RepoSection({ formData, handleUpdate, pushToQueue }: any) {
  const repo = {
    repoUrl: "https://github.com/zibaicai/BaicaiBlogs-main",
    note: "",
    ...(formData.repoConfig || {}),
  };

  const updateRepo = (key: "repoUrl" | "note", value: string) => {
    handleUpdate("repoConfig", { ...repo, [key]: value });
  };

  const items = [
    {
      icon: <GitBranch size={18} className="text-indigo-400" />,
      title: "源码仓库",
      value: repo.repoUrl.replace(/^https?:\/\//, ""),
      href: repo.repoUrl,
    },
    {
      icon: <Server size={18} className="text-emerald-400" />,
      title: "C 端站点",
      value: "www.zibaicai.cn",
      href: "https://www.zibaicai.cn",
    },
    {
      icon: <ShieldCheck size={18} className="text-purple-400" />,
      title: "管理端",
      value: "admin.zibaicai.cn",
      href: "https://admin.zibaicai.cn",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-xl"
    >
      <div className="flex justify-between items-center mb-8 border-b border-white/30 dark:border-slate-700/50 pb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <span>🗂️</span> 仓库与部署
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-bold">
            浏览器不直接执行服务器命令；这里保存仓库入口与发布备注
          </p>
        </div>
        <button
          onClick={() => pushToQueue("仓库与部署")}
          className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-colors"
        >
          <Save size={16} /> 保存修改
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((item) => (
          <a
            key={item.title}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:border-indigo-400 transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              {item.icon}
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {item.title}
              </span>
            </div>
            <div className="text-sm font-bold text-slate-700 dark:text-slate-200 break-all group-hover:text-indigo-500 transition-colors flex items-center gap-1">
              {item.value}
              <ExternalLink size={12} className="shrink-0 opacity-50" />
            </div>
          </a>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4">
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">源码仓库 URL</label>
          <input
            type="text"
            value={repo.repoUrl}
            onChange={(e) => updateRepo("repoUrl", e.target.value)}
            className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm mt-1 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            placeholder="https://github.com/owner/repo"
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">部署备注</label>
          <textarea
            rows={3}
            value={repo.note}
            onChange={(e) => updateRepo("note", e.target.value)}
            className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm mt-1 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="例如：发布前先备份 /var/www/admin，再切换 current 软链"
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-5 text-xs leading-relaxed text-amber-700 dark:text-amber-300 font-bold">
        旧版的「一键同步 / 部署 / SSH」依赖本地 Python 引擎（pywebview），迁移后已从管理端移除。
        服务器切换、备份与回滚命令见仓库根目录部署文档。
      </div>
    </motion.section>
  );
}
