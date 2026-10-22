import { motion } from "framer-motion";
import { ExternalLink, GitBranch, Server, ShieldCheck } from "lucide-react";

/**
 * 仓库 / 部署面板。
 *
 * 旧版依赖桌面端 Python 引擎在本机执行 git、rsync、SSH 等命令；纯 Web 管理端
 * 不应也无法直接操作服务器，因此这里保留只读的部署信息与仓库入口，
 * 实际部署请走项目根目录的 scripts / 部署文档。
 */
export default function RepoSection() {
  const items = [
    {
      icon: <GitBranch size={18} className="text-indigo-400" />,
      title: "源码仓库",
      value: "github.com/zibaicai/BaicaiBlogs-main",
      href: "https://github.com/zibaicai/BaicaiBlogs-main",
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
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <span>🗂️</span> 仓库与部署
        </h2>
        <p className="text-slate-500 text-sm mt-2 font-bold">
          浏览器不直接执行服务器命令；这里展示当前部署入口，发布请使用项目脚本。
        </p>
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

      <div className="mt-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-5 text-xs leading-relaxed text-amber-700 dark:text-amber-300 font-bold">
        旧版的「一键同步 / 部署 / SSH」依赖本地 Python 引擎（pywebview），迁移后已从管理端移除。
        服务器切换、备份与回滚命令见仓库根目录部署文档。
      </div>
    </motion.section>
  );
}
