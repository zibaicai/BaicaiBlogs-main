"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, Image as ImageIcon, Loader2, Lock, X } from "lucide-react";
import Navbar from "../../../components/Navbar";
import PageTransition from "../../../components/PageTransition";
import BackButton from "../../../components/BackButton";
import { useAuth } from "../../../lib/auth";

interface Photo {
  id: number;
  thumbUrl: string;
  standardUrl: string;
  originalUrl: string | null;
  caption: string;
  width?: number;
  height?: number;
  bytes?: number;
  status: string;
}

interface Album {
  albumId: string;
  title: string;
  description: string;
  visibility: string;
  photoCount: number | null;
  photos: Photo[];
  locked?: boolean;
  isOwner?: boolean;
  coverBlurUrl?: string | null;
  hidePhotoCount?: boolean;
  ownerLabel?: string | null;
}

export default function AlbumPage() {
  const params = useParams<{ albumId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const albumId = Array.isArray(params.albumId) ? params.albumId[0] : params.albumId;

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState("");

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [originalSrc, setOriginalSrc] = useState<string | null>(null);
  const [originalBusy, setOriginalBusy] = useState(false);
  const [originalError, setOriginalError] = useState("");

  const load = useCallback(async () => {
    if (!albumId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/public/gallery/albums/${encodeURIComponent(albumId)}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || "加载失败");
      setAlbum(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [albumId]);

  useEffect(() => {
    void load();
  }, [load]);

  const active = useMemo(
    () => (album && activeIndex != null ? album.photos[activeIndex] : null),
    [album, activeIndex]
  );

  const unlock = async () => {
    if (!albumId) return;
    setUnlocking(true);
    setError("");
    try {
      const res = await fetch(`/api/public/gallery/albums/${encodeURIComponent(albumId)}/unlock`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || "密码错误");
      setAlbum(json.data);
      setPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "密码错误");
    } finally {
      setUnlocking(false);
    }
  };

  const loadOriginal = async (photo: Photo, download = false) => {
    if (!photo.originalUrl) {
      setOriginalError("当前授权仅支持标清图，不能查看或下载原图");
      return;
    }
    setOriginalBusy(true);
    setOriginalError("");
    try {
      const res = await fetch(`${photo.originalUrl}${download ? "?download=1" : ""}`, {
        credentials: "include",
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 429) {
        setOriginalError("今日原图额度已用完（10 张）或本月流量已用完");
        return;
      }
      if (!res.ok) {
        setOriginalError("原图加载失败");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (download) {
        const a = document.createElement("a");
        a.href = url;
        a.download = `photo-${photo.id}.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      } else {
        if (originalSrc) URL.revokeObjectURL(originalSrc);
        setOriginalSrc(url);
      }
    } catch {
      setOriginalError("原图加载失败");
    } finally {
      setOriginalBusy(false);
    }
  };

  const closeLightbox = () => {
    setActiveIndex(null);
    setOriginalError("");
    if (originalSrc) URL.revokeObjectURL(originalSrc);
    setOriginalSrc(null);
  };

  const reportActive = async () => {
    if (!active) return;
    if (!user) {
      router.push("/login");
      return;
    }
    const reason = window.prompt("举报理由：色情低俗 / 违法违规 / 侵权盗版 / 广告 / 血腥暴力 / 其他");
    if (!reason) return;
    try {
      const res = await fetch(`/api/public/photos/${active.id}/report`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, detail: "" }),
      });
      const json = await res.json();
      window.alert(json?.message || (json?.success ? "举报已提交" : "举报失败"));
    } catch {
      window.alert("举报失败");
    }
  };

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-full max-w-6xl mx-auto mt-28 px-4 sm:px-10 relative z-10">
          <BackButton fallbackHref="/photowall" label="返回照片墙" />
          {loading && (
            <div className="flex justify-center py-24">
              <Loader2 className="animate-spin text-indigo-400" size={28} />
            </div>
          )}

          {!loading && error && (
            <div className="max-w-md mx-auto rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl p-8 text-center">
              <Lock className="mx-auto text-amber-400 mb-4" size={28} />
              <div className="text-sm font-bold text-red-400 mb-4">{error}</div>
              {error.includes("密码") && (
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入相册密码"
                    className="flex-1 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-slate-700 px-4 py-2.5 text-sm outline-none"
                  />
                  <button
                    onClick={unlock}
                    disabled={unlocking}
                    className="px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-black disabled:opacity-50"
                  >
                    {unlocking ? "验证中" : "解锁"}
                  </button>
                </div>
              )}
              {!user && (
                <button
                  onClick={() => router.push("/login")}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-black"
                >
                  去登录
                </button>
              )}
            </div>
          )}

          {!loading && album?.locked && (
            <div className="max-w-md mx-auto rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl p-8 text-center">
              {album.coverBlurUrl && (
                <img src={album.coverBlurUrl} alt="" className="w-full h-32 object-cover rounded-2xl blur-[2px] mb-5" />
              )}
              <Lock className="mx-auto text-amber-400 mb-3" size={28} />
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{album.title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                该相册受密码保护，输入密码后查看。
              </p>
              {!user ? (
                <button
                  onClick={() => router.push("/login")}
                  className="w-full py-3 rounded-xl bg-indigo-500 text-white text-xs font-black"
                >
                  登录后输入密码
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void unlock()}
                    placeholder="输入相册密码"
                    className="flex-1 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-slate-700 px-4 py-2.5 text-sm outline-none"
                  />
                  <button
                    onClick={unlock}
                    disabled={unlocking}
                    className="px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-black disabled:opacity-50"
                  >
                    {unlocking ? "验证中" : "解锁"}
                  </button>
                </div>
              )}
              {unlockError && <div className="text-xs text-red-400 mt-3 font-bold">{unlockError}</div>}
            </div>
          )}

          {!loading && album && !album.locked && (
            <>
              <header className="mb-10 text-center">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
                  {album.title}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {album.description} · {album.photos.length} 张
                </p>
              </header>

              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {album.photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => {
                      setActiveIndex(index);
                      setOriginalSrc(null);
                    }}
                    className="group relative aspect-square rounded-3xl overflow-hidden bg-slate-900 border border-white/20 dark:border-white/10 shadow-lg"
                  >
                    <img
                      src={photo.thumbUrl}
                      alt=""
                      aria-hidden
                      className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-50"
                    />
                    <img
                      src={photo.thumbUrl}
                      alt={photo.caption || ""}
                      loading="lazy"
                      className="relative w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                  </button>
                ))}
              </div>

              {album.photos.length === 0 && (
                <div className="text-center py-24 text-slate-500 dark:text-slate-400 font-bold flex flex-col items-center gap-3">
                  <ImageIcon size={28} /> 这个相册还没有图片
                </div>
              )}
            </>
          )}
        </main>
      </PageTransition>

      {active && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={closeLightbox}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
          >
            <X size={20} />
          </button>

          <div className="max-w-6xl w-full flex flex-col items-center gap-4">
            <img
              src={originalSrc || active.standardUrl}
              alt={active.caption || ""}
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />
            {originalError && <div className="text-xs text-amber-300 font-bold">{originalError}</div>}
            <div className="flex items-center gap-3">
              {active.originalUrl && (
                <button
                  onClick={() => void loadOriginal(active, false)}
                  disabled={originalBusy}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black disabled:opacity-50"
                >
                  {originalBusy ? "加载中..." : "查看原图"}
                </button>
              )}
              {active.originalUrl && (
                <button
                  onClick={() => void loadOriginal(active, true)}
                  disabled={originalBusy}
                  className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black disabled:opacity-50 flex items-center gap-1"
                >
                  <Download size={14} /> 下载原图
                </button>
              )}
              <button
                onClick={reportActive}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-red-500/80 text-white text-xs font-black"
              >
                举报
              </button>
              {!user && <span className="text-xs text-white/60">登录后可查看原图</span>}
            </div>
            <div className="text-[10px] text-white/40">
              当前为 800px 标清图；原图查看/下载每天限 10 张不同图片
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
