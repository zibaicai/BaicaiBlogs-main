import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import DirectoryHeader from "../../components/DirectoryHeader";
import DirectoryView from "../../components/DirectoryView";
import PostCard from "../../components/PostCard";
import { getPosts } from "../../lib/server-api";

export const dynamic = "force-dynamic";
export const metadata = { title: "全部文章" };

export default async function PostsPage() {
  const posts = await getPosts();
  const items = posts.map((post) => <PostCard key={post.slug} post={post} />);

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell">
          <DirectoryHeader
            eyebrow="BAICAI / ARCHIVE"
            title="研究档案"
            subtitle="把零散的知识，整理成可被检索的坐标"
            count={`共 ${posts.length} 篇公开记录`}
          />
          <DirectoryView
            items={items}
            empty="暂无公开文章，稍后再来看看吧。"
          />
        </main>
      </PageTransition>
    </div>
  );
}
