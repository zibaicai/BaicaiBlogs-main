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
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-white/50 dark:bg-slate-800/60 border border-white/40 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200"
      >
        <span className="w-7 h-7 rounded-full bg-gradient-to-tr from-[var(--ui-accent)] to-[var(--ui-accent-hover)] text-[var(--ui-accent-contrast)] flex items-center justify-center">
          {user.nickname?.slice(0, 1) || <UserIcon size={13} />}
        </span>
        <span className="hidden md:inline max-w-[90px] truncate">{user.nickname}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-2xl p-2 z-[120]">
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
