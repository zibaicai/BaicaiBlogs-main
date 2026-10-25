import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import DirectoryExplorer from "../../components/DirectoryExplorer";
import PostCard from "../../components/PostCard";
import { getCategories, getPosts } from "../../lib/server-api";

export const dynamic = "force-dynamic";
export const metadata = { title: "全部文章" };

export default async function PostsPage() {
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
    };
  });

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
            searchPlaceholder="搜索标题、摘要、分类或标签..."
            empty="没有匹配的研究记录。"
          />
        </main>
      </PageTransition>
    </div>
  );
}
