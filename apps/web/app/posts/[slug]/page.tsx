import Link from "next/link";
import { getPost } from "@/lib/api";

export const revalidate = 60;

export default async function PostDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    return (
      <>
        <h1 style={{ marginTop: 28 }}>文章不存在或未公开</h1>
        <p><Link href="/posts">返回文章列表</Link></p>
      </>
    );
  }
  return (
    <>
      <h1 style={{ marginTop: 28 }}>{post.title}</h1>
      <div className="muted">{(post.date || "").slice(0, 10)}</div>
      <article className="card prose" dangerouslySetInnerHTML={{ __html: post.htmlContent || "" }} />
      <p><Link href="/posts">← 返回列表</Link></p>
    </>
  );
}
