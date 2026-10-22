import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import TimelineClient from "../../components/TimelineClient";
import { getPosts } from "../../lib/server-api";

export const dynamic = "force-dynamic";
export const metadata = { title: "归档" };

export default async function TimelinePage() {
  const posts = await getPosts();

  const tagCounts: Record<string, number> = {};
  posts.forEach((post) => {
    (post.tags || []).forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const tags = Object.keys(tagCounts)
    .map((name) => ({ name, count: tagCounts[name] }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-screen relative pb-32">
      <Navbar />
      <PageTransition>
        <TimelineClient posts={posts} tags={tags} />
      </PageTransition>
    </div>
  );
}
