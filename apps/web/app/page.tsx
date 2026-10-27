import Link from "next/link";

import Navbar from "../components/Navbar";
import PageTransition from "../components/PageTransition";
import AlbumAccordion from "../components/AlbumAccordion";
import HomeHero from "../components/HomeHero";
import HomeThemeToggle from "../components/HomeThemeToggle";
import SiteDashboard from "../components/SiteDashboard";
import { formatDate } from "../lib/api";
import { getAlbums, getMoments, getPosts } from "../lib/server-api";

export const dynamic = "force-dynamic";

function plainText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export default async function Home() {
  const [posts, moments, albums] = await Promise.all([getPosts(), getMoments(), getAlbums()]);

  const recentPosts = posts.slice(0, 6).map((p) => ({
    ...p,
    formattedDate: formatDate(p.date),
  }));

  const recentMoments = moments.slice(0, 4).map((moment) => ({
    ...moment,
    description: plainText(moment.htmlContent || moment.content || "").slice(0, 80),
    formattedDate: formatDate(moment.date),
  }));

  const photoCount = albums.reduce((total, album) => total + (album.photos?.length || 0), 0);

  return (
    <div className="home-v2 min-h-screen relative pb-16">
      <Navbar />
      <PageTransition>
        <div className="home-v2-inner w-full max-w-[1180px] mx-auto px-4 sm:px-8 lg:pr-[200px] pt-24">
          <section className="hv-hero">
            <HomeHero
              postCount={posts.length}
              momentCount={moments.length}
              photoCount={photoCount}
            />
            <AlbumAccordion albums={albums} />
          </section>

          <div className="hv-layout">
            <section className="hv-panel hv-posts">
              <div className="hv-panel-head">
                <h2>最近写下</h2>
                <Link href="/posts" className="hv-text-link">
                  全部笔记 <span>↗</span>
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
                  <h2>最近的说说</h2>
                  <Link href="/moments" className="hv-text-link">
                    全部说说 <span>↗</span>
                  </Link>
                </div>

                <div className="hv-moment-list">
                  {recentMoments.map((moment, index) => (
                    <Link key={moment.id || moment.slug || index} href="/moments" className="hv-moment-row">
                      <span className="hv-moment-mark">{String(index + 1).padStart(2, "0")}</span>
                      <span className="hv-moment-main">
                        <strong>{moment.description || "一条新的碎碎念。"}</strong>
                        <span>{moment.formattedDate}</span>
                      </span>
                    </Link>
                  ))}
                  {recentMoments.length === 0 && <p className="hv-empty">暂时没有新的碎碎念。</p>}
                </div>

                <HomeThemeToggle updatedAt={recentPosts[0]?.formattedDate} />
              </section>
            </aside>
          </div>

          <div className="hv-dashboard">
            <SiteDashboard />
          </div>
        </div>
      </PageTransition>
    </div>
  );
}
