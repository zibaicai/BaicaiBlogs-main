import Link from "next/link";
import type { ReactNode } from "react";

export default function ArchiveCard({
  href,
  image,
  alt,
  eyebrow,
  title,
  description,
  meta,
  badges,
  imageClassName = "",
}: {
  href: string;
  image?: string;
  alt: string;
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  meta?: ReactNode;
  badges?: ReactNode;
  imageClassName?: string;
}) {
  return (
    <Link href={href} className="archive-card group">
      <div className="archive-card-media">
        {image ? (
          <img src={image} alt={alt} loading="lazy" className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] ${imageClassName}`} />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/25 to-slate-900/40 text-[10px] font-black uppercase tracking-widest text-white/55">
            No Cover
          </div>
        )}
      </div>
      <div className="archive-card-body">
        {eyebrow && <div className="archive-card-eyebrow">{eyebrow}</div>}
        <h2 className="archive-card-title">{title}</h2>
        {description && <p className="archive-card-description">{description}</p>}
        <div className="archive-card-foot">
          <div className="flex flex-wrap items-center gap-1.5">{badges}</div>
          {meta && <span className="archive-card-meta">{meta}</span>}
          <span className="archive-card-arrow" aria-hidden="true">↗</span>
        </div>
      </div>
    </Link>
  );
}
