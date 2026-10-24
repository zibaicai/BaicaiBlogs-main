import Link from "next/link";

import Navbar from "../components/Navbar";
import PageTransition from "../components/PageTransition";
import CloudPlayer from "../components/CloudPlayer";
import HomeHero from "../components/HomeHero";
import HomeThemeToggle from "../components/HomeThemeToggle";
import SiteDashboard from "../components/SiteDashboard";
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

  const top5Chatters = chatters.slice(0, 3).map((c) => ({
    ...c,
    description: c.description || c.content?.slice(0, 60) || "",
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
    <div className="home-v2 min-h-screen relative pb-16">
      <Navbar />
      <PageTransition>
        <div className="home-v2-inner w-full max-w-[1180px] mx-auto px-4 sm:px-8 lg:pr-[200px] pt-28">
          <section className="hv-hero">
            <HomeHero
              postCount={posts.length}
              chatterCount={chatters.length}
              photoCount={photoCount}
            />
            <div className="hv-hero-music hv-panel">
              <CloudPlayer />
            </div>
          </section>

          <div className="hv-toolbar hv-toolbar-meta-only">
            <div className="hv-toolbar-meta">
              <span>PERSONAL ARCHIVE</span>
              <span className="hv-toolbar-dot" />
              <span>UPDATED {top5Posts[0]?.formattedDate || "TODAY"}</span>
            </div>
          </div>

          <main className="hv-layout">
            <section className="hv-panel hv-posts">
              <div className="hv-panel-head">
                <div>
                  <span className="hv-profile-label">LATEST NOTES</span>
                  <h2>最近写下的</h2>
                </div>
                <Link href="/posts" className="hv-text-link">
                  全部文章 <span>↗</span>
                </Link>
              </div>

              <div className="hv-post-list">
                {top5Posts.map((post, index) => (
                  <Link key={post.slug} href={`/posts/${post.slug}`} className="hv-post-row">
                    <span className="hv-post-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="hv-post-main">
                      <strong>{post.title || "无题"}</strong>
                      <span>{post.description || "继续阅读这篇记录。"}</span>
                    </span>
                    <span className="hv-post-meta">
                      <time>{post.formattedDate}</time>
                      <span className="hv-post-arrow">↗</span>
                    </span>
                  </Link>
                ))}
              </div>

              {top5Posts.length === 0 && (
                <p className="hv-empty">还没有文章，先写下第一篇吧。</p>
              )}
            </section>

            <aside className="hv-side">
              <Link href="/photowall" className="hv-photo-card">
                <img src={latestAlbum.cover || DEFAULT_MISC.photoWallImage} alt={latestAlbum.title} />
                <span className="hv-photo-shade" />
                <span className="hv-photo-copy">
                  <span className="hv-profile-label">PHOTO WALL</span>
                  <strong>{latestAlbum.title}</strong>
                  <span>{latestAlbum.description}</span>
                </span>
                <span className="hv-photo-arrow">↗</span>
              </Link>
            </aside>

            <section className="hv-panel hv-moments">
              <div className="hv-panel-head">
                <div>
                  <span className="hv-profile-label">SMALL MOMENTS</span>
                  <h2>最近的碎碎念</h2>
                </div>
                <Link href="/moments" className="hv-text-link">
                  全部说说 <span>↗</span>
                </Link>
              </div>

              <div className="hv-moment-list">
                {top5Chatters.map((chatter, index) => (
                  <Link key={chatter.id || index} href="/moments" className="hv-moment-row">
                    <span className="hv-moment-mark">{String(index + 1).padStart(2, "0")}</span>
                    <span className="hv-moment-main">
                      <strong>{chatter.description || "一条新的碎碎念。"}</strong>
                      <span>{chatter.formattedDate}</span>
                    </span>
                  </Link>
                ))}
                {top5Chatters.length === 0 && <p className="hv-empty">暂时没有新的碎碎念。</p>}
              </div>
            </section>

            <div className="hv-side-bottom">
              <HomeThemeToggle />
            </div>
          </main>

          <div className="hv-dashboard">
            <SiteDashboard />
          </div>
        </div>
      </PageTransition>
    </div>
  );
}
