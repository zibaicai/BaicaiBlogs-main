import type { ImgHTMLAttributes } from "react";

type OptimizedImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  priority?: boolean;
};

/**
 * Native image loading policy for C-side content.
 * Decorative/list images stay lazy; only LCP images should pass priority.
 */
export function OptimizedImage({ src, alt, priority = false, className = "", ...props }: OptimizedImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "low"}
      {...props}
    />
  );
}
