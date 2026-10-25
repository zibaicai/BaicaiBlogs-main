"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Music2, VolumeX } from "lucide-react";
import { useMusic } from "./MusicProvider";

export default function FloatingPlayer() {
  const pathname = usePathname();
  const { currentSong, isPlaying, togglePlay, isLoading } = useMusic();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("musicMiniPlayerVisible");
      setVisible(stored === null ? pathname === "/" : stored === "true");
    } catch {
      setVisible(pathname === "/");
    }
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<boolean>).detail;
      setVisible(Boolean(detail));
    };
    window.addEventListener("music-player-visibility", sync);
    return () => window.removeEventListener("music-player-visibility", sync);
  }, [pathname]);

  if (!mounted || isLoading || !currentSong) return null;

  return (
    <div className="pointer-events-none fixed bottom-8 right-8 z-[9999]">
      <motion.button
        type="button"
        onClick={togglePlay}
        initial={false}
        animate={{
          opacity: visible ? 1 : 0,
          scale: visible ? 1 : 0.72,
          pointerEvents: visible ? "auto" : "none",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        aria-label={isPlaying ? "暂停音乐" : "播放音乐"}
        title={isPlaying ? `暂停：${currentSong.title}` : `播放：${currentSong.title}`}
        className={`music-orb group relative flex h-[52px] w-[52px] items-center justify-center rounded-full border shadow-2xl backdrop-blur-xl transition-colors ${
          isPlaying
            ? "is-playing border-indigo-300/60 bg-indigo-500 text-white dark:border-indigo-400/40"
            : "border-white/50 bg-white/55 text-slate-500 dark:border-white/10 dark:bg-slate-900/55 dark:text-slate-300"
        }`}
      >
        {isPlaying && (
          <>
            <span className="music-ripple" aria-hidden="true" />
            <span className="music-ripple music-ripple-delay" aria-hidden="true" />
          </>
        )}
        {isPlaying ? <Music2 size={19} /> : <VolumeX size={19} />}
        <span className="music-orb-tip">{currentSong.title}</span>
      </motion.button>
    </div>
  );
}
