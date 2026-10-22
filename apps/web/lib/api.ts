// 服务端同源访问内部 API；浏览器侧所有请求都走本应用自身的 /api 代理（见 next.config rewrites）
const BASE = process.env.API_INTERNAL || "http://127.0.0.1:8080";

export type Post = {
  id: number; slug: string; title: string; description?: string;
  htmlContent?: string; date?: string; tags?: string[]; cover?: string;
};
export type Project = { id: number; projectId: string; name: string; description?: string; githubUrl?: string; tags?: string[] };

async function json(url: string) {
  const r = await fetch(url, { next: { revalidate: 60 } });
  return r.json().catch(() => null);
}
export async function getPosts(): Promise<Post[]> {
  const j = await json(`${BASE}/api/public/posts`);
  return (j && j.data) || [];
}
export async function getPost(slug: string): Promise<Post | null> {
  const j = await json(`${BASE}/api/public/posts/${encodeURIComponent(slug)}`);
  return j && j.success ? j.data : null;
}
export async function getProjects(): Promise<Project[]> {
  const j = await json(`${BASE}/api/public/projects`);
  return (j && j.data) || [];
}
