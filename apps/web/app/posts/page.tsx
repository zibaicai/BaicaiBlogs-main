import Link from "next/link";
import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import DirectoryHeader from "../../components/DirectoryHeader";
import { formatDay } from "../../lib/api";
import { getPosts } from "../../lib/server-api";
import { DEFAULT_BACKGROUND } from "../../lib/site-config";

export const dynamic = "force-dynamic";
export const metadata = { title: "全部文章" };

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell">
          <DirectoryHeader
            eyebrow="BAICAI / ARCHIVE"
            title="研究档案"
            subtitle="把零散的知识，整理成可被检索的坐标"
            count={`共 ${posts.length} 篇公开记录`}
          />

          {posts.length === 0 ? (
            <div className="directory-empty">暂无公开文章，稍后再来看看吧。</div>
          ) : (
            <div className="directory-grid">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/posts/${encodeURIComponent(post.slug)}`}
                  className="directory-card group"
                >
                  <div className="directory-card-media">
                    <img
                      src={post.cover || DEFAULT_BACKGROUND.defaultPostCover}
                      alt={post.title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="directory-date-badge">{formatDay(post.date)}</span>
                  </div>
                  <div className="directory-card-body">
                    <h2 className="directory-card-title">{post.title}</h2>
                    <p className="directory-card-description">{post.description || "暂无摘要"}</p>
                    {(post.tags || []).length > 0 && (
                      <div className="directory-card-tags">
                        {post.tags.map((tag) => (
                          <span key={tag} className="directory-tag">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </PageTransition>
    </div>
  );
}
