import Link from "next/link";
import { notFound } from "next/navigation";

import Navbar from "../../../../components/Navbar";
import PageTransition from "../../../../components/PageTransition";
import { PageTitle } from "../../../../components/ui/Typography";
import { formatDate } from "../../../../lib/api";
import { getRoom } from "../../../../lib/server-api";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const room = await getRoom(username);
  return { title: room ? `关于 ${room.nickname}` : "关于" };
}

export default async function RoomAboutPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const room = await getRoom(username);
  if (!room) notFound();

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell">
          <div className="max-w-4xl mx-auto">
            <header className="text-center mb-10">
              <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-3xl bg-white/50 shadow-lg">
                {room.avatar ? (
                  <img src={room.avatar} alt={room.nickname} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-black text-indigo-500">
                    {room.nickname.slice(0, 1)}
                  </div>
                )}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-400">ROOM / OWNER</p>
              <PageTitle className="mt-2 text-slate-900 dark:text-white">
                {room.nickname}
              </PageTitle>
              <p className="mt-2 text-sm text-slate-500">{room.roomName}</p>
            </header>

            <section className="rounded-3xl border border-white/40 bg-white/60 p-8 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/50 md:p-10">
              <h2 className="mb-4 text-2xl font-black text-slate-900 dark:text-white">关于 {room.nickname}</h2>
              <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                {room.roomBio || "这个小屋还没有写下简介。"}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  ["笔记", room.postCount],
                  ["说说", room.momentCount],
                  ["相册", room.albumCount],
                  ["照片", room.photoCount],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-2xl bg-white/50 p-4 dark:bg-slate-900/40">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
                    <div className="mt-1 text-xl font-black text-slate-800 dark:text-white">{value}</div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs text-slate-500">加入于 {formatDate(room.joinedAt || "") || "未知"}</p>
            </section>

            <div className="mt-8 flex justify-center gap-3">
              <Link href={`/u/${encodeURIComponent(room.username)}`} className="hv-button">回到小屋</Link>
              <Link href="/" className="hv-button">社区首页</Link>
            </div>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
