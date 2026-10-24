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
    <section className="hv-hero">
      <div className="hv-hero-copy">
        <div className="hv-eyebrow">
          <span className="hv-live-dot" />
          PERSONAL SPACE <span className="hv-slash">/</span> 2026
        </div>

        <h1 className="hv-display">
          云端的
          <br />
          <em>小屋</em>
        </h1>

        <p className="hv-hero-lede">
          把代码、照片，和一些没有结论的夜晚，
          <br className="hidden sm:block" />
          放在同一个地方。
        </p>

        <div className="hv-hero-actions">
          <Link href="/posts" className="hv-button hv-button-primary">
            阅读文章 <ArrowUpRight size={15} />
          </Link>
          <Link href="/about" className="hv-button">
            关于我
          </Link>
        </div>

        <div className="hv-hero-foot">
          <span>SCROLL TO EXPLORE</span>
          <span className="hv-hero-line" />
          <span>{postCount + chatterCount + photoCount} PIECES</span>
        </div>
      </div>

      <aside className="hv-profile">
        <div className="hv-profile-top">
          <div className="hv-avatar">
            {siteInfo?.avatarUrl ? (
              <img src={siteInfo.avatarUrl} alt={siteInfo.authorName || "avatar"} />
            ) : (
              <span>{(siteInfo?.authorName || "Y").slice(0, 1)}</span>
            )}
          </div>
          <div className="hv-profile-id">
            <span className="hv-profile-label">AUTHOR / OWNER</span>
            <h2>{siteInfo?.authorName || "YeLuo"}</h2>
          </div>
          <span className="hv-online"><Radio size={10} /> ONLINE</span>
        </div>

        <p className="hv-profile-bio">{siteInfo?.bio || "记录与创造，缓慢地更新。"}</p>

        <div className="hv-stats">
          <div>
            <strong>{String(postCount).padStart(2, "0")}</strong>
            <span>文章</span>
          </div>
          <div>
            <strong>{String(chatterCount).padStart(2, "0")}</strong>
            <span>杂谈</span>
          </div>
          <div>
            <strong>{String(photoCount).padStart(2, "0")}</strong>
            <span>照片</span>
          </div>
        </div>

        <div className="hv-profile-bottom">
          <span className="hv-profile-label">FIND ME</span>
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
      </aside>
    </section>
  );
}
