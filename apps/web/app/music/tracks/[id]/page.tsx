"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Music2 } from "lucide-react";
import Navbar from "../../../../components/Navbar";
import PageTransition from "../../../../components/PageTransition";
import CommentSection from "../../../../components/comments/CommentSection";
import { musicApi, type MusicTrack } from "../../../../lib/api";

export default function MusicTrackPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<number | null>(null);
  const [track, setTrack] = useState<MusicTrack | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void params.then((value) => {
      const parsed = Number(value.id);
      if (Number.isFinite(parsed)) setId(parsed);
    });
  }, [params]);

  useEffect(() => {
    if (id == null) return;
    setLoading(true);
    musicApi.publicTrack(id)
      .then(setTrack)
      .catch(() => setTrack(null))
      .finally(() => setLoading(false));
  }, [id]);

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
          ) : !track ? (
            <div className="py-24 text-center text-sm text-slate-400">歌曲不存在或未公开。</div>
          ) : (
            <>
              <header className="flex flex-col gap-6 rounded-[2rem] border border-white/20 bg-white/35 p-6 backdrop-blur-xl dark:bg-slate-800/35 md:flex-row md:items-center md:p-8">
                <div className="h-40 w-40 shrink-0 overflow-hidden rounded-3xl bg-slate-900/30">
                  {track.cover ? <img src={track.cover} alt={track.title} className="h-full w-full object-cover" /> : <Music2 className="m-12 text-indigo-300" size={40} />}
                </div>
                <div className="min-w-0">
                  <span className="font-mono text-meta font-black tracking-[0.2em] text-indigo-400">TRACK / {track.platform}</span>
                  <h1 className="detail-title mt-2 text-slate-900 dark:text-white">{track.title}</h1>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{track.artist || "未知歌手"}</p>
                  {track.externalUrl && (
                    <a href={track.externalUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-xs font-black text-white">
                      <ExternalLink size={13} /> 在音乐平台打开
                    </a>
                  )}
                  {track.playable === false && (
                    <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-xs font-bold text-amber-600 dark:text-amber-300">
                      该歌曲当前不可播放{track.unavailableReason === "VIP_ONLY" ? "：已升为 VIP" : "：可能已下架或音源失效"}
                    </div>
                  )}
                </div>
              </header>

              <CommentSection targetType="TRACK" targetId={track.id} title="歌曲评论" readOnly={track.playable === false} />
            </>
          )}
        </main>
      </PageTransition>
    </div>
  );
}
