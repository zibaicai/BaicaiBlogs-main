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
  authorId?: number;
  authorName?: string;
  authorAvatar?: string;
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
  const fallbackAuthor = moment.authorName || "\u533f\u540d\u7528\u6237";

  return (
    <article className="moment-card" id={moment.slug}>
      <div className="moment-head">
        <div className="moment-author">
          <span className="moment-avatar">
            {moment.authorAvatar ? <img src={moment.authorAvatar} alt="" /> : fallbackAuthor.slice(0, 1)}
          </span>
          <strong>{fallbackAuthor}</strong>
        </div>
        <time>{formatDate(moment.date)}</time>
        {moment.visibility === "PRIVATE" && (
          <span className="archive-badge archive-badge-sky"><Lock size={9} /> {"\u4ec5\u81ea\u5df1\u53ef\u89c1"}</span>
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
                aria-label={`View image ${index + 1}`}
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
        <span>{commentCount > 0 ? `${commentCount} \u6761\u8bc4\u8bba` : "\u6682\u65e0\u8bc4\u8bba"}</span>
        <Link href={`/moments/${encodeURIComponent(moment.slug)}`} className="moment-permalink">{"\u67e5\u770b \u2192"}</Link>
      </div>
    </article>
  );
}
