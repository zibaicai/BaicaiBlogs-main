"use client";

import { useSiteConfigContext } from "../context/SiteConfigProvider";
import { OptimizedImage } from "./ui/OptimizedImage";
import ClientSocials from "./ClientSocials";

export default function AuthorCard() {
  const { siteInfo } = useSiteConfigContext();

  return (
    <div className="author-card flex h-full flex-col justify-evenly rounded-3xl border border-white/40 bg-white/60 p-5 text-left shadow-xl backdrop-blur-xl transition-colors duration-700 dark:border-white/10 dark:bg-slate-800/50">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 shrink-0 rounded-full bg-gradient-to-tr from-[var(--ui-accent)] to-[var(--ui-accent-hover)] p-1 shadow-md transition-transform duration-500 hover:rotate-3">
          <OptimizedImage
            src={siteInfo.avatarUrl}
            alt="avatar"
            className="h-full w-full rounded-full bg-white object-cover"
            priority
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold leading-tight text-slate-900 dark:text-white">
            {siteInfo.authorName}
          </h3>
          <p className="mt-1.5 line-clamp-3 text-[11px] font-medium leading-relaxed text-slate-700 dark:text-slate-300">
            {siteInfo.bio}
          </p>
        </div>
      </div>
      <div className="border-t border-slate-300/35 pt-3 dark:border-white/10">
        <ClientSocials align="start" />
      </div>
    </div>
  );
}
