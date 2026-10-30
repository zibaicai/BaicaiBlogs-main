"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import DirectoryExplorer from "../../components/DirectoryExplorer";
import AlbumCard, { type AlbumCardVariant } from "../../components/photowall/AlbumCard";
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
  const [albumVariant, setAlbumVariant] = useState<AlbumCardVariant>("stack");

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

  const items = albums.map((album, index) => ({
    key: album.albumId,
    node: <AlbumCard album={album} variant={albumVariant} index={index} />,
    searchText: [album.title, album.description, album.ownerLabel].filter(Boolean).join(" "),
    filterValues: [album.visibility?.toLowerCase() || "public"],
    title: album.title,
    date: album.date,
  }));

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
              gridVariant="album"
              columns={{ base: 1, sm: 2, lg: 3 }}
              gap="lg"
              views={["grid"]}
              toolbarExtra={
                <div className="directory-view-toggle" role="group" aria-label="相册展示模式">
                  <button
                    type="button"
                    onClick={() => setAlbumVariant("stack")}
                    aria-pressed={albumVariant === "stack"}
                    className={`directory-view-toggle-button ${albumVariant === "stack" ? "directory-view-toggle-active" : ""}`}
                  >
                    堆叠
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlbumVariant("collage")}
                    aria-pressed={albumVariant === "collage"}
                    className={`directory-view-toggle-button ${albumVariant === "collage" ? "directory-view-toggle-active" : ""}`}
                  >
                    拼贴
                  </button>
                </div>
              }
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
