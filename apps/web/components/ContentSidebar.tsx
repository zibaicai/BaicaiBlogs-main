import AuthorCard from "./AuthorCard";
import RecommendedCard from "./RecommendedCard";

export interface ContentSidebarItem {
  title: string;
  href: string;
  date?: string;
}

export default function ContentSidebar({
  items,
  className = "",
}: {
  items: ContentSidebarItem[];
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-5 ${className}`}>
      <AuthorCard />
      <RecommendedCard items={items} />
    </div>
  );
}
