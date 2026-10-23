"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import { DEFAULT_MISC } from "../../lib/site-config";

export interface GalleryAlbum {
  albumId: string;
  title: string;
  description: string;
  visibility: string;
  photoCount: number;
  coverThumbUrl: string | null;
  coverStandardUrl: string | null;
  hasPassword: boolean;
}

async function fetchAlbums(): Promise<GalleryAlbum[]> {
  const res = await fetch("/api/public/gallery/albums", { credentials: "include" });
  const json = await res.json();
  if (!json?.success) throw new Error(json?.message || "加载失败");
  return json.data || [];
}

export default function PhotoWallPage() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchAlbums()
      .then(setAlbums)
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-full max-w-6xl mx-auto mt-28 px-4 sm:px-10 relative z-10">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
              照片墙
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {albums.length} 个公开相册 · 封面取权重最高的一张
            </p>
          </header>

          {loading && (
            <div className="flex justify-center py-24">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {error && <div className="text-center py-20 text-red-400 font-bold">{error}</div>}

          {!loading && !error && albums.length === 0 && (
            <div className="text-center py-24 text-slate-500 dark:text-slate-400 font-bold">
              还没有公开相册。
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {albums.map((album) => (
              <Link
                key={album.albumId}
                href={`/photowall/${encodeURIComponent(album.albumId)}`}
                className="group relative rounded-[40px] overflow-hidden border border-white/40 dark:border-white/10 shadow-xl bg-slate-900 min-h-[280px]"
              >
                {album.coverThumbUrl ? (
                  <img
                    src={album.coverThumbUrl}
                    alt={album.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-60"
                    style={{ backgroundImage: `url(${DEFAULT_MISC.photoWallImage})` }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-black/40 backdrop-blur px-2 py-1 rounded-md">
                      {album.photoCount} Photos
                    </span>
                    {album.visibility === "PASSWORD" && (
                      <span className="text-[10px] font-black text-amber-300 bg-black/40 backdrop-blur px-2 py-1 rounded-md">
                        密码
                      </span>
                    )}
                  </div>
                  <h2 className="text-3xl font-black text-white drop-shadow mb-1">{album.title}</h2>
                  <p className="text-sm text-white/70 line-clamp-2">{album.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
