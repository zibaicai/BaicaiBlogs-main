"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Disc3, Flame, Heart, ListMusic, Loader2, Music2, Pause, Play, SkipBack, SkipForward, ThumbsDown, UserRound } from "lucide-react";
import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import CommentSection from "../../components/comments/CommentSection";
import { musicApi, type MusicPlaylist, type MusicTrack } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useMusic } from "../../components/MusicProvider";

type Layout = "focus" | "studio";
type LeftTab = "recommend" | "mine" | "queue";
type FocusTab = "lyrics" | "comments";

const formatTime = (value: number) => {
  if (!Number.isFinite(value)) return "00:00";
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
};

export default function MusicPage() {
  const { user } = useAuth();
  const {
    playlist, currentSong, currentIndex, isPlaying, progress, currentTime, duration,
    currentLyric, lyrics, isLoading, togglePlay, nextSong, prevSong, handleSeek,
    playSong, playCollection,
  } = useMusic();

  const [recommendations, setRecommendations] = useState<MusicPlaylist[]>([]);
  const [mine, setMine] = useState<MusicPlaylist[]>([]);
  const [selected, setSelected] = useState<MusicPlaylist | null>(null);
  const [loading, setLoading] = useState(true);
  const [leftTab, setLeftTab] = useState<LeftTab>("recommend");
  const [focusTab, setFocusTab] = useState<FocusTab>("lyrics");
  const [layout, setLayout] = useState<Layout>("focus");
  const [canStudio, setCanStudio] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [applyForm, setApplyForm] = useState({ externalPlaylistId: "", title: "", note: "" });

  useEffect(() => {
    let active = true;
    Promise.all([musicApi.publicPlaylists(), user ? musicApi.myPlaylists() : Promise.resolve([])])
      .then(([publicItems, personal]) => {
        if (!active) return;
        setRecommendations(publicItems || []);
        setMine(personal || []);
        if ((publicItems || []).length > 0 && !selected) {
          void selectPlaylist(publicItems[0]);
        }
      })
      .catch(() => {
        if (active) {
          setRecommendations([]);
          setMine([]);
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1440px)");
    const update = () => {
      setCanStudio(query.matches);
      if (!query.matches) setLayout("focus");
    };
    update();
    query.addEventListener("change", update);
    try {
      const saved = localStorage.getItem("bc_music_layout");
      if (saved === "studio" && query.matches) setLayout("studio");
    } catch {
      // ignore storage failures
    }
    return () => query.removeEventListener("change", update);
  }, []);

  const selectPlaylist = async (item: MusicPlaylist) => {
    try {
      const detail = item.tracks ? item : await musicApi.publicPlaylist(item.slug);
      setSelected(detail);
      const songs = (detail.tracks || []).map((track) => ({
        id: `track-${track.id}`,
        trackId: track.id,
        title: track.title,
        artist: track.artist || "未知歌手",
        cover: track.cover || detail.cover || "/bg-2.webp",
        src: track.externalUrl || "",
        externalUrl: track.externalUrl,
        lyrics: [],
      }));
      if (songs.length) playCollection(songs, 0);
    } catch {
      setApplyMessage("歌单加载失败");
    }
  };

  const chooseLayout = (next: Layout) => {
    if (next === "studio" && !canStudio) return;
    setLayout(next);
    try {
      localStorage.setItem("bc_music_layout", next);
    } catch {
      // ignore storage failures
    }
  };

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
      setApplyMessage("申请已提交，等待审核");
      setApplyForm({ externalPlaylistId: "", title: "", note: "" });
    } catch (error) {
      setApplyMessage(error instanceof Error ? error.message : "提交失败");
    }
  };

  const currentTrack: MusicTrack | undefined = useMemo(() => {
    if (!currentSong?.trackId) return undefined;
    return selected?.tracks?.find((track) => track.id === currentSong.trackId);
  }, [currentSong, selected]);

  const commentsTargetId = currentSong?.trackId || currentTrack?.id;
  const externalHref = currentSong?.externalUrl || currentTrack?.externalUrl;

  const commentsPanel = commentsTargetId ? (
    <CommentSection
      targetType="TRACK"
      targetId={commentsTargetId}
      title="歌曲评论"
      emptyTitle="还没有评论"
      emptyDescription="成为第一个讨论这首歌的人"
      emptyActionLabel="写评论"
      externalHref={externalHref}
      externalLabel="去网易云查看热评"
    />
  ) : (
    <div className="music-pane-empty">选择一首推荐歌曲后查看评论。</div>
  );

  const lyricsPanel = (
    <div className="music-lyrics">
      {lyrics.length > 0 ? (
        lyrics.map((line, index) => (
          <p key={`${line.time}-${index}`} className={line.text === currentLyric ? "is-active" : ""}>{line.text}</p>
        ))
      ) : (
        <div className="music-pane-empty">
          <Music2 size={24} />
          <span>{currentSong ? "暂无歌词" : "选择一首歌开始"}</span>
          {externalHref && <a href={externalHref} target="_blank" rel="noopener noreferrer">去平台查看</a>}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen relative pb-28">
      <Navbar />
      <PageTransition>
        <main className="directory-shell py-20">
          <header className="music-topbar">
            <div>
              <div className="music-kicker">BAICAI / MUSIC</div>
              <h1 className="music-title">音乐</h1>
            </div>
            <div className="music-top-actions">
              <div className="music-layout-switch" role="group" aria-label="音乐页布局">
                <button className={layout === "focus" ? "is-active" : ""} onClick={() => chooseLayout("focus")}>Focus</button>
                <button className={layout === "studio" ? "is-active" : ""} onClick={() => chooseLayout("studio")} disabled={!canStudio}>Studio</button>
              </div>
              <button className="music-apply-button" onClick={() => setApplyOpen((value) => !value)}>推荐歌单</button>
            </div>
          </header>

          {applyOpen && (
            <section className="music-apply-panel">
              <input value={applyForm.externalPlaylistId} onChange={(e) => setApplyForm({ ...applyForm, externalPlaylistId: e.target.value })} placeholder="网易云公开歌单 ID" />
              <input value={applyForm.title} onChange={(e) => setApplyForm({ ...applyForm, title: e.target.value })} placeholder="歌单标题（可选）" />
              <input value={applyForm.note} onChange={(e) => setApplyForm({ ...applyForm, note: e.target.value })} placeholder="推荐理由" />
              <button onClick={() => void submitApplication()}>提交申请</button>
              {applyMessage && <span>{applyMessage}</span>}
            </section>
          )}

          <div className="music-workspace" data-layout={layout}>
            <aside className="music-sidebar">
              <div className="music-sidebar-tabs">
                <button className={leftTab === "recommend" ? "is-active" : ""} onClick={() => setLeftTab("recommend")}><Flame size={13} />推荐</button>
                <button className={leftTab === "mine" ? "is-active" : ""} onClick={() => setLeftTab("mine")}><UserRound size={13} />我的</button>
                <button className={leftTab === "queue" ? "is-active" : ""} onClick={() => setLeftTab("queue")}><ListMusic size={13} />队列</button>
              </div>
              <div className="music-sidebar-list">
                {leftTab === "recommend" && (
                  loading ? <div className="music-side-empty">加载中…</div> :
                  recommendations.length === 0 ? <div className="music-side-empty">暂无公共推荐歌单</div> :
                  recommendations.map((item) => (
                    <button key={item.id} className={`music-playlist-row ${selected?.id === item.id ? "is-active" : ""}`} onClick={() => void selectPlaylist(item)}>
                      <span className="music-cover xs">{item.cover ? <img src={item.cover} alt="" /> : <Music2 size={14} />}</span>
                      <span className="music-row-copy"><strong>{item.title}</strong><small>{item.heatScore} 热度 · {item.trackCount} 首</small></span>
                    </button>
                  ))
                )}
                {leftTab === "mine" && (
                  !user ? <div className="music-side-empty">登录后查看私人歌单</div> :
                  mine.length === 0 ? <div className="music-side-empty">暂无私人歌单</div> :
                  mine.map((item) => (
                    <button key={item.id} className="music-playlist-row" onClick={() => setSelected(item)}>
                      <span className="music-cover xs">{item.cover ? <img src={item.cover} alt="" /> : <Music2 size={14} />}</span>
                      <span className="music-row-copy"><strong>{item.title}</strong><small>{item.trackCount} 首 · 私人</small></span>
                    </button>
                  ))
                )}
                {leftTab === "queue" && (
                  playlist.length === 0 ? <div className="music-side-empty">队列为空</div> :
                  playlist.map((song, index) => (
                    <button key={`${song.id}-${index}`} className={`music-queue-row ${index === currentIndex ? "is-active" : ""}`} onClick={() => playSong(index)}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <span className="music-row-copy"><strong>{song.title}</strong><small>{song.artist}</small></span>
                    </button>
                  ))
                )}
              </div>
            </aside>

            <section className="music-center">
              <div className="music-now">
                <div className="music-cover large">
                  {currentSong?.cover ? <img src={currentSong.cover} alt={currentSong.title || ""} /> : <Music2 size={36} />}
                </div>
                <div className="music-now-copy">
                  <span className="music-kicker">{selected?.title || "NOW PLAYING"}</span>
                  <h2>{currentSong?.title || "选择一首歌"}</h2>
                  <p>{currentSong?.artist || "从左侧推荐歌单开始"}</p>
                  {selected?.description && <small>{selected.description}</small>}
                </div>
              </div>

              {layout === "focus" && (
                <div className="music-pane-tabs">
                  <button className={focusTab === "lyrics" ? "is-active" : ""} onClick={() => setFocusTab("lyrics")}>歌词</button>
                  <button className={focusTab === "comments" ? "is-active" : ""} onClick={() => setFocusTab("comments")}>评论{commentsTargetId ? "" : ""}</button>
                </div>
              )}

              {layout === "focus" ? (
                <div className="music-pane-body">
                  {focusTab === "lyrics" ? lyricsPanel : commentsPanel}
                </div>
              ) : (
                <div className="music-pane-body">{lyricsPanel}</div>
              )}
            </section>

            {layout === "studio" && (
              <aside className="music-comments-side">{commentsPanel}</aside>
            )}
          </div>
        </main>
      </PageTransition>

      <div className="music-player-bar">
        <div className="music-player-inner">
          <div className="music-player-meta">
            <span className="music-cover xs">{currentSong?.cover ? <img src={currentSong.cover} alt="" /> : <Disc3 size={14} />}</span>
            <div><strong>{currentSong?.title || "暂无播放"}</strong><small>{currentSong?.artist || "等待选择歌曲"}</small></div>
          </div>
          <div className="music-player-controls">
            <button onClick={prevSong} aria-label="上一首"><SkipBack size={16} /></button>
            <button className="music-play" onClick={togglePlay} aria-label={isPlaying ? "暂停" : "播放"}>{isPlaying ? <Pause size={16} /> : <Play size={16} />}</button>
            <button onClick={nextSong} aria-label="下一首"><SkipForward size={16} /></button>
          </div>
          <div className="music-player-progress">
            <span>{formatTime(currentTime)}</span>
            <input type="range" min="0" max="100" value={progress} onChange={handleSeek} />
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
