"use client";

import { useEffect, useState } from 'react';

interface DanmakuItem {
  id: number;
  text: string;
  top: number;
  duration: number;
  delay: number;
}

interface StoredDanmaku {
  text: string;
}

/**
 * 只读背景弹幕：数据来自 /api/public/danmaku，不再读取硬编码配置。
 * 输入框在 DanmakuComposer，发送成功后通过 danmaku-updated 事件刷新。
 */
export default function DanmakuBackground() {
  const [danmakus, setDanmakus] = useState<DanmakuItem[]>([]);
  const [list, setList] = useState<string[]>([]);

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
    const timer = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.removeEventListener('danmaku-updated', onUpdated);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (list.length === 0) {
      setDanmakus([]);
      return;
    }

    const generated: DanmakuItem[] = [];
    for (let i = 0; i < 15; i++) {
      generated.push({
        id: i,
        text: list[Math.floor(Math.random() * list.length)],
        top: Math.random() * 80 + 10,
        duration: Math.random() * 20 + 25,
        delay: Math.random() * 20,
      });
    }
    setDanmakus(generated);
  }, [list]);

  return (
    <div className="fixed top-28 h-[30vh] left-0 right-0 overflow-hidden pointer-events-none z-0">
      {danmakus.map((item) => (
        <div
          key={item.id}
          className="absolute whitespace-nowrap text-white/30 dark:text-white/10 font-bold text-lg tracking-wider select-none"
          style={{
            top: `${item.top}%`,
            right: '-100%',
            animation: `float-left ${item.duration}s linear ${item.delay}s infinite`,
          }}
        >
          {item.text}
        </div>
      ))}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float-left {
          0% {
            right: -100%;
            transform: translateX(100%);
          }
          100% {
            right: 100%;
            transform: translateX(-100%);
          }
        }
      `}} />
    </div>
  );
}
