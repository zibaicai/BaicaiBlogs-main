import Link from "next/link";
import { ArrowUpRight, Radio } from "lucide-react";

import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import { getPublicSiteConfig, getRooms } from "../../lib/server-api";

export const dynamic = "force-dynamic";
export const metadata = { title: "云端小屋目录" };

export default async function RoomsPage() {
  const [{ siteInfo }, rooms] = await Promise.all([getPublicSiteConfig(), getRooms()]);
  const communityName = siteInfo.navAfter || siteInfo.title || "云端小屋";

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell">
          <div className="max-w-6xl mx-auto">
            <header className="mb-10">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-400">ROOM DIRECTORY</p>
              <h1 className="page-title mt-2 text-slate-900 dark:text-white">
                {communityName}目录
              </h1>
              <p className="mt-3 text-sm text-slate-500">
                每一间小屋，都是一个人正在生活的地方。
              </p>
            </header>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <Link
                  key={room.username}
                  href={`/u/${encodeURIComponent(room.username)}`}
                  className="group rounded-3xl border border-white/50 bg-white/55 p-5 shadow-md backdrop-blur-xl transition hover:-translate-y-1 hover:border-indigo-300 dark:border-white/10 dark:bg-slate-900/45"
                >
                  <div className="flex items-center gap-3">
                    {room.avatar ? (
                      <img src={room.avatar} alt={room.nickname} className="h-12 w-12 rounded-2xl object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-lg font-black text-indigo-500">
                        {room.nickname.slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-black text-slate-900 group-hover:text-indigo-500 dark:text-white">{room.roomName}</h2>
                      <p className="truncate text-[10px] text-slate-500">{room.nickname}</p>
                    </div>
                    <ArrowUpRight size={14} className="ml-auto text-slate-400 transition group-hover:text-indigo-500" />
                  </div>
                  <p className="mt-4 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {room.roomBio || "还没有写下小屋简介。"}
                  </p>
                  <div className="mt-4 flex gap-4 text-[10px] text-slate-400">
                    <span>{room.postCount} 笔记</span>
                    <span>{room.momentCount} 说说</span>
                    <span>{room.photoCount} 照片</span>
                  </div>
                </Link>
              ))}
            </div>
            {rooms.length === 0 && <p className="py-20 text-center text-sm text-slate-500">还没有小屋。</p>}

            <div className="mt-8 flex items-center gap-2 text-xs text-slate-500">
              <Radio size={12} className="text-emerald-500" /> {rooms.length} 间小屋正在生长
            </div>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
