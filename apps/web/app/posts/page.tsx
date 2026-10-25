import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import DirectoryExplorer from "../../components/DirectoryExplorer";
import PostCard from "../../components/PostCard";
import { getPosts } from "../../lib/server-api";

export const dynamic = "force-dynamic";
export const metadata = { title: "全部文章" };

export default async function PostsPage() {
  const posts = await getPosts();

  const tagCounts: Record<string, number> = {};
  posts.forEach((post) => {
    (post.tags || []).forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const filters = [
    { value: "all", label: "全部档案", count: posts.length },
    ...Object.keys(tagCounts)
      .map((tag) => ({ value: tag, label: tag, count: tagCounts[tag] }))
      .sort((a, b) => b.count - a.count),
  ];

  const items = posts.map((post) => ({
    key: post.slug,
    node: <PostCard key={post.slug} post={post} />,
    searchText: [post.title, post.description, ...(post.tags || [])].join(" "),
    filterValues: post.tags || [],
  }));

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell">
          <DirectoryExplorer
            eyebrow="BAICAI / ARCHIVE"
            title="研究档案"
            subtitle="把走过的路，写成一页页可以回望的云。"
            count={`共 ${posts.length} 篇公开记录`}
            items={items}
            filters={filters}
            searchPlaceholder="搜索标题、摘要或标签..."
            empty="没有匹配的研究记录。"
          />
        </main>
      </PageTransition>
    </div>
  );
}
