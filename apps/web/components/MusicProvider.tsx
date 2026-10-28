"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSiteConfigContext } from "../context/SiteConfigProvider";
import { apiClient } from "../lib/api";

export type PlayMode = "loop" | "single" | "random";

type LyricLine = { time: number; text: string };

type Track = {
  id: string;
  trackId?: number;
  title: string;
  artist: string;
  cover: string;
  src: string;
  externalUrl?: string;
  lrcUrl?: string | null;
  lyrics: LyricLine[];
};

type MusicContextValue = {
  playlist: Track[];
  currentIndex: number;
  currentSong: Track | undefined;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  currentLyric: string;
  lyrics: LyricLine[];
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  playMode: PlayMode;
  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  handleSeek: (event: React.ChangeEvent<HTMLInputElement>) => void;
  playSong: (index: number) => void;
  playCollection: (songs: Track[], startIndex?: number) => void;
  loadCollection: (songs: Track[], startIndex?: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  togglePlayMode: () => void;
};

const MusicContext = createContext<MusicContextValue | null>(null);
const NO_LYRICS = "♪ 纯享音乐 ♪";
const EMPTY_IDS: string[] = [];

function parseLyrics(source: string): LyricLine[] {
  if (!source || source.length > 30_000) return [];

  const output: LyricLine[] = [];
  for (const rawLine of source.split(/\r?\n/)) {
    const stamps = [...rawLine.matchAll(/\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g)];
    if (!stamps.length) continue;

    const text = rawLine
      .replace(/\[\d{2,}:\d{2}(?:\.\d{2,3})?\]/g, "")
      .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "")
      .trim();

    if (!text) continue;

    for (const stamp of stamps) {
      const minutes = Number(stamp[1]);
      const seconds = Number(stamp[2]);
      const fraction = stamp[3] ? Number(stamp[3]) : 0;
      const divisor = stamp[3]?.length === 3 ? 1000 : 100;
      output.push({
        time: minutes * 60 + seconds + fraction / divisor,
        text,
      });
    }
  }

  return output.sort((a, b) => a.time - b.time);
}

function normalizeTrack(raw: any): Track {
  return {
    id: String(raw.id || Date.now() + Math.random()),
    trackId: typeof raw.trackId === "number" ? raw.trackId : undefined,
    title: raw.name || "未知歌曲",
    artist: raw.artist || raw.author || "未知歌手",
    cover: raw.cover || raw.pic || "/bg-2.webp",
    src: raw.url,
    externalUrl: raw.externalUrl,
    lrcUrl: raw.lrcUrl || null,
    lyrics: raw.lrc ? parseLyrics(String(raw.lrc)) : [],
  };
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const { misc } = useSiteConfigContext();
  const ids = misc?.cloudMusicIds || EMPTY_IDS;

  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentLyric, setCurrentLyric] = useState("正在接收海面信号…");
  const [isLoading, setIsLoading] = useState(true);
  const [playVersion, setPlayVersion] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>("loop");

  const audioRef = useRef<HTMLAudioElement>(null);
  const manualCollection = useRef(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!ids.length) {
        setIsLoading(false);
        setCurrentLyric("海面信号暂时走远了");
        return;
      }

      try {
        const result = await apiClient.getMusic(ids);
        const tracks = (Array.isArray(result) ? result : [])
          .filter((song: any) => song?.url && !song.error)
          .map(normalizeTrack);

        if (!active || manualCollection.current) return;

        if (tracks.length) {
          setPlaylist(tracks);
        } else {
          setCurrentLyric("海面信号暂时走远了");
        }
      } catch {
        if (active) setCurrentLyric("网络初始化失败");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    setIsLoading(true);
    void load();
    return () => {
      active = false;
    };
  }, [ids]);

  useEffect(() => {
    if (!playlist.length) return;
    const song = playlist[currentIndex];
    if (!song) return;

    let active = true;
    setLyrics([]);
    setCurrentLyric("正在缓冲…");

    if (song.lyrics.length) {
      setLyrics(song.lyrics);
      setCurrentLyric(song.lyrics[0]?.text || NO_LYRICS);
    } else if (song.lrcUrl) {
      void fetch(song.lrcUrl)
        .then((response) => response.text())
        .then((text) => {
          if (!active) return;
          const parsed = parseLyrics(text);
          setLyrics(parsed);
          setCurrentLyric(parsed[0]?.text || NO_LYRICS);
          setPlaylist((current) => {
            const next = [...current];
            if (next[currentIndex]) next[currentIndex] = { ...next[currentIndex], lyrics: parsed };
            return next;
          });
        })
        .catch(() => {
          if (active) setCurrentLyric(NO_LYRICS);
        });
    } else {
      setCurrentLyric(NO_LYRICS);
    }

    if (isPlaying && audioRef.current) {
      void audioRef.current.play().catch(() => setIsPlaying(false));
    }

    return () => {
      active = false;
    };
    // playVersion intentionally restarts playback for a newly selected collection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, playlist.length, playVersion]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      void audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  };

  const nextSong = () => {
    if (!playlist.length) return;
    const next =
      playMode === "random"
        ? Math.floor(Math.random() * playlist.length)
        : (currentIndex + 1) % playlist.length;
    setCurrentIndex(next);
    setPlayVersion((value) => value + 1);
  };

  const prevSong = () => {
    if (!playlist.length) return;
    const previous =
      playMode === "random"
        ? Math.floor(Math.random() * playlist.length)
        : (currentIndex - 1 + playlist.length) % playlist.length;
    setCurrentIndex(previous);
    setPlayVersion((value) => value + 1);
  };

  const playSong = (index: number) => {
    if (!playlist.length) return;
    setCurrentIndex(Math.max(0, Math.min(index, playlist.length - 1)));
    setPlayVersion((value) => value + 1);
    setIsPlaying(true);
  };

  const loadCollection = (songs: Track[], startIndex = 0) => {
    if (!songs.length) return;
    manualCollection.current = true;
    setPlaylist(songs);
    setCurrentIndex(Math.max(0, Math.min(startIndex, songs.length - 1)));
    setPlayVersion((value) => value + 1);
    setIsPlaying(false);
  };

  const playCollection = (songs: Track[], startIndex = 0) => {
    if (!songs.length) return;
    manualCollection.current = true;
    setPlaylist(songs);
    setCurrentIndex(Math.max(0, Math.min(startIndex, songs.length - 1)));
    setPlayVersion((value) => value + 1);
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const time = audio.currentTime || 0;
    const total = audio.duration || 0;
    setCurrentTime(time);
    setDuration(total);
    setProgress(total ? (time / total) * 100 : 0);

    if (lyrics.length) {
      const current = [...lyrics].reverse().find((line) => time >= line.time);
      if (current?.text && current.text !== currentLyric) setCurrentLyric(current.text);
    }
  };

  const handleEnded = () => {
    if (playMode === "single" && audioRef.current) {
      audioRef.current.currentTime = 0;
      void audioRef.current.play().catch(() => setIsPlaying(false));
      return;
    }
    nextSong();
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const percent = Number(event.target.value);
    setProgress(percent);
    if (audioRef.current?.duration) {
      audioRef.current.currentTime = (percent / 100) * audioRef.current.duration;
    }
  };

  const setVolume = (value: number) => {
    setVolumeState(value);
    if (isMuted && value > 0) setIsMuted(false);
  };

  const toggleMute = () => setIsMuted((value) => !value);

  const togglePlayMode = () => {
    setPlayMode((mode) => (mode === "loop" ? "single" : mode === "single" ? "random" : "loop"));
  };

  const currentSong = playlist[currentIndex];

  return (
    <MusicContext.Provider
      value={{
        playlist,
        currentIndex,
        currentSong,
        isPlaying,
        progress,
        currentTime,
        duration,
        currentLyric,
        lyrics,
        isLoading,
        volume,
        isMuted,
        playMode,
        togglePlay,
        nextSong,
        prevSong,
        handleSeek,
        playSong,
        playCollection,
        loadCollection,
        setVolume,
        toggleMute,
        togglePlayMode,
      }}
    >
      {children}
      {currentSong && (
        <audio
          ref={audioRef}
          src={currentSong.src}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onEnded={handleEnded}
        />
      )}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic must be used within MusicProvider");
  return context;
}
