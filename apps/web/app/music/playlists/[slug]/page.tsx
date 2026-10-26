"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Flame, Heart, Music2, ThumbsDown } from "lucide-react";
import Navbar from "../../../../components/Navbar";
import PageTransition from "../../../../components/PageTransition";
import { musicApi, type MusicPlaylist } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth";

export default function MusicPlaylistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { user } = useAuth();
  const [slug, setSlug] = useState("");
  const [playlist, setPlaylist] = useState<MusicPlaylist | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void params.then((value) => {
      let decoded = value.slug;
      try {
        decoded = decodeURIComponent(value.slug);
      } catch {
        // keep raw slug
      }
      setSlug(decoded);
    });
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    musicApi.publicPlaylist(slug)
      .then(setPlaylist)
      .catch(() => setPlaylist(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const act = async (kind: "LIKE" | "DISLIKE" | "FAVORITE") => {
    if (!playlist) return;
    if (!user) {
      window.location.href = "/login";
      return;
    }
    try {
      const updated = kind === "FAVORITE"
        ? await musicApi.favorite(playlist.id)
        : await musicApi.react(playlist.id, kind);
      setPlaylist(updated);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "操作失败");
    }
  };

  const savePersonal = async () => {
    if (!playlist) return;
    if (!user) {
      window.location.href = "/login";
      return;
    }
    try {
      await musicApi.createPersonal({
        title: `${playlist.title} · 私人`,
        cover: playlist.cover,
        description: playlist.description,
        trackIds: (playlist.tracks || []).map((track) => track.id),
      });
      setMessage("已保存到我的私人歌单");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    }
  };

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell py-24">
          <Link href="/music" className="mb-8 inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-indigo-400">
            <ArrowLeft size={14} /> 返回音乐档案
          </Link>

          {loading ? (
            <div className="py-24 text-center text-sm text-slate-400">加载中…</div>
          ) : !playlist ? (
            <div className="py-24 text-center text-sm text-slate-400">歌单不存在或未公开。</div>
          ) : (
            <>
              <header className="grid gap-8 rounded-[2rem] border border-white/20 bg-white/35 p-6 backdrop-blur-xl dark:bg-slate-800/35 md:grid-cols-[240px_1fr] md:p-8">
                <div className="aspect-square overflow-hidden rounded-3xl bg-slate-900/30">
                  {playlist.cover ? (
                    <img src={playlist.cover} alt={playlist.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-indigo-300"><Music2 size={40} /></div>
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <span className="font-mono text-[9px] font-black tracking-[0.2em] text-indigo-400">CURATED PLAYLIST</span>
                  <h1 className="mt-2 text-4xl font-black text-slate-900 dark:text-white">{playlist.title}</h1>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {playlist.description || "暂无简介"}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button onClick={() => void act("LIKE")} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black ${playlist.myReaction === "LIKE" ? "bg-indigo-500 text-white" : "bg-white/15 text-slate-600 dark:text-slate-300"}`}>
                      <Heart size={14} /> {playlist.likeCount}
                    </button>
                    <button onClick={() => void act("DISLIKE")} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black ${playlist.myReaction === "DISLIKE" ? "bg-rose-500 text-white" : "bg-white/15 text-slate-600 dark:text-slate-300"}`}>
                      <ThumbsDown size={14} /> {playlist.dislikeCount}
                    </button>
                    <button onClick={() => void act("FAVORITE")} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black ${playlist.favorited ? "bg-amber-400 text-slate-900" : "bg-white/15 text-slate-600 dark:text-slate-300"}`}>
                      ★ {playlist.favorited ? "已收藏" : "收藏"}
                    </button>
                    <button onClick={() => void savePersonal()} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-xs font-black text-slate-600 dark:text-slate-300">
                      保存为私人歌单
                    </button>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <Flame size={12} /> 热度 {playlist.heatScore}
                    </span>
                  </div>
                  {message && <p className="mt-3 text-xs font-bold text-rose-400">{message}</p>}
                </div>
              </header>

              <section className="mt-10">
                <h2 className="mb-4 text-xl font-black text-slate-900 dark:text-white">曲目 · {playlist.tracks?.length || 0}</h2>
                <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/35 backdrop-blur-xl dark:bg-slate-800/35">
                  {(playlist.tracks || []).map((track, index) => (
                    <Link key={track.id} href={`/music/tracks/${track.id}`} className="flex items-center gap-4 border-b border-white/10 p-4 last:border-0 hover:bg-white/20">
                      <span className="w-6 text-center font-mono text-[10px] text-slate-400">{index + 1}</span>
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-900/30">
                        {track.cover ? <img src={track.cover} alt="" className="h-full w-full object-cover" /> : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{track.title}</div>
                        <div className="truncate text-[10px] text-slate-400">{track.artist || "未知歌手"}</div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">查看评论 →</span>
                    </Link>
                  ))}
                  {(playlist.tracks || []).length === 0 && (
                    <div className="p-10 text-center text-sm text-slate-400">这个歌单还没有曲目。</div>
                  )}
                </div>
              </section>
            </>
          )}
        </main>
      </PageTransition>
    </div>
  );
}
