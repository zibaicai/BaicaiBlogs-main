import Link from "next/link";
import { notFound } from "next/navigation";

import Navbar from "../../../components/Navbar";
import PageTransition from "../../../components/PageTransition";
import HomeHero from "../../../components/HomeHero";
import { formatDate } from "../../../lib/api";
import { getRoom } from "../../../lib/server-api";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const room = await getRoom(username);
  return { title: room ? `${room.roomName} · ${room.nickname}` : "小屋" };
}

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

export default async function RoomPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const room = await getRoom(username);
  if (!room) notFound();

  return (
    <div className="home-v2 min-h-screen relative pb-16">
      <Navbar />
      <PageTransition>
        <div className="home-v2-inner w-full max-w-[1180px] mx-auto px-4 sm:px-8 lg:pr-[200px] pt-24">
          <section className="hv-hero">
            <HomeHero
              profile={room}
              postCount={room.postCount}
              momentCount={room.momentCount}
              photoCount={room.photoCount}
            />
          </section>

          <div className="hv-layout">
            <section className="hv-panel hv-posts">
              <div className="hv-panel-head">
                <h2>最近写下</h2>
                <Link href="/posts" className="hv-text-link">全部笔记 <span>→</span></Link>
              </div>
              <div className="hv-post-list">
                {(room.posts || []).map((post, index) => (
                  <Link key={post.slug} href={`/posts/${post.slug}`} className="hv-post-row">
                    <span className="hv-post-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="hv-post-main">
                      <strong>{post.title || "无题"}</strong>
                      <span>{post.description || "继续阅读这篇记录。"}</span>
                    </span>
                    <span className="hv-post-meta">
                      <time>{formatDate(post.date)}</time>
                      <span className="hv-post-arrow">→</span>
                    </span>
                  </Link>
                ))}
              </div>
              {(room.posts || []).length === 0 && <p className="hv-empty">还没有写下第一篇。</p>}
            </section>

            <aside className="hv-side">
              <section className="hv-panel hv-moments">
                <div className="hv-panel-head">
                  <h2>最近的说说</h2>
                  <Link href="/moments" className="hv-text-link">全部说说 <span>→</span></Link>
                </div>
                <div className="hv-moment-list">
                  {(room.moments || []).map((moment, index) => (
                    <Link key={moment.id || moment.slug || index} href="/moments" className="hv-moment-row">
                      <span className="hv-moment-mark">{String(index + 1).padStart(2, "0")}</span>
                      <span className="hv-moment-main">
                        <strong>{plainText(moment.htmlContent || moment.content || "").slice(0, 100) || "一条新的碎碎念。"}</strong>
                        <span>{formatDate(moment.date)}</span>
                      </span>
                    </Link>
                  ))}
                  {(room.moments || []).length === 0 && <p className="hv-empty">暂时没有新的碎碎念。</p>}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </PageTransition>
    </div>
  );
}
