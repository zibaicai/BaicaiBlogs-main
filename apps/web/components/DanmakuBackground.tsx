"use client";

import { useEffect, useState } from 'react';

interface DanmakuItem {
  id: number;
  text: string;
  top: number;
  duration: number;
  delay: number;
}

const LANE_COUNT = 8;

/**
 * 只读背景弹幕：数据库驱动，按固定轨道播放，避免多条弹幕叠在同一行。
 * 输入框在 DanmakuComposer，发送成功后通过 danmaku-updated 事件刷新。
 */
export default function DanmakuBackground() {
  const [danmakus, setDanmakus] = useState<DanmakuItem[]>([]);
  const [list, setList] = useState<string[]>([]);
  const [round, setRound] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/public/danmaku', { cache: 'no-store' });
        const json = await res.json();
        if (!cancelled && json?.success && Array.isArray(json.data)) {
          setList(json.data.filter((x: unknown) => typeof x === 'string' && x.trim()).slice(0, 500));
        }
      } catch {
        // 背景弹幕失败不影响主页面
      }
    };

    const onUpdated = () => void load();
    void load();
    window.addEventListener('danmaku-updated', onUpdated);
    const poll = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.removeEventListener('danmaku-updated', onUpdated);
      window.clearInterval(poll);
    };
  }, []);

  // 每 45 秒换一批文本，避免长时间反复看到同样 8 条
  useEffect(() => {
    const timer = window.setInterval(() => setRound((r) => r + 1), 45000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (list.length === 0) {
      setDanmakus([]);
      return;
    }

    // 每个轨道只放一条，且轨道之间垂直间距固定，彻底避免叠字
    setDanmakus(
      Array.from({ length: LANE_COUNT }, (_, i) => ({
        id: i,
        text: list[Math.floor(Math.random() * list.length)],
        top: 8 + (i * 84) / Math.max(1, LANE_COUNT - 1),
        duration: 32 + Math.random() * 12,
        delay: i * 3.8,
      }))
    );
  }, [list, round]);

  return (
    <div className="fixed left-0 right-0 top-28 z-0 h-[30vh] overflow-hidden pointer-events-none select-none">
      {danmakus.map((item) => (
        <div
          key={item.id}
          className="absolute whitespace-nowrap font-bold text-[13px] tracking-wider text-white/60 drop-shadow-[0_1px_4px_rgba(15,23,42,0.75)] dark:text-white/30 md:text-[15px]"
          style={{
            top: `${item.top}%`,
            left: '100%',
            transform: 'translateY(-50%)',
            animation: `danmaku-flow ${item.duration}s linear ${item.delay}s infinite`,
            willChange: 'transform',
          }}
        >
          {item.text}
        </div>
      ))}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes danmaku-flow {
          0% {
            left: 100%;
            transform: translate(0, -50%);
          }
          100% {
            left: 0;
            transform: translate(-100%, -50%);
          }
        }
      `}} />
    </div>
  );
}
