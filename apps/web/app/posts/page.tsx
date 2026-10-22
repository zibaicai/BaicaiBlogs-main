import Link from "next/link";
import { getPosts } from "@/lib/api";

export const revalidate = 60;
export const metadata = { title: "全部文章" };

export default async function PostsPage() {
  const posts = await getPosts();
  return (
    <>
      <h1 style={{ marginTop: 28 }}>全部文章（{posts.length}）</h1>
      {posts.map((p) => (
        <div className="card" key={p.id}>
          <Link href={`/posts/${encodeURIComponent(p.slug)}`}><strong>{p.title}</strong></Link>
          <div className="muted">{(p.date || "").slice(0, 10)}</div>
        </div>
      ))}
    </>
  );
}
