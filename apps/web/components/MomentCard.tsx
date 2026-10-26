import Link from "next/link";
import { Lock } from "lucide-react";
import { formatDate } from "../lib/api";

export interface MomentStory {
  id?: number;
  slug: string;
  htmlContent?: string;
  content?: string;
  date: string;
  images?: string[];
  visibility?: string;
}

export default function MomentCard({
  moment,
  commentCount = 0,
}: {
  moment: MomentStory;
  commentCount?: number;
}) {
  const images = (moment.images || []).slice(0, 9);
  const total = moment.images?.length || 0;
  const html = moment.htmlContent || moment.content || "";

  return (
    <article className="moment-card" id={moment.slug}>
      <div className="moment-head">
        <time>{formatDate(moment.date)}</time>
        {moment.visibility === "PRIVATE" && (
          <span className="archive-badge archive-badge-sky"><Lock size={9} /> 仅自己可见</span>
        )}
      </div>

      <div
        className="moment-text article-prose prose prose-slate dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {images.length > 0 && (
        <div className="moment-image-wrap">
          <div className="moment-images" data-count={Math.min(images.length, 9)}>
            {images.map((image, index) => (
              <a
                key={image}
                href={image}
                target="_blank"
                rel="noopener noreferrer"
                className="moment-image"
                aria-label={`查看第 ${index + 1} 张图片`}
              >
                <img src={image} alt="" loading="lazy" />
              </a>
            ))}
          </div>
          {total > 4 && <span className="moment-more moment-more-desktop">+{total - 4}</span>}
          {total > 9 && <span className="moment-more moment-more-mobile">+{total - 9}</span>}
        </div>
      )}

      <div className="moment-foot">
        <span>{commentCount > 0 ? `${commentCount} 条评论` : "暂无评论"}</span>
        <Link href={`/moments#${encodeURIComponent(moment.slug)}`} className="moment-permalink">查看 ↗</Link>
      </div>
    </article>
  );
}
