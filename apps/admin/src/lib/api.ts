const BASE = "/api";
const TOKEN_KEY = "bc_admin_token";
const USER_KEY = "bc_admin_user";

export const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
export const setToken = (t: string) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));
export const getAdminUser = () => localStorage.getItem(USER_KEY) || "";
export const setAdminUser = (u: string) => (u ? localStorage.setItem(USER_KEY, u) : localStorage.removeItem(USER_KEY));

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  code?: number;
}

export async function request<T = any>(path: string, opts: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers.Authorization = "Bearer " + token;

  const res = await fetch(BASE + path, { ...opts, headers });
  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (res.status === 401 || res.status === 403) {
    setToken("");
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }

  if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
  if (!json) throw new Error("后端返回为空");
  return json;
}

export interface Post {
  id: number;
  slug: string;
  title: string;
  description: string;
  content: string;
  htmlContent: string;
  cover: string;
  date: string;
  status: string;
  visibility?: string;
  views: number;
  tags: string[];
  fileUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: number;
  projectId: string;
  name: string;
  description: string;
  icon: string;
  githubUrl: string;
  tags: string[];
  sortOrder?: number;
  visibility?: string;
}

export interface SiteConfigItem {
  id: number;
  configKey: string;
  configValue: string;
  description: string;
  updatedAt: string;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; username: string; role: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  myPosts: () => request<Post[]>("/admin/posts/mine"),
  myProjects: () => request<Project[]>("/admin/projects/mine"),
  publicPosts: () => request<Post[]>("/public/posts"),

  setPostVisibility: (slug: string, visibility: string) =>
    request<Post>(`/admin/posts/${encodeURIComponent(slug)}/visibility`, {
      method: "PATCH",
      body: JSON.stringify({ visibility }),
    }),

  setProjectVisibility: (projectId: string, visibility: string) =>
    request<Project>(`/admin/projects/${encodeURIComponent(projectId)}/visibility`, {
      method: "PATCH",
      body: JSON.stringify({ visibility }),
    }),

  getAllTags: () => request<string[]>("/admin/posts/all_tags"),
  getMyPostBySlug: (slug: string) => request<Post>(`/admin/posts/${encodeURIComponent(slug)}`),

  createPost: (post: Partial<Post>) =>
    request<Post>("/admin/posts", { method: "POST", body: JSON.stringify(post) }),

  updatePost: (slug: string, post: Partial<Post>) =>
    request<Post>(`/admin/posts/${encodeURIComponent(slug)}`, { method: "PUT", body: JSON.stringify(post) }),

  deletePost: (slug: string) =>
    request<void>(`/admin/posts/${encodeURIComponent(slug)}`, { method: "DELETE" }),

  getAllConfigs: () => request<SiteConfigItem[]>("/public/config"),

  getConfigGroup: <T = any>(group: string) => request<T>(`/public/config/group/${group}`),

  updateConfig: (key: string, configValue: string, description = "") =>
    request<SiteConfigItem>(`/admin/config/${encodeURIComponent(key)}`, {
      method: "PUT",
      body: JSON.stringify({ configKey: key, configValue, description }),
    }),
};
