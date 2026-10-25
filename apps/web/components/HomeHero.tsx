"use client";

import Link from "next/link";
import { ArrowUpRight, Code2, Mail, Radio } from "lucide-react";
import { useSiteConfigContext } from "../context/SiteConfigProvider";

type Props = {
  postCount: number;
  chatterCount: number;
  photoCount: number;
};

export default function HomeHero({ postCount, chatterCount, photoCount }: Props) {
  const { siteInfo } = useSiteConfigContext();

  const socials = [
    { label: "GitHub", href: siteInfo?.social?.github, icon: Code2 },
    { label: "Gitee", href: siteInfo?.social?.gitee, icon: Code2 },
    { label: "Email", href: siteInfo?.social?.email ? `mailto:${siteInfo.social.email}` : undefined, icon: Mail },
  ].filter((item) => item.href);

  return (
    <div className="hv-hero-copy">
      <div className="hv-eyebrow">
        <span className="hv-live-dot" />
        TIDE ARCHIVE <span className="hv-slash">/</span> 2026
      </div>

      <div className="hv-author-row">
        <div className="hv-avatar">
          {siteInfo?.avatarUrl ? (
            <img src={siteInfo.avatarUrl} alt={siteInfo.authorName || "avatar"} />
          ) : (
            <span>{(siteInfo?.authorName || "Y").slice(0, 1)}</span>
          )}
        </div>
        <div className="hv-author-id">
          <span className="hv-profile-label">MAKER / OWNER</span>
          <strong>{siteInfo?.authorName || "YeLuo"}</strong>
        </div>
        <span className="hv-online"><Radio size={10} /> PRESENT</span>
      </div>

      <p className="hv-intro-copy">
        把代码、照片、音乐，和一些未完成的想法，
        <br className="hidden sm:block" />
        收进同一片海。
      </p>

      <div className="hv-hero-actions">
        <Link href="/posts" className="hv-button hv-button-primary">
          翻阅档案 <ArrowUpRight size={15} />
        </Link>
        <Link href="/about" className="hv-button">
          认识我
        </Link>
      </div>

      <div className="hv-hero-meta">
        <div className="hv-stats hv-stats-inline">
          <div>
            <strong>{String(postCount).padStart(2, "0")}</strong>
            <span>文章</span>
          </div>
          <div>
            <strong>{String(chatterCount).padStart(2, "0")}</strong>
            <span>说说</span>
          </div>
          <div>
            <strong>{String(photoCount).padStart(2, "0")}</strong>
            <span>照片</span>
          </div>
        </div>

        <div className="hv-socials">
          {socials.length > 0 ? (
            socials.map(({ label, href, icon: Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" title={label}>
                <Icon size={14} />
              </a>
            ))
          ) : (
            <Link href="/about" aria-label="关于我">
              <ArrowUpRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
