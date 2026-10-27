import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import DirectoryExplorer from "../../components/DirectoryExplorer";
import PostCard from "../../components/PostCard";
import { getCategories, getPosts } from "../../lib/server-api";

export const dynamic = "force-dynamic";
export const metadata = { title: "笔记档案" };

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const initialPage = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const [posts, categories] = await Promise.all([getPosts(), getCategories()]);
  const roots = categories.filter((category) => category.depth === 1);
  const rootByPost = (categoryPath?: string) =>
    roots.find((root) => categoryPath === root.path || categoryPath?.startsWith(`${root.path}/`));

  const rootsWithResources = roots
    .map((root) => ({
      root,
      count: posts.filter((post) => rootByPost(post.categoryPath)?.id === root.id).length,
    }))
    .filter((item) => item.count > 0);

  const filters = [
    { value: "all", label: "全部档案", count: posts.length },
    ...rootsWithResources.map(({ root, count }) => ({
      value: `category-${root.id}`,
      label: root.path,
      count,
    })),
  ];

  const items = posts.map((post) => {
    const root = rootByPost(post.categoryPath);
    return {
      key: post.slug,
      node: <PostCard key={post.slug} post={post} />,
      searchText: [post.title, post.description, post.categoryPath, ...(post.tags || [])].join(" "),
      filterValues: root ? [`category-${root.id}`] : [],
      title: post.title,
      tags: post.tags,
      date: post.date,
      updatedAt: post.updatedAt,
    };
  });

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell">
          <DirectoryExplorer
            eyebrow="BAICAI / WRITING"
            title="笔记档案"
            subtitle="写代码，也写代码之外的事。"
            count={`共 ${posts.length} 篇记录`}
            items={items}
            filters={filters}
            views={["grid", "timeline", "masonry"]}
            featuredFirst
            compact
            gridClassName="cover-grid"
            pageSize={12}
            initialPage={initialPage}
            defaultSort="newest"
            searchPlaceholder="搜索标题、摘要、分类或标签..."
            empty="还没有写下第一篇。"
          />
        </main>
      </PageTransition>
    </div>
  );
}
