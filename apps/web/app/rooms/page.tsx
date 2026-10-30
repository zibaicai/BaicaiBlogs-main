import { Radio } from "lucide-react";

import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import ArchiveItemCard from "../../components/ArchiveItemCard";
import { ArchiveGridShell } from "../../components/DirectoryView";
import { PageTitle } from "../../components/ui/Typography";
import { getPublicSiteConfig, getRooms } from "../../lib/server-api";

export const dynamic = "force-dynamic";
export const metadata = { title: "云端小屋目录" };

export default async function RoomsPage() {
  const [{ siteInfo }, rooms] = await Promise.all([getPublicSiteConfig(), getRooms()]);
  const communityName = siteInfo.navAfter || siteInfo.title || "云端小屋";
  const roomCards = rooms.map((room) => (
    <ArchiveItemCard
      key={room.username}
      layout="profile"
      href={`/u/${encodeURIComponent(room.username)}`}
      title={room.roomName}
      description={room.roomBio || "还没有写下小屋简介。"}
      label={room.nickname}
      meta={`${room.postCount} 笔记 · ${room.momentCount} 说说 · ${room.photoCount} 照片`}
      media={
        room.avatar
          ? { kind: "avatar", src: room.avatar, alt: room.nickname }
          : { kind: "icon", content: room.nickname.slice(0, 1) }
      }
    />
  ));

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell">
          <div className="max-w-6xl mx-auto">
            <header className="mb-10">
              <p className="text-meta font-black uppercase tracking-[0.22em] text-indigo-400">ROOM DIRECTORY</p>
              <PageTitle className="mt-2 text-slate-900 dark:text-white">
                {communityName}目录
              </PageTitle>
              <p className="page-subtitle mt-3 text-slate-500">
                每一间小屋，都是一个人正在生活的地方。
              </p>
            </header>

            <ArchiveGridShell items={roomCards} gridVariant="profile" />
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
