import Link from "next/link";
import type { ReactNode } from "react";
import { ResourceTitle, type ResourceTitleVariant } from "./ui/Typography";
import { OptimizedImage } from "./ui/OptimizedImage";

type ArchiveCardProps = {
  href: string;
  image?: string;
  alt: string;
  media?: ReactNode;
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  meta?: ReactNode;
  badges?: ReactNode;
  imageClassName?: string;
  external?: boolean;
  variant?: ResourceTitleVariant;
};

export default function ArchiveCard({
  href,
  image,
  alt,
  media,
  eyebrow,
  title,
  description,
  meta,
  badges,
  imageClassName = "",
  external = false,
  variant,
}: ArchiveCardProps) {
  const content = (
    <>
      <div className="archive-card-media">
        {media ? (
          media
        ) : image ? (
          <OptimizedImage
            src={image}
            alt={alt}
            className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] ${imageClassName}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/25 to-slate-900/40 text-[10px] font-black uppercase tracking-widest text-white/55">
            No Cover
          </div>
        )}
      </div>
      <div className="archive-card-body">
        <ResourceTitle className="archive-card-title" variant={variant}>{title}</ResourceTitle>
        {description && <p className="archive-card-description">{description}</p>}
        <div className="archive-card-foot">
          {eyebrow && <div className="archive-card-eyebrow">{eyebrow}</div>}
          <div className="flex flex-wrap items-center gap-1.5">{badges}</div>
          {meta && <span className="archive-card-meta">{meta}</span>}
          <span className="archive-card-arrow" aria-hidden="true">↗</span>
        </div>
      </div>
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="archive-card group">
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className="archive-card group">
      {content}
    </Link>
  );
}
