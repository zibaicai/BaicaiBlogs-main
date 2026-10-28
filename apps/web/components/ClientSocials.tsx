"use client";

import { Code2, GitFork } from "lucide-react";
import type { ReactNode } from "react";
import { useSiteConfigContext } from "../context/SiteConfigProvider";

type SocialProps = {
  label: string;
  href?: string;
  children: ReactNode;
};

function SocialLink({ label, href, children }: SocialProps) {
  const content = (
    <span
      className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/60 bg-white/55 text-slate-600 shadow-sm transition-colors duration-300 hover:border-[var(--ui-accent)]/40 hover:bg-[var(--ui-accent)] hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
      title={label}
      aria-label={label}
    >
      {children}
    </span>
  );

  if (!href) return content;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
      {content}
    </a>
  );
}

export default function ClientSocials({ align = "center" }: { align?: "center" | "start" }) {
  const { siteInfo } = useSiteConfigContext();
  const social = siteInfo?.social;

  return (
    <div className={`flex flex-wrap gap-1.5 ${align === "start" ? "justify-start" : "justify-center"}`}>
      <SocialLink label="GitHub" href={social?.github}>
        <Code2 size={15} strokeWidth={1.9} />
      </SocialLink>
      <SocialLink label="Gitee" href={social?.gitee}>
        <GitFork size={15} strokeWidth={1.9} />
      </SocialLink>
    </div>
  );
}
