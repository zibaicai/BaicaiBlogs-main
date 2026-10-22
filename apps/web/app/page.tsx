import Link from "next/link";
import { getPosts } from "@/lib/api";

export const revalidate = 60;

export default async function Home() {
  const posts = await getPosts();
  return (
    <>
      <h1 style={{ marginTop: 28 }}>最新文章</h1>
      {posts.length === 0 && <p className="muted">暂无公开文章</p>}
      {posts.slice(0, 10).map((p) => (
        <article className="card" key={p.id}>
          <h2 style={{ margin: "0 0 6px" }}>
            <Link href={`/posts/${encodeURIComponent(p.slug)}`}>{p.title}</Link>
          </h2>
          <div className="muted">{(p.date || "").slice(0, 10)}</div>
          {p.description && <p className="muted" style={{ margin: "8px 0 0" }}>{p.description}</p>}
          <div style={{ marginTop: 8 }}>
            {(p.tags || []).map((t) => <span className="tag" key={t}>{t}</span>)}
          </div>
        </article>
      ))}
    </>
  );
}
