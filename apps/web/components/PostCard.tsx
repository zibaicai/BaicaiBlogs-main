import { formatDay, type Post } from "../lib/api";
import { getDefaultCover } from "../lib/site-config";
import ArchiveItemCard from "./ArchiveItemCard";

export default function PostCard({ post, layout = "cover" }: { post: Post; layout?: "cover" | "timeline" | "masonry" }) {
  const cover = post.cover || getDefaultCover(post.slug || post.title);

  return (
    <ArchiveItemCard
      href={`/posts/${encodeURIComponent(post.slug)}`}
      title={post.title}
      description={post.description || "暂无摘要"}
      label={formatDay(post.date)}
      category={post.categoryPath?.split("/").join(" / ")}
      tags={post.tags}
      media={{ kind: "cover", src: cover, alt: post.title }}
      layout={layout}
    />
  );
}
