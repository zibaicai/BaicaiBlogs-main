"use client";

import DirectoryExplorer from "./DirectoryExplorer";
import PostCard from "./PostCard";
import type { Post } from "../lib/api";

interface TimelineTag {
  name: string;
  count: number;
}

export default function TimelineClient({
  posts,
  tags,
}: {
  posts: Post[];
  tags: TimelineTag[];
}) {
  const items = posts.map((post) => ({
    key: post.slug,
    node: <PostCard key={post.slug} post={post} />,
    searchText: [post.title, post.description, ...(post.tags || [])].join(" "),
    filterValues: post.tags || [],
  }));

  const filters = [
    { value: "all", label: "全部档案", count: posts.length },
    ...tags.map((tag) => ({ value: tag.name, label: tag.name, count: tag.count })),
  ];

  return (
    <div className="directory-shell">
      <DirectoryExplorer
        eyebrow="BAICAI / TIMELINE"
        title="时间档案"
        subtitle="沿着时间线，打捞那些发过光的片段。"
        count={`总共 ${posts.length} 篇`}
        items={items}
        filters={filters}
        views={["grid", "timeline", "masonry"]}
        compact
        gridVariant="cover"
        columns={{ base: 1, sm: 2, lg: 3, xl: 4 }}
        pageSize={12}
        searchPlaceholder="搜索标题、标签或关键词..."
        initialMode="timeline"
        empty="这个频道没有接收到任何信号 📡"
      />
    </div>
  );
}
