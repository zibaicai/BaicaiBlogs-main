"use client";

import { Lock, ShieldCheck } from "lucide-react";
import MediaStackCard, { type MediaStackVariant } from "../media/MediaStackCard";
import { DEFAULT_MISC } from "../../lib/site-config";

export type AlbumCardVariant = MediaStackVariant;

export interface AlbumCardData {
  albumId: string;
  title: string;
  description?: string | null;
  visibility?: string | null;
  photoCount?: number | null;
  coverThumbUrl?: string | null;
  coverStandardUrl?: string | null;
  coverBlurUrl?: string | null;
  hasPassword?: boolean;
  locked?: boolean;
  isOwner?: boolean;
  hidePhotoCount?: boolean;
  ownerLabel?: string | null;
  date?: string;
}

export default function AlbumCard({
  album,
  variant = "stack",
  index = 0,
}: {
  album: AlbumCardData;
  variant?: AlbumCardVariant;
  index?: number;
}) {
  const cover =
    (album.locked ? album.coverBlurUrl : album.coverThumbUrl) ||
    album.coverStandardUrl ||
    DEFAULT_MISC.photoWallImage;

  const isLocked = Boolean(album.locked || album.hasPassword || album.visibility === "PASSWORD");
  const isPrivate = album.visibility === "PRIVATE";
  const count = album.hidePhotoCount
    ? "照片数已隐藏"
    : album.photoCount == null
      ? "照片"
      : `${album.photoCount} 张照片`;

  return (
    <MediaStackCard
      href={`/photowall/${encodeURIComponent(album.albumId)}`}
      cover={cover}
      images={[cover, album.coverBlurUrl || cover, album.coverStandardUrl || cover, cover]}
      alt={album.title}
      variant={variant}
      imageClassName={album.locked ? "blur-[3px] scale-105" : ""}
      eyebrow={`${String(index + 1).padStart(2, "0")} / VISUAL ARCHIVE`}
      title={album.title}
      description={album.description || undefined}
      badge={
        isLocked ? (
          <span className="album-privacy-badge">
            <Lock size={10} /> {album.hasPassword ? "密码" : "锁定"}
          </span>
        ) : isPrivate ? (
          <span className="album-privacy-badge">
            <ShieldCheck size={10} /> 私密
          </span>
        ) : null
      }
      meta={
        <>
          <span>{count}</span>
          {album.date && (
            <>
              <span className="album-meta-dot" />
              <span>{album.date.slice(0, 10)}</span>
            </>
          )}
          {album.ownerLabel && (
            <>
              <span className="album-meta-dot" />
              <span>{album.ownerLabel}</span>
            </>
          )}
        </>
      }
    />
  );
}
