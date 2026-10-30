"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { OptimizedImage } from "../ui/OptimizedImage";

export type MediaStackVariant = "stack" | "collage";
export type MediaStackContentPosition = "overlay" | "below";

export interface MediaStackCardProps {
  href?: string;
  external?: boolean;
  cover: string;
  images?: string[];
  alt: string;
  variant?: MediaStackVariant;
  contentPosition?: MediaStackContentPosition;
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  meta?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  imageClassName?: string;
}

/**
 * Generic media card shell for stacked and collage presentations.
 * The content slots are intentionally kept generic so the same shell can be
 * reused by albums, projects, collections, or other media-backed resources.
 */
export default function MediaStackCard({
  href,
  external = false,
  cover,
  images,
  alt,
  variant = "stack",
  contentPosition = "overlay",
  eyebrow,
  title,
  description,
  badge,
  meta,
  footer,
  children,
  className = "",
  imageClassName = "",
}: MediaStackCardProps) {
  const collage = (images && images.length > 0 ? images : [cover]).slice(0, 4);

  const card = (
    <div
      className={`media-stack-card media-stack-card--${variant} media-stack-card--content-${contentPosition} ${className}`}
      style={{ "--media-stack-cover": `url("${cover.replace(/"/g, "%22")}")` } as CSSProperties}
    >
      <div className="media-stack-visual">
        {variant === "collage" ? (
          <div className="media-stack-collage" aria-hidden="true">
            {collage.map((src, index) => (
              <OptimizedImage
                key={`${src}-${index}`}
                src={src}
                alt=""
                loading="lazy"
                className={`media-stack-collage-image ${imageClassName}`}
              />
            ))}
          </div>
        ) : (
          <OptimizedImage
            src={cover}
            alt={alt}
            loading="lazy"
            className={`media-stack-cover ${imageClassName}`}
          />
        )}
        <span className="media-stack-shade" aria-hidden="true" />
        {badge && <div className="media-stack-badge">{badge}</div>}
        {children && <div className="media-stack-visual-slot">{children}</div>}
      </div>

      {(eyebrow || title || description || meta || footer) && (
        <div className="media-stack-body">
          {eyebrow && <div className="media-stack-eyebrow">{eyebrow}</div>}
          {title && <h2 className="media-stack-title">{title}</h2>}
          {description && <p className="media-stack-description">{description}</p>}
          {meta && <div className="media-stack-meta">{meta}</div>}
          {footer && <div className="media-stack-footer">{footer}</div>}
        </div>
      )}
    </div>
  );

  if (!href) return card;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="media-stack-link">
        {card}
      </a>
    );
  }
  return (
    <Link href={href} className="media-stack-link">
      {card}
    </Link>
  );
}
