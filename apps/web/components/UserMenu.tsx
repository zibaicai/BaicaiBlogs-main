"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "../lib/auth";

export default function UserMenu() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (loading) return null;

  if (!user) {
    return (
      <Link
        href="/login"
        className="btn btn-primary px-4 py-2 rounded-xl text-xs font-black shadow-md"
      >
        登录
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`打开 ${user.nickname || user.username} 的用户菜单`}
        aria-haspopup="menu"
        aria-expanded={open}
        title={user.nickname || user.username}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-[var(--ui-accent)] to-[var(--ui-accent-hover)] text-[var(--ui-accent-contrast)] ring-1 ring-white/30 transition-shadow hover:ring-indigo-400/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        {user.avatar ? (
          <img src={user.avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-black">
            {user.nickname?.slice(0, 1) || <UserIcon size={14} />}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-2xl p-2 z-[120]">
          <Link
            href={`/u/${encodeURIComponent(user.username)}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800"
          >
            <UserIcon size={13} /> 我的小屋
          </Link>
          <Link
            href="/account/room"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800"
          >
            小屋设置
          </Link>
          <Link
            href="/account/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800"
          >
            <Bell size={13} /> 消息中心
          </Link>
          <Link
            href="/account/photos"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800"
          >
            我的图片
          </Link>
          <Link
            href="/account/tags"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800"
          >
            申请标签
          </Link>
          <button
            onClick={async () => {
              await logout();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 flex items-center gap-2"
          >
            <LogOut size={13} /> 退出登录
          </button>
        </div>
      )}
    </div>
  );
}
