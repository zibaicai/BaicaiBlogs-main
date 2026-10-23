"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import { DEFAULT_MISC } from "../../lib/site-config";
import DirectoryHeader from "../../components/DirectoryHeader";
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

type Tab = "all" | "public" | "password" | "private";

const TAB_LABELS: Record<Tab, string> = {
  all: "全部",
  public: "公开",
  password: "密码",
  private: "私密",
};

export default function PhotoWallPage() {
  const { user } = useAuth();
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAlbums = useCallback(async (nextTab: Tab) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/public/gallery/albums?visibility=${nextTab}`, {
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
    void fetchAlbums(tab);
  }, [fetchAlbums, tab, user?.id]);

  const tabs: Tab[] = user ? ["all", "public", "password", "private"] : ["all", "public", "password"];

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell">
          <DirectoryHeader
            eyebrow="BAICAI / GALLERY"
            title="照片墙"
            subtitle="密码相册以模糊封面展示，私密相册只对自己可见"
            count={`${albums.length} 个可见相册`}
          />
          <div className="directory-tabs mb-8 justify-center">
            {tabs.map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`directory-tab ${tab === key ? "directory-tab-active" : ""}`}
              >
                {TAB_LABELS[key]}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex justify-center py-24">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {error && <div className="text-center py-20 text-red-400 font-bold">{error}</div>}

          {!loading && !error && albums.length === 0 && (
            <div className="text-center py-24 text-slate-500 dark:text-slate-400 font-bold">
              暂无可见相册。
            </div>
          )}

          <div className="directory-grid">
            {albums.map((album) => {
              const cover = album.locked ? album.coverBlurUrl : album.coverThumbUrl;
              return (
                <Link
                  key={album.albumId}
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
              );
            })}
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
