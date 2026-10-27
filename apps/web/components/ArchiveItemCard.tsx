import Link from "next/link";
import type { ReactNode } from "react";

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
  media?: ArchiveMedia;
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
  media,
}: ArchiveItemCardProps) {
  const content = (
    <>
      <div className="directory-card-media">
        {media?.kind === "icon" ? (
          <div className="archive-item-icon">{media.content}</div>
        ) : media ? (
          <img
            className={`directory-card-media-image ${media.kind === "cover" && media.fit === "contain" ? "object-contain" : ""}`}
            style={media.kind === "cover" && media.fit === "contain" ? { objectFit: "contain" } : undefined}
            src={media.src}
            alt={media.alt || title}
            loading="lazy"
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
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {label && <span className="directory-date-badge">{label}</span>}
        {cornerBadge && <span className="directory-card-corner-badge">{cornerBadge}</span>}
      </div>

      <div className="directory-card-body">
        <div className="directory-card-copy">
          {label && <time className="directory-card-time">{label}</time>}
          <h2 className="directory-card-title">{title}</h2>
          {description && <p className="directory-card-description">{description}</p>}
        </div>

        <div className="directory-card-foot">
          {category && <span className="directory-card-category">{category}</span>}
          {tags.length > 0 && (
            <div className="directory-card-tags">
              {tags.map((tag) => (
                <span key={tag} className="directory-tag">#{tag}</span>
              ))}
            </div>
          )}
          {meta && <span className="archive-item-meta">{meta}</span>}
        </div>
      </div>
    </>
  );

  const className = "directory-card group archive-item";

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return <Link href={href} className={className}>{content}</Link>;
}
