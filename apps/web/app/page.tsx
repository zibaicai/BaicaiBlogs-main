import Link from "next/link";
import { ArrowUpRight, Radio, Sparkles } from "lucide-react";

import Navbar from "../components/Navbar";
import PageTransition from "../components/PageTransition";
import SiteDashboard from "../components/SiteDashboard";
import { formatDate } from "../lib/api";
import { getMoments, getPosts, getPublicSiteConfig, getRooms } from "../lib/server-api";

export const dynamic = "force-dynamic";

function plainText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export default async function CommunityHome() {
  const [{ siteInfo }, rooms, posts, moments] = await Promise.all([
    getPublicSiteConfig(),
    getRooms(),
    getPosts(),
    getMoments(),
  ]);

  const communityName = siteInfo.navAfter || siteInfo.title || "云端小屋";
  const recentPosts = posts.slice(0, 6);
  const recentMoments = moments.slice(0, 4);
  const visibleRooms = rooms.slice(0, 12);

  return (
    <div className="home-v2 min-h-screen relative pb-16">
      <Navbar />
      <PageTransition>
        <div className="home-v2-inner w-full max-w-[1180px] mx-auto px-4 sm:px-8 pt-24">
          <section className="rounded-[2rem] border border-white/50 bg-white/55 p-7 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 md:p-10">
            <div className="hv-eyebrow">
              <span className="hv-live-dot" /> COMMUNITY <span className="hv-slash">/</span> 2026
            </div>
            <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white md:text-6xl">
                  {communityName}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                  {siteInfo.bio || "收集生活的砂砾，也收藏那些不想丢掉的东西。"}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href="#rooms" className="hv-button hv-button-primary">
                    发现小屋 <ArrowUpRight size={15} />
                  </a>
                  <Link href="/account/room" className="hv-button">
                    布置我的小屋 <Sparkles size={15} />
                  </Link>
                </div>
              </div>
              <div className="flex gap-5 text-center">
                <div><strong className="block text-2xl font-black text-slate-900 dark:text-white">{rooms.length}</strong><span className="text-[10px] text-slate-500">小屋</span></div>
                <div><strong className="block text-2xl font-black text-slate-900 dark:text-white">{posts.length}</strong><span className="text-[10px] text-slate-500">笔记</span></div>
                <div><strong className="block text-2xl font-black text-slate-900 dark:text-white">{moments.length}</strong><span className="text-[10px] text-slate-500">说说</span></div>
              </div>
            </div>
          </section>

          <section id="rooms" className="mt-10">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">ROOMS</p>
                <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">大家的小屋</h2>
              </div>
              <span className="text-xs text-slate-500"><Radio size={12} className="mr-1 inline text-emerald-500" /> {visibleRooms.length} 间正在生长</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleRooms.map((room) => (
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
                      <h3 className="truncate text-sm font-black text-slate-900 group-hover:text-indigo-500 dark:text-white">{room.roomName}</h3>
                      <p className="truncate text-[10px] text-slate-500">{room.nickname}</p>
                    </div>
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
          </section>

          <div className="hv-layout mt-10">
            <section className="hv-panel hv-posts">
              <div className="hv-panel-head">
                <h2>社区最近写下</h2>
                <Link href="/posts" className="hv-text-link">全部笔记 <span>→</span></Link>
              </div>
              <div className="hv-post-list">
                {recentPosts.map((post, index) => (
                  <Link key={post.slug} href={`/posts/${post.slug}`} className="hv-post-row">
                    <span className="hv-post-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="hv-post-main">
                      <strong>{post.title || "无题"}</strong>
                      <span>{post.description || "继续阅读这篇记录。"}</span>
                    </span>
                    <span className="hv-post-meta"><time>{formatDate(post.date)}</time><span className="hv-post-arrow">→</span></span>
                  </Link>
                ))}
              </div>
              {recentPosts.length === 0 && <p className="hv-empty">社区还没有第一篇笔记。</p>}
            </section>

            <aside className="hv-side">
              <section className="hv-panel hv-moments">
                <div className="hv-panel-head">
                  <h2>社区最近说说</h2>
                  <Link href="/moments" className="hv-text-link">全部说说 <span>→</span></Link>
                </div>
                <div className="hv-moment-list">
                  {recentMoments.map((moment, index) => (
                    <Link key={moment.id || moment.slug || index} href="/moments" className="hv-moment-row">
                      <span className="hv-moment-mark">{String(index + 1).padStart(2, "0")}</span>
                      <span className="hv-moment-main">
                        <strong>{plainText(moment.htmlContent || moment.content || "").slice(0, 90) || "一条新的碎碎念。"}</strong>
                        <span>{formatDate(moment.date)}</span>
                      </span>
                    </Link>
                  ))}
                  {recentMoments.length === 0 && <p className="hv-empty">暂时没有新的碎碎念。</p>}
                </div>
              </section>
            </aside>
          </div>

          <div className="hv-dashboard"><SiteDashboard /></div>
        </div>
      </PageTransition>
    </div>
  );
}
