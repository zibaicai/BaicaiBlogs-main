"use client";

import Link from "next/link";
import { ArrowUpRight, Code2, Radio } from "lucide-react";
import { useSiteConfigContext } from "../context/SiteConfigProvider";
import type { RoomProfile } from "../lib/api";

type Props = {
  postCount: number;
  momentCount: number;
  photoCount: number;
  profile?: RoomProfile;
};

export default function HomeHero({ postCount, momentCount, photoCount, profile }: Props) {
  const { siteInfo } = useSiteConfigContext();
  const displayName = profile?.nickname || siteInfo?.authorName || "YeLuo";
  const avatar = profile ? profile.avatar : siteInfo?.avatarUrl;
  const bio = profile?.roomBio || siteInfo?.bio || "收集生活的砂砾，也收藏那些不想丢掉的东西。";
  const aboutHref = profile ? `/u/${encodeURIComponent(profile.username)}/about` : "/about";

  const socials = [
    { label: "GitHub", href: siteInfo?.social?.github, icon: Code2 },
    { label: "Gitee", href: siteInfo?.social?.gitee, icon: Code2 },
  ].filter((item) => item.href);

  return (
    <div className="hv-hero-copy">
      <div className="hv-eyebrow">
        <span className="hv-live-dot" />
        TIDE ARCHIVE <span className="hv-slash">/</span> 2026
      </div>

      <div className="hv-author-row">
        <div className="hv-avatar">
          {avatar ? (
            <img src={avatar} alt={displayName} />
          ) : (
            <span>{displayName.slice(0, 1)}</span>
          )}
        </div>
        <div className="hv-author-id">
          <span className="hv-profile-label">{profile ? "ROOM / OWNER" : "MAKER / OWNER"}</span>
          <strong>{displayName}</strong>
        </div>
        <span className="hv-online"><Radio size={10} /> PRESENT</span>
      </div>

      <p className="hv-intro-copy">
        {bio}
      </p>

      <div className="hv-hero-actions">
        <Link href="/posts" className="hv-button hv-button-primary">
          翻阅档案 <ArrowUpRight size={15} />
        </Link>
        <Link href={aboutHref} className="hv-button">
          关于我
        </Link>
      </div>

      <div className="hv-hero-meta">
        <div className="hv-stats hv-stats-inline">
          <div>
            <strong>{String(postCount).padStart(2, "0")}</strong>
            <span>笔记</span>
          </div>
          <div>
            <strong>{String(momentCount).padStart(2, "0")}</strong>
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
            <Link href={aboutHref} aria-label="关于我">
              <ArrowUpRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
