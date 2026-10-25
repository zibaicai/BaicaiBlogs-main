"use client";

import Link from "next/link";
import { useSiteConfigContext } from "../context/SiteConfigProvider";

export default function Footer() {
  const { siteInfo } = useSiteConfigContext();
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-16 border-t border-slate-200/50 dark:border-slate-800/60 bg-white/30 dark:bg-slate-950/30 backdrop-blur-xl">
      <div className="w-[95%] max-w-6xl mx-auto py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 font-bold">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <span>© {year} {siteInfo.authorName}</span>
          <Link href="/about" className="hover:text-indigo-500 transition-colors">关于</Link>
          <Link href="/friends" className="hover:text-indigo-500 transition-colors">友链</Link>
          <Link href="/moments" className="hover:text-indigo-500 transition-colors">碎片</Link>
          <a
            href="https://admin.zibaicai.cn"
            rel="nofollow noreferrer"
            className="hover:text-indigo-500 transition-colors"
          >
            管理
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {siteInfo.icpConfig?.name && (
            <a
              href={siteInfo.icpConfig.link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-500 transition-colors border-b border-dashed border-slate-400/50 dark:border-slate-600 pb-0.5"
            >
              {siteInfo.icpConfig.name}
            </a>
          )}
          <span className="opacity-60">Powered by Next.js</span>
        </div>
      </div>
    </footer>
  );
}
