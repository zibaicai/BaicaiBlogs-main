import { formatDay, type Post } from "../lib/api";
import { DEFAULT_BACKGROUND } from "../lib/site-config";
import ArchiveItemCard from "./ArchiveItemCard";

export default function PostCard({ post }: { post: Post }) {
  const cover = post.cover || DEFAULT_BACKGROUND.defaultPostCover;

  return (
    <ArchiveItemCard
      href={`/posts/${encodeURIComponent(post.slug)}`}
      title={post.title}
      description={post.description || "暂无摘要"}
      label={formatDay(post.date)}
      category={post.categoryPath?.split("/").join(" / ")}
      tags={post.tags}
      media={{ kind: "cover", src: cover, alt: post.title }}
    />
  );
}
