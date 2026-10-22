import Link from "next/link";
import { getPosts } from "@/lib/api";

export const revalidate = 60;
export const metadata = { title: "归档" };

export default async function TimelinePage() {
  const posts = await getPosts();
  const groups = new Map<string, typeof posts>();
  for (const p of posts) {
    const y = (p.date || "").slice(0, 4) || "未知";
    if (!groups.has(y)) groups.set(y, []);
    groups.get(y)!.push(p);
  }
  return (
    <>
      <h1 style={{ marginTop: 28 }}>归档</h1>
      {[...groups.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([year, items]) => (
          <section key={year}>
            <h2>{year}</h2>
            {items.map((p) => (
              <div key={p.id} style={{ margin: "6px 0" }}>
                <span className="muted">{(p.date || "").slice(5, 10)}</span>{" "}
                <Link href={`/posts/${encodeURIComponent(p.slug)}`}>{p.title}</Link>
              </div>
            ))}
          </section>
        ))}
    </>
  );
}
