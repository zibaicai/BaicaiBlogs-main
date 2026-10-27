"use client";

import { useEffect } from "react";
import { ExternalLink, X, ZoomIn } from "lucide-react";

interface ArticleImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export default function ArticleImageLightbox({ src, alt, onClose }: ArticleImageLightboxProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col bg-slate-950/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="查看文章图片"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white/80">
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <ZoomIn size={15} /> 点击图片可关闭 · 查看原图
        </div>
        <div className="flex items-center gap-2">
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-[10px] font-black text-white hover:bg-white/20"
          >
            <ExternalLink size={13} /> 查看原图
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭图片预览"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X size={17} />
          </button>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-auto p-3 md:p-6">
        <img
          src={src}
          alt={alt || "文章图片"}
          onClick={(event) => event.stopPropagation()}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    </div>
  );
}
