"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Disc3, Flame, Heart, Music2, ThumbsDown, UserRound } from "lucide-react";
import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import CloudPlayer from "../../components/CloudPlayer";
import { musicApi, type MusicPlaylist } from "../../lib/api";
import { useAuth } from "../../lib/auth";

export default function MusicPage() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<MusicPlaylist[]>([]);
  const [mine, setMine] = useState<MusicPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({ externalPlaylistId: "", title: "", note: "" });
  const [applyMessage, setApplyMessage] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      musicApi.publicPlaylists(),
      user ? musicApi.myPlaylists() : Promise.resolve([]),
    ])
      .then(([published, personal]) => {
        if (!active) return;
        setPlaylists(published || []);
        setMine(personal || []);
      })
      .catch(() => {
        if (active) {
          setPlaylists([]);
          setMine([]);
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user]);

  const submitApplication = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (!applyForm.externalPlaylistId.trim()) {
      setApplyMessage("请填写公开歌单 ID");
      return;
    }
    try {
      await musicApi.apply({
        platform: "netease",
        externalPlaylistId: applyForm.externalPlaylistId.trim(),
        title: applyForm.title.trim(),
        note: applyForm.note.trim(),
      });
      setApplyMessage("申请已提交，等待管理员审核");
      setApplyForm({ externalPlaylistId: "", title: "", note: "" });
    } catch (error) {
      setApplyMessage(error instanceof Error ? error.message : "提交失败");
    }
  };

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell py-24">
          <header className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 font-mono text-[10px] font-black tracking-[0.22em] text-indigo-400">
                BAICAI / MUSIC
              </div>
              <h1 className="font-serif text-5xl font-black text-slate-900 dark:text-white">音乐档案</h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                公共推荐歌单与私人音乐收藏。歌曲评论统一收录在本站。
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
              <Disc3 size={14} /> {playlists.length} 个推荐歌单
            </div>
          </header>

          <CloudPlayer />

          <section className="mt-8 rounded-3xl border border-white/20 bg-white/35 p-5 backdrop-blur-xl dark:bg-slate-800/35">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-800 dark:text-white">推荐歌单申请</h2>
                <p className="mt-1 text-[11px] text-slate-400">提交公开歌单 ID，管理员审核通过后进入公共推荐池。</p>
              </div>
              <button onClick={() => setApplyOpen((value) => !value)} className="rounded-full bg-indigo-500 px-4 py-2 text-xs font-black text-white">
                {applyOpen ? "收起" : "申请推荐"}
              </button>
            </div>
            {applyOpen && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input value={applyForm.externalPlaylistId} onChange={(event) => setApplyForm({ ...applyForm, externalPlaylistId: event.target.value })} placeholder="网易云公开歌单 ID" className="rounded-xl border border-white/20 bg-white/30 px-3 py-2 text-xs text-slate-700 outline-none dark:bg-slate-900/30 dark:text-slate-200" />
                <input value={applyForm.title} onChange={(event) => setApplyForm({ ...applyForm, title: event.target.value })} placeholder="歌单标题（可选）" className="rounded-xl border border-white/20 bg-white/30 px-3 py-2 text-xs text-slate-700 outline-none dark:bg-slate-900/30 dark:text-slate-200" />
                <textarea value={applyForm.note} onChange={(event) => setApplyForm({ ...applyForm, note: event.target.value })} placeholder="推荐理由" rows={2} className="rounded-xl border border-white/20 bg-white/30 px-3 py-2 text-xs text-slate-700 outline-none dark:bg-slate-900/30 dark:text-slate-200 md:col-span-2" />
                <div className="flex items-center gap-3 md:col-span-2">
                  <button onClick={() => void submitApplication()} className="rounded-full bg-white/20 px-4 py-2 text-xs font-black text-slate-700 dark:text-slate-200">提交申请</button>
                  {applyMessage && <span className="text-[10px] font-bold text-slate-400">{applyMessage}</span>}
                </div>
              </div>
            )}
          </section>

          <section className="mt-12">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <span className="font-mono text-[9px] font-black tracking-[0.2em] text-indigo-400">CURATED</span>
                <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">推荐歌单</h2>
              </div>
              <span className="text-[10px] font-bold text-slate-400">按热度排序</span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-sm text-slate-400">加载中…</div>
            ) : playlists.length === 0 ? (
              <div className="rounded-3xl border border-white/20 bg-white/40 p-10 text-center text-sm text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
                暂无公共推荐歌单。
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {playlists.map((playlist) => (
                  <Link
                    key={playlist.id}
                    href={`/music/playlists/${encodeURIComponent(playlist.slug)}`}
                    className="group overflow-hidden rounded-3xl border border-white/20 bg-white/45 shadow-lg backdrop-blur-xl transition hover:-translate-y-1 hover:border-indigo-400/40 dark:bg-slate-800/45"
                  >
                    <div className="relative aspect-square overflow-hidden bg-slate-900/30">
                      {playlist.cover ? (
                        <img
                          src={playlist.cover}
                          alt={playlist.title}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-indigo-300"><Music2 size={36} /></div>
                      )}
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[9px] font-black text-white backdrop-blur">
                        <Flame size={10} /> {playlist.heatScore}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-2 text-sm font-black text-slate-900 dark:text-white">{playlist.title}</h3>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                        {playlist.description || "暂无简介"}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-[9px] font-bold text-slate-400">
                        <span className="inline-flex items-center gap-1"><Heart size={10} /> {playlist.likeCount}</span>
                        <span className="inline-flex items-center gap-1"><ThumbsDown size={10} /> {playlist.dislikeCount}</span>
                        <span>{playlist.trackCount} 首</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="mt-14">
            <div className="mb-5">
              <span className="font-mono text-[9px] font-black tracking-[0.2em] text-indigo-400">PERSONAL</span>
              <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">我的导入</h2>
            </div>
            {!user ? (
              <div className="rounded-3xl border border-dashed border-white/25 p-8 text-center text-sm text-slate-400">
                登录后管理私人歌单。
              </div>
            ) : mine.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/25 p-8 text-center text-sm text-slate-400">
                暂无私人歌单。公开歌单导入功能将在稍后开放。
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mine.map((playlist) => (
                  <div key={playlist.id} className="rounded-2xl border border-white/15 bg-white/35 p-4 dark:bg-slate-800/35">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-800/30">
                        {playlist.cover ? <img src={playlist.cover} alt="" className="h-full w-full object-cover" /> : <UserRound className="m-3 text-slate-400" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-black text-slate-800 dark:text-white">{playlist.title}</h3>
                        <p className="mt-1 text-[10px] text-slate-400">{playlist.trackCount} 首 · 私人</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </PageTransition>
    </div>
  );
}
