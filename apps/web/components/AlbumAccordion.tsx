"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Images, Lock } from "lucide-react";
import type { Album } from "../lib/api";
import { DEFAULT_MISC } from "../lib/site-config";

export default function AlbumAccordion({ albums }: { albums: Album[] }) {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const visible = albums.slice(0, 5);

  if (visible.length === 0) {
    return (
      <div className="album-accordion album-accordion-empty">
        <div className="album-empty-copy">
          <Images size={20} />
          <strong>相册还在等待第一束光</strong>
          <span>整理好照片后，它们会在这里展开。</span>
        </div>
      </div>
    );
  }

  return (
    <div className="album-accordion" role="group" aria-label="相册手风琴">
      {visible.map((album, index) => {
        const isActive = index === active;
        const cover = album.cover || DEFAULT_MISC.photoWallImage;
        const count = album.photos?.length || 0;
        return (
          <button
            key={album.albumId || index}
            type="button"
            aria-label={`${isActive ? "打开" : "展开"}相册 ${album.title}`}
            aria-expanded={isActive}
            onClick={() => {
              if (isActive) {
                router.push(`/photowall/${encodeURIComponent(album.albumId)}`);
              } else {
                setActive(index);
              }
            }}
            className={`album-panel ${isActive ? "is-active" : ""}`}
          >
            <img src={cover} alt={album.title} loading="lazy" decoding="async" />
            <span className="album-panel-shade" />
            <span className="album-panel-index">{String(index + 1).padStart(2, "0")}</span>

            {isActive ? (
              <span className="album-panel-content">
                <span className="album-panel-kicker">
                  <Images size={11} /> PHOTO WALL
                </span>
                <strong>{album.title}</strong>
                <span className="album-panel-desc">{album.description || "记录一些光影与停留。"}</span>
                <span className="album-panel-meta">
                  {count} 张照片 <ArrowUpRight size={12} />
                </span>
              </span>
            ) : (
              <span className="album-panel-collapsed">
                <span>{album.title}</span>
                <ArrowUpRight size={12} />
              </span>
            )}
            {(!album.cover || album.cover.includes("blur")) && <Lock size={11} className="album-panel-lock" />}
          </button>
        );
      })}
    </div>
  );
}
