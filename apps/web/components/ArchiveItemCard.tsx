"use client";

import Link from "next/link";
import GlassSurface from "./ui/glass/GlassSurface";
import { glassProps } from "./ui/glass/GlassSurface";
import type { ReactNode } from "react";
import { ResourceTitle, type ResourceTitleVariant } from "./ui/Typography";
import { OptimizedImage } from "./ui/OptimizedImage";

export type ArchiveCardLayout = "auto" | "cover" | "row" | "profile" | "timeline" | "masonry";

export type ArchiveMedia =
  | { kind: "cover"; src: string; alt?: string; fit?: "cover" | "contain" }
  | { kind: "avatar"; src: string; alt?: string }
  | { kind: "icon"; content: ReactNode };

export interface ArchiveItemCardProps {
  href: string;
  external?: boolean;
  title: string;
  description?: string;
  label?: string;
  category?: string;
  tags?: string[];
  meta?: ReactNode;
  cornerBadge?: ReactNode;
  footnote?: ReactNode;
  media?: ArchiveMedia;
  variant?: ResourceTitleVariant;
  layout?: ArchiveCardLayout;
}

export default function ArchiveItemCard({
  href,
  external = false,
  title,
  description,
  label,
  category,
  tags = [],
  meta,
  cornerBadge,
  footnote,
  media,
  variant,
  layout = "auto",
}: ArchiveItemCardProps) {
  if (layout === "profile") {
    const avatar =
      media?.kind === "icon" ? (
        media.content
      ) : media ? (
        <OptimizedImage
          className="archive-profile-avatar-image"
          src={media.src}
          alt={media.alt || title}
        />
      ) : (
        <span aria-hidden="true">✦</span>
      );

    const body = (
      <>
        <div className="archive-profile-head">
          <span className="archive-profile-avatar">{avatar}</span>
          <div className="archive-profile-heading">
            <ResourceTitle className="archive-profile-title">{title}</ResourceTitle>
            {label && <time className="archive-profile-time">{label}</time>}
          </div>
          {cornerBadge && <span className="archive-profile-corner">{cornerBadge}</span>}
        </div>

        {description && <p className="archive-profile-description">{description}</p>}
        {footnote && <p className="archive-profile-footnote">{footnote}</p>}

        {(category || tags.length > 0 || meta) && (
          <div className="archive-profile-foot">
            {category && <span className="directory-card-category text-meta">{category}</span>}
            {tags.map((tag) => (
              <span key={tag} className="directory-tag text-meta">
                #{tag}
              </span>
            ))}
            {meta && <span className="archive-item-meta text-meta">{meta}</span>}
          </div>
        )}
      </>
    );

    const profileClassName = "archive-profile-card group";
    if (external) {
      return (
        <GlassSurface as="a" variant="card" href={href} target="_blank" rel="noopener noreferrer" className={profileClassName}>
          {body}
        </GlassSurface>
      );
    }
    return (
      <GlassSurface as={Link} variant="card" href={href} className={profileClassName}>
        {body}
      </GlassSurface>
    );
  }

  const content = (
    <>
      <div className="directory-card-media">
        {media?.kind === "icon" ? (
          <div className="archive-item-icon">{media.content}</div>
        ) : media ? (
          <OptimizedImage
            className={`directory-card-media-image ${media.kind === "cover" && media.fit === "contain" ? "object-contain" : ""}`}
            style={media.kind === "cover" && media.fit === "contain" ? { objectFit: "contain" } : undefined}
            src={media.src}
            alt={media.alt || title}
          />
        ) : (
          <div className="archive-item-icon">✦</div>
        )}
        {media?.kind === "cover" && (
          <img
            className="directory-card-blur"
            src={media.src}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
          />
        )}
        {layout !== "masonry" && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        )}
        {label && <span className="directory-date-badge glass-blur glass-blur--sm text-meta">{label}</span>}
        {cornerBadge && <span {...glassProps("badge", "suspend", "directory-card-corner-badge")}>{cornerBadge}</span>}
      </div>

      <div className="directory-card-body">
        <div className="directory-card-copy">
          {label && <time className="directory-card-time text-meta">{label}</time>}
          <ResourceTitle className="directory-card-title" variant={variant}>{title}</ResourceTitle>
          {description && <p className="directory-card-description">{description}</p>}
          {footnote && <p className="directory-card-footnote">{footnote}</p>}
        </div>

        <div className="directory-card-foot">
          {category && <span className="directory-card-category text-meta">{category}</span>}
          {tags.length > 0 && (
            <div className="directory-card-tags">
              {tags.map((tag) => (
                <span key={tag} className="directory-tag text-meta">#{tag}</span>
              ))}
            </div>
          )}
          {meta && <span className="archive-item-meta text-meta">{meta}</span>}
        </div>
      </div>
    </>
  );

  const className = `directory-card archive-card--${layout === "auto" ? "cover" : layout} group archive-item`;

  if (external) {
    return (
      <GlassSurface as="a" variant="card" href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </GlassSurface>
    );
  }

  return (
    <GlassSurface as={Link} variant="card" href={href} className={className}>
      {content}
    </GlassSurface>
  );
}
