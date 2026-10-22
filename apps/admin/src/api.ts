const BASE = "/api";
const KEY = "bc_admin_token";
export const getToken = () => localStorage.getItem(KEY) || "";
export const setToken = (t: string) => (t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY));

export async function request(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(opts.headers as any) };
  const token = getToken();
  if (token) headers.Authorization = "Bearer " + token;
  const res = await fetch(BASE + path, { ...opts, headers });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "HTTP " + res.status);
  return json;
}

export const api = {
  login: (u: string, p: string) => request("/auth/login", { method: "POST", body: JSON.stringify({ username: u, password: p }) }),
  me: () => request("/auth/me"),
  myPosts: () => request("/admin/posts/mine"),
  myProjects: () => request("/admin/projects/mine"),
  publicPosts: () => request("/public/posts"),
  setPostVisibility: (slug: string, visibility: string) =>
    request(`/admin/posts/${encodeURIComponent(slug)}/visibility`, { method: "PATCH", body: JSON.stringify({ visibility }) }),
  setProjectVisibility: (id: string, visibility: string) =>
    request(`/admin/projects/${encodeURIComponent(id)}/visibility`, { method: "PATCH", body: JSON.stringify({ visibility }) }),
  deletePost: (slug: string) => request(`/admin/posts/${encodeURIComponent(slug)}`, { method: "DELETE" }),
};