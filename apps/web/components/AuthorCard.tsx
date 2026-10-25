"use client";

import { useSiteConfigContext } from "../context/SiteConfigProvider";
import ClientSocials from "./ClientSocials";

export default function AuthorCard() {
  const { siteInfo } = useSiteConfigContext();

  return (
    <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-xl text-center">
      <div className="w-20 h-20 mx-auto rounded-full p-1 bg-gradient-to-tr from-[var(--ui-accent)] to-[var(--ui-accent-hover)] shadow-md mb-4 transition-transform duration-500 hover:rotate-3">
        <img
          src={siteInfo.avatarUrl}
          alt="avatar"
          className="w-full h-full rounded-full object-cover bg-white"
        />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{siteInfo.authorName}</h3>
      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium mb-4">
        {siteInfo.bio}
      </p>
      <ClientSocials />
    </div>
  );
}
