import { formatDay, type Article } from "../lib/api";
import ArchiveItemCard from "./ArchiveItemCard";

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <ArchiveItemCard
      href={`/articles/${encodeURIComponent(article.slug)}`}
      title={article.title}
      description={article.summary || article.subtitle || "暂无摘要"}
      label={article.publishedAt ? formatDay(article.publishedAt) : undefined}
      category={(article.categoryPath || article.category)?.split("/").join(" / ")}
      tags={article.tags}
      media={article.cover ? { kind: "cover", src: article.cover, alt: article.title, fit: "contain" } : undefined}
    />
  );
}
