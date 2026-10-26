import Link from "next/link";
import { formatDay, type Post } from "../lib/api";
import { DEFAULT_BACKGROUND } from "../lib/site-config";

export default function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/posts/${encodeURIComponent(post.slug)}`}
      className="directory-card group"
    >
      <div className="directory-card-media">
        <img
          className="directory-card-media-image"
          src={post.cover || DEFAULT_BACKGROUND.defaultPostCover}
          alt={post.title}
          loading="lazy"
        />
        <img
          className="directory-card-blur"
          src={post.cover || DEFAULT_BACKGROUND.defaultPostCover}
          alt=""
          aria-hidden="true"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="directory-date-badge">{formatDay(post.date)}</span>
      </div>
      <div className="directory-card-body">
        <div className="directory-card-copy">
          <time className="directory-card-time" dateTime={post.date}>{formatDay(post.date)}</time>
          <h2 className="directory-card-title">{post.title}</h2>
          <p className="directory-card-description">{post.description || "暂无摘要"}</p>
        </div>
        <div className="directory-card-foot">
          {post.categoryPath && (
            <span className="directory-card-category">
              {post.categoryPath.split("/").join(" / ")}
            </span>
          )}
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
      </div>
    </Link>
  );
}
