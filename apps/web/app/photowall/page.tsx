"use client";

import { useCallback, useEffect, useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import DirectoryExplorer from "../../components/DirectoryExplorer";
import ArchiveCard from "../../components/ArchiveCard";
import { DEFAULT_MISC } from "../../lib/site-config";
import { useAuth } from "../../lib/auth";
import { withContentScope } from "../../lib/content-scope";

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
  date?: string;
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
      const res = await fetch(withContentScope("/api/public/gallery/albums?visibility=all"), {
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
        <ArchiveCard
          href={`/photowall/${encodeURIComponent(album.albumId)}`}
          image={cover || DEFAULT_MISC.photoWallImage}
          alt={album.title}
          imageClassName={album.locked ? "blur-[3px] scale-105" : ""}
          eyebrow={album.visibility === "PUBLIC" ? "公开" : album.visibility === "PASSWORD" ? "密码" : "私密"}
          title={album.title}
          description={album.description}
          meta={album.photoCount == null ? "照片数已隐藏" : `${album.photoCount} 张照片`}
          badges={
            <>
              {album.visibility === "PASSWORD" && (
                <span className="archive-badge archive-badge-amber"><Lock size={9} /> {album.locked ? "密码相册" : "我的密码相册"}</span>
              )}
              {album.visibility === "PRIVATE" && (
                <span className="archive-badge archive-badge-sky"><ShieldCheck size={9} /> {album.isOwner ? "我的私密" : "私密"}</span>
              )}
              {album.visibility === "PUBLIC" && <span className="archive-badge archive-badge-emerald">公开</span>}
              {album.ownerLabel && <span className="archive-badge">{album.ownerLabel}</span>}
            </>
          }
        />
      ),
      searchText: [album.title, album.description, album.ownerLabel].filter(Boolean).join(" "),
      filterValues: [album.visibility.toLowerCase()],
      title: album.title,
      date: album.date,
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
              eyebrow="BAICAI / FRAMES"
              title="影像档案"
              subtitle="把光、颜色和路过的地方留下来。"
              count={`${albums.length} 个可见相册`}
              items={items}
              filters={filters}
              compact
              gridVariant="cover"
              views={["grid"]}
              pageSize={12}
              defaultSort="newest"
              searchPlaceholder="搜索相册标题或简介..."
              empty="还没有公开的影像。"
            />
          )}
        </main>
      </PageTransition>
    </div>
  );
}
