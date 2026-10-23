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
  const isFormData = typeof FormData !== "undefined" && opts.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
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

export interface GalleryPhoto {
  id: number;
  albumId: number;
  url: string;
  thumbUrl: string;
  standardUrl: string;
  originalUrl: string;
  caption: string;
  weight: number;
  width: number;
  height: number;
  bytes: number;
  mime: string;
  status: string;
  reportCount: number;
}

export interface GalleryAlbum {
  id: number;
  albumId: string;
  userId: number;
  title: string;
  description: string;
  visibility: "PUBLIC" | "PASSWORD" | "PRIVATE" | string;
  hasPassword: boolean;
  status: string;
  photoCount: number | null;
  coverThumbUrl: string | null;
  coverStandardUrl: string | null;
  coverBlurUrl: string | null;
  locked?: boolean;
  isOwner?: boolean;
  hidePhotoCount?: boolean;
  ownerLabel?: string | null;
  grantExpiresAt?: number | null;
  reportCount: number;
  photos?: GalleryPhoto[];
}

export interface PresignResult {
  key: string;
  uploadUrl: string;
  publicUrl: string;
  expiresAt: number;
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),

  login: (username: string, password: string) =>
    request<{ token: string; username: string; role: string }>("/auth/login?cookie=true", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ username, password }),
    }),

  logout: () => request<void>("/auth/logout", { method: "POST", credentials: "include" }),
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

  uploadPost: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<Post>("/admin/posts/upload", { method: "POST", body: form });
  },

  repairPost: (slug: string) =>
    request<Post>(`/admin/posts/${encodeURIComponent(slug)}/repair`, { method: "POST" }),

  deletePost: (slug: string) =>
    request<void>(`/admin/posts/${encodeURIComponent(slug)}`, { method: "DELETE" }),

  getAllConfigs: () => request<SiteConfigItem[]>("/public/config"),

  getConfigGroup: <T = any>(group: string) => request<T>(`/public/config/group/${group}`),

  updateConfig: (key: string, configValue: string, description = "") =>
    request<SiteConfigItem>(`/admin/config/${encodeURIComponent(key)}`, {
      method: "PUT",
      body: JSON.stringify({ configKey: key, configValue, description }),
    }),

  // ===== 图片墙 =====
  myAlbums: () => request<GalleryAlbum[]>("/user/albums"),

  createAlbum: (payload: any) =>
    request<GalleryAlbum>("/user/albums", { method: "POST", body: JSON.stringify(payload) }),

  updateAlbum: (albumId: string, payload: any) =>
    request<GalleryAlbum>(`/user/albums/${encodeURIComponent(albumId)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteAlbum: (albumId: string) =>
    request<void>(`/user/albums/${encodeURIComponent(albumId)}`, { method: "DELETE" }),

  presignPhotos: (albumId: string, files: Array<{ name: string; type: string; size: number }>) =>
    request<PresignResult[]>(`/user/albums/${encodeURIComponent(albumId)}/photos/presign`, {
      method: "POST",
      body: JSON.stringify(files),
    }),

  confirmPhotos: (albumId: string, photos: any[]) =>
    request<GalleryPhoto[]>(`/user/albums/${encodeURIComponent(albumId)}/photos/confirm`, {
      method: "POST",
      body: JSON.stringify({ photos }),
    }),

  reorderPhotos: (albumId: string, items: Array<{ photoId: number; weight: number }>) =>
    request<void>(`/user/albums/${encodeURIComponent(albumId)}/photos/order`, {
      method: "PATCH",
      body: JSON.stringify({ items }),
    }),

  deletePhoto: (id: number) => request<void>(`/user/photos/${id}`, { method: "DELETE" }),

  adminReports: () => request<any[]>("/admin/reports"),
  adminDanmaku: () => request<any[]>("/admin/danmaku"),
  deleteDanmaku: (id: number) => request<void>(`/admin/danmaku/${id}`, { method: "DELETE" }),
  requestAccess: (albumId: string, reason: string) =>
    request<any>(`/admin/albums/${encodeURIComponent(albumId)}/access-requests`, { method: "POST", body: JSON.stringify({ reason }) }),
  accessRequests: () => request<any[]>("/admin/access-requests"),
  approveAccess: (id: number) => request<any>(`/admin/access-requests/${id}/approve`, { method: "POST" }),
  rejectAccess: (id: number) => request<void>(`/admin/access-requests/${id}/reject`, { method: "POST" }),
  accessGrants: () => request<any[]>("/admin/access-grants"),
  auditLogs: () => request<any[]>("/admin/audit"),
  ownerAccessLogs: (albumId: string) => request<any[]>(`/user/albums/${encodeURIComponent(albumId)}/access-logs`),
  banUser: (id: number, reason: string) =>
    request<void>(`/admin/users/${id}/ban?reason=${encodeURIComponent(reason)}`, { method: "POST" }),
  unbanUser: (id: number) => request<void>(`/admin/users/${id}/unban`, { method: "POST" }),
  deleteReports: (ids: number[]) =>
    request<void>(`/admin/reports?ids=${ids.join(",")}`, { method: "DELETE" }),
  adminAppeals: () => request<any[]>("/admin/appeals"),
  handleAppeal: (id: number, action: string) =>
    request<void>(`/admin/appeals/${id}/handle?action=${encodeURIComponent(action)}`, { method: "POST" }),
  reopenAppeal: (id: number) => request<void>(`/admin/appeals/${id}/reopen?note=管理组复核`, { method: "POST" }),
  ipBans: () => request<any[]>("/admin/ip-bans"),
  banIp: (ip: string, reason: string) =>
    request<any>(`/admin/ip-bans?ip=${encodeURIComponent(ip)}&reason=${encodeURIComponent(reason)}`, { method: "POST" }),
  unbanIp: (id: number) => request<void>(`/admin/ip-bans/${id}`, { method: "DELETE" }),
  exportReports: async (ids: number[]) => {
    const res = await fetch(`/api/admin/reports/export?ids=${ids.join(",")}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error(`导出失败 (${res.status})`);
    return res.blob();
  },
  resolveReport: (id: number, action: string) =>
    request<void>(`/admin/reports/${id}/resolve?action=${encodeURIComponent(action)}`, { method: "POST" }),
};

export async function uploadToOss(url: string, file: File, onProgress?: (percent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`OSS HTTP ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("OSS 上传网络错误"));
    xhr.send(file);
  });
}
