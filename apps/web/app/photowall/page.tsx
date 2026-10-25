"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import DirectoryExplorer from "../../components/DirectoryExplorer";
import { DEFAULT_MISC } from "../../lib/site-config";
import { useAuth } from "../../lib/auth";

export interface GalleryAlbum {
  albumId: string;
  title: string;
  description: string;
  visibility: string;
  photoCount: number | null;
  coverThumbUrl: string | null;
  coverStandardUrl: string | null;
  coverBlurUrl: string | null;
  hasPassword: boolean;
  locked?: boolean;
  isOwner?: boolean;
  hidePhotoCount?: boolean;
  ownerLabel?: string;
}

export default function PhotoWallPage() {
  const { user } = useAuth();
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAlbums = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/public/gallery/albums?visibility=all", {
        credentials: "include",
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || "加载失败");
      setAlbums(json.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAlbums();
  }, [fetchAlbums, user?.id]);

  const counts = {
    all: albums.length,
    public: albums.filter((a) => a.visibility === "PUBLIC").length,
    password: albums.filter((a) => a.visibility === "PASSWORD").length,
    private: albums.filter((a) => a.visibility === "PRIVATE").length,
  };

  const filters = [
    { value: "all", label: "全部相册", count: counts.all },
    { value: "public", label: "公开", count: counts.public },
    { value: "password", label: "密码", count: counts.password },
    ...(user ? [{ value: "private", label: "私密", count: counts.private }] : []),
  ];

  const items = albums.map((album) => {
    const cover = album.locked ? album.coverBlurUrl : album.coverThumbUrl;
    return {
      key: album.albumId,
      node: (
        <Link
          href={`/photowall/${encodeURIComponent(album.albumId)}`}
          className="directory-card group min-h-[320px] bg-slate-900 p-0"
        >
          {cover ? (
            <img
              src={cover}
              alt={album.title}
              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                album.locked ? "blur-[3px] scale-105" : ""
              }`}
            />
          ) : (
            <div
              className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-60"
              style={{ backgroundImage: `url(${DEFAULT_MISC.photoWallImage})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-black/40 backdrop-blur px-2 py-1 rounded-md">
                {album.photoCount == null ? "照片数已隐藏" : `${album.photoCount} Photos`}
              </span>
              {album.visibility === "PASSWORD" && (
                <span className="text-[10px] font-black text-amber-300 bg-black/40 backdrop-blur px-2 py-1 rounded-md flex items-center gap-1">
                  <Lock size={10} /> {album.locked ? "密码相册" : "我的密码相册"}
                </span>
              )}
              {album.visibility === "PRIVATE" && (
                <span className="text-[10px] font-black text-sky-300 bg-black/40 backdrop-blur px-2 py-1 rounded-md flex items-center gap-1">
                  <ShieldCheck size={10} /> {album.isOwner ? "我的私密" : "私密"}
                </span>
              )}
              {album.visibility === "PUBLIC" && (
                <span className="text-[10px] font-black text-emerald-300 bg-black/40 backdrop-blur px-2 py-1 rounded-md">
                  公开
                </span>
              )}
            </div>
            <h2 className="text-3xl font-black text-white drop-shadow mb-1">{album.title}</h2>
            <p className="text-sm text-white/70 line-clamp-2">{album.description}</p>
            {album.ownerLabel && (
              <p className="text-[10px] text-white/50 mt-1">{album.ownerLabel}</p>
            )}
          </div>
        </Link>
      ),
      searchText: [album.title, album.description, album.ownerLabel].filter(Boolean).join(" "),
      filterValues: [album.visibility.toLowerCase()],
    };
  });

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell">
          {loading && (
            <div className="flex justify-center py-24">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {error && <div className="text-center py-20 text-red-400 font-bold">{error}</div>}
          {!loading && !error && (
            <DirectoryExplorer
              eyebrow="BAICAI / GALLERY"
              title="照片墙"
              subtitle="把光与影收进云层，私密的那一页只留给你。"
              count={`${albums.length} 个可见相册`}
              items={items}
              filters={filters}
              searchPlaceholder="搜索相册标题或简介..."
              empty="暂无可见相册。"
            />
          )}
        </main>
      </PageTransition>
    </div>
  );
}
