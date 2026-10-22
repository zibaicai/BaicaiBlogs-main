import Link from "next/link";

import Navbar from "../components/Navbar";
import PageTransition from "../components/PageTransition";
import SearchBar from "../components/SearchBar";
import CloudPlayer from "../components/CloudPlayer";
import ThemeToggleBlock from "../components/ThemeToggleBlock";
import ProfileCard from "../components/ProfileCard";
import SiteDashboard from "../components/SiteDashboard";
import LyricBar from "../components/LyricBar";
import LatestPostsCarousel from "../components/LatestPostsCarousel";
import LatestChatterCarousel from "../components/LatestChatterCarousel";
import { formatDate } from "../lib/api";
import { getAlbums, getChatters, getPosts } from "../lib/server-api";
import { DEFAULT_MISC } from "../lib/site-config";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [posts, chatters, albums] = await Promise.all([getPosts(), getChatters(), getAlbums()]);

  const top5Posts = posts.slice(0, 5).map((p) => ({
    ...p,
    formattedDate: formatDate(p.date),
  }));

  const top5Chatters = chatters.slice(0, 5).map((c) => ({
    ...c,
    description: c.description || c.content?.slice(0, 60) || "",
    cover: c.cover || DEFAULT_MISC.photoWallImage,
    formattedDate: formatDate(c.date),
  }));

  const photoCount = albums.reduce((total, album) => total + (album.photos?.length || 0), 0);
  const latestAlbum = albums[0] || {
    albumId: "empty",
    title: "照片墙",
    description: "查看摄影",
    cover: DEFAULT_MISC.photoWallImage,
  };

  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />
      <PageTransition>
        <div className="w-full max-w-6xl mx-auto mt-28 px-4 sm:px-10 relative z-10">
          <SearchBar posts={posts} />

          <main className="flex flex-col gap-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full items-stretch">
              <div className="md:col-span-7 flex">
                <ProfileCard
                  postCount={posts.length}
                  chatterCount={chatters.length}
                  photoCount={photoCount}
                />
              </div>
              <div className="md:col-span-5 flex">
                <CloudPlayer />
              </div>
            </div>

            <div className="w-full mt-[-10px]">
              <LyricBar />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full items-stretch">
              <div className="md:col-span-4 h-full">
                <LatestPostsCarousel posts={top5Posts} />
              </div>
              <div className="md:col-span-8 flex flex-col gap-6 h-full">
                <Link
                  href="/photowall"
                  className="flex-1 rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden transition-all duration-700 hover:scale-[1.02] relative group min-h-[220px]"
                >
                  <img
                    src={latestAlbum.cover || DEFAULT_MISC.photoWallImage}
                    alt={latestAlbum.title}
                    className="w-full h-full absolute inset-0 object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
                  />
                  <div className="absolute inset-0 bg-black/20 dark:bg-black/50 group-hover:bg-transparent transition-colors duration-500" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-3xl font-bold text-white mb-2 underline decoration-pink-400">
                      {latestAlbum.title}
                    </h3>
                    <p className="text-white/90 text-lg line-clamp-1">{latestAlbum.description}</p>
                  </div>
                </Link>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-[220px] items-stretch">
                  <div className="md:col-span-8 h-full">
                    <LatestChatterCarousel chatters={top5Chatters} />
                  </div>
                  <div className="md:col-span-4 h-full flex">
                    <ThemeToggleBlock />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full mt-2">
              <SiteDashboard />
            </div>
          </main>
        </div>
      </PageTransition>
    </div>
  );
}
