import { formatDay, type Article } from "../lib/api";
import ArchiveItemCard from "./ArchiveItemCard";

export default function ArticleCard({
  article,
  hrefBase = "/articles",
  showStatus = false,
  layout = "cover",
}: {
  article: Article;
  hrefBase?: string;
  showStatus?: boolean;
  layout?: "cover" | "timeline" | "masonry";
}) {
  const statusLabel =
    article.status === "DRAFT"
      ? "草稿"
      : article.status === "PENDING_REVIEW"
        ? "待审核"
        : article.status === "REJECTED"
          ? "已驳回"
          : article.visibility === "PRIVATE"
            ? "仅管理员"
            : undefined;
  return (
    <ArchiveItemCard
      href={`${hrefBase}/${encodeURIComponent(article.slug)}`}
      title={article.title}
      description={article.summary || article.subtitle || "暂无摘要"}
      label={article.publishedAt ? formatDay(article.publishedAt) : undefined}
      category={(article.categoryPath || article.category)?.split("/").join(" / ")}
      tags={article.tags}
      cornerBadge={showStatus && statusLabel ? statusLabel : undefined}
      media={article.cover ? { kind: "cover", src: article.cover, alt: article.title, fit: "contain" } : undefined}
      layout={layout}
    />
  );
}
