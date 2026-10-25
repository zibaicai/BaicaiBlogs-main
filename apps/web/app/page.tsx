import Link from "next/link";

import Navbar from "../components/Navbar";
import PageTransition from "../components/PageTransition";
import AlbumAccordion from "../components/AlbumAccordion";
import HomeHero from "../components/HomeHero";
import HomeThemeToggle from "../components/HomeThemeToggle";
import SiteDashboard from "../components/SiteDashboard";
import { formatDate } from "../lib/api";
import { getAlbums, getChatters, getPosts } from "../lib/server-api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [posts, chatters, albums] = await Promise.all([getPosts(), getChatters(), getAlbums()]);

  const recentPosts = posts.slice(0, 4).map((p) => ({
    ...p,
    formattedDate: formatDate(p.date),
  }));

  const recentChatters = chatters.slice(0, 3).map((c) => ({
    ...c,
    description: c.description || c.content?.slice(0, 60) || "",
    formattedDate: formatDate(c.date),
  }));

  const photoCount = albums.reduce((total, album) => total + (album.photos?.length || 0), 0);

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
            <AlbumAccordion albums={albums} />
          </section>

          <div className="hv-toolbar hv-toolbar-meta-only">
            <div className="hv-toolbar-meta">
              <span>TIDE ARCHIVE</span>
              <span className="hv-toolbar-dot" />
              <span>UPDATED {recentPosts[0]?.formattedDate || "TODAY"}</span>
            </div>
          </div>

          <main className="hv-layout">
            <section className="hv-panel hv-posts">
              <div className="hv-panel-head">
                <div>
                  <span className="hv-profile-label">LATEST WRITING</span>
                  <h2>最近写下的</h2>
                </div>
                <Link href="/posts" className="hv-text-link">
                  全部文字 <span>↗</span>
                </Link>
              </div>

              <div className="hv-post-list">
                {recentPosts.map((post, index) => (
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

              {recentPosts.length === 0 && (
                <p className="hv-empty">还没有写下第一篇。</p>
              )}
            </section>

            <aside className="hv-side">
              <section className="hv-panel hv-moments">
                <div className="hv-panel-head">
                  <div>
                    <span className="hv-profile-label">SMALL FRAGMENTS</span>
                    <h2>最近的碎片</h2>
                  </div>
                  <Link href="/moments" className="hv-text-link">
                    全部碎片 <span>↗</span>
                  </Link>
                </div>

                <div className="hv-moment-list">
                  {recentChatters.map((chatter, index) => (
                    <Link key={chatter.id || index} href="/moments" className="hv-moment-row">
                      <span className="hv-moment-mark">{String(index + 1).padStart(2, "0")}</span>
                      <span className="hv-moment-main">
                        <strong>{chatter.description || "一条新的碎碎念。"}</strong>
                        <span>{chatter.formattedDate}</span>
                      </span>
                    </Link>
                  ))}
                  {recentChatters.length === 0 && <p className="hv-empty">暂时没有新的碎碎念。</p>}
                </div>
              </section>

              <HomeThemeToggle />
            </aside>
          </main>

          <div className="hv-dashboard">
            <SiteDashboard />
          </div>
        </div>
      </PageTransition>
    </div>
  );
}
