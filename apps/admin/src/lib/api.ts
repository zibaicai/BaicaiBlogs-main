const BASE = "/api";
const TOKEN_KEY = "bc_admin_token";
const USER_KEY = "bc_admin_user";
const ROLE_KEY = "bc_admin_role";

export const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
export const setToken = (t: string) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));
export const getAdminUser = () => localStorage.getItem(USER_KEY) || "";
export const setAdminUser = (u: string) => (u ? localStorage.setItem(USER_KEY, u) : localStorage.removeItem(USER_KEY));
export const getAdminRole = () => localStorage.getItem(ROLE_KEY) || "";
export const setAdminRole = (r: string) => (r ? localStorage.setItem(ROLE_KEY, r) : localStorage.removeItem(ROLE_KEY));

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

export interface Moment {
  id: number;
  slug: string;
  content: string;
  htmlContent: string;
  date: string;
  images: string[];
  userId?: number;
  status: "DRAFT" | "PUBLISHED" | string;
  visibility: "PUBLIC" | "PRIVATE" | string;
  createdAt?: string;
}

export interface Chatter {
  id: number;
  slug: string;
  title: string;
  content: string;
  htmlContent: string;
  mood: string;
  cover: string;
  date: string;
  tags: string[];
  userId?: number;
  status: "DRAFT" | "PUBLISHED" | string;
  visibility: "PUBLIC" | "PRIVATE" | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Tag {
  id: number;
  name: string;
  status: string;
  requestedBy?: number;
  approvedBy?: number;
  reviewNote?: string;
  createdAt?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId?: number | null;
  path: string;
  depth: number;
  sort: number;
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
  createProject: (project: Partial<Project>) =>
    request<Project>("/admin/projects", { method: "POST", body: JSON.stringify(project) }),
  updateProject: (projectId: string, project: Partial<Project>) =>
    request<Project>(`/admin/projects/${encodeURIComponent(projectId)}`, {
      method: "PUT",
      body: JSON.stringify(project),
    }),
  deleteProject: (projectId: string) =>
    request<void>(`/admin/projects/${encodeURIComponent(projectId)}`, { method: "DELETE" }),
  getOverview: () => request<any>("/admin/overview"),
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

  getCategories: () => request<Category[]>("/admin/categories"),
  createCategory: (category: Partial<Category>) =>
    request<Category>("/admin/categories", { method: "POST", body: JSON.stringify(category) }),
  updateCategory: (id: number, category: Partial<Category>) =>
    request<Category>(`/admin/categories/${id}`, { method: "PUT", body: JSON.stringify(category) }),
  deleteCategory: (id: number) =>
    request<void>(`/admin/categories/${id}`, { method: "DELETE" }),

  getTags: () => request<Tag[]>("/admin/tags"),
  getPendingTags: () => request<Tag[]>("/admin/tags/pending"),
  createTag: (name: string) =>
    request<Tag>("/admin/tags", { method: "POST", body: JSON.stringify({ name }) }),
  approveTag: (id: number) =>
    request<Tag>(`/admin/tags/${id}/approve`, { method: "POST" }),
  rejectTag: (id: number, note: string) =>
    request<Tag>(`/admin/tags/${id}/reject?note=${encodeURIComponent(note)}`, { method: "POST" }),
  recommendTags: (categoryId?: number) =>
    request<string[]>(`/admin/tags/recommend${categoryId ? `?categoryId=${categoryId}` : ""}`),

  myMoments: () => request<Moment[]>("/admin/moments/mine"),
  createMoment: (moment: Partial<Moment>) =>
    request<Moment>("/admin/moments", { method: "POST", body: JSON.stringify(moment) }),
  updateMoment: (slug: string, moment: Partial<Moment>) =>
    request<Moment>(`/admin/moments/${encodeURIComponent(slug)}`, { method: "PUT", body: JSON.stringify(moment) }),
  deleteMoment: (slug: string) =>
    request<void>(`/admin/moments/${encodeURIComponent(slug)}`, { method: "DELETE" }),
  getPrivateMoments: (reason: string) =>
    request<Moment[]>(`/admin/moments/private?reason=${encodeURIComponent(reason)}`),
  myChatters: () => request<Chatter[]>("/admin/chatters/mine"),
  createChatter: (chatter: Partial<Chatter>) =>
    request<Chatter>("/admin/chatters", { method: "POST", body: JSON.stringify(chatter) }),
  updateChatter: (slug: string, chatter: Partial<Chatter>) =>
    request<Chatter>(`/admin/chatters/${encodeURIComponent(slug)}`, { method: "PUT", body: JSON.stringify(chatter) }),
  deleteChatter: (slug: string) =>
    request<void>(`/admin/chatters/${encodeURIComponent(slug)}`, { method: "DELETE" }),
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

  uploadImage: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<string>("/admin/images", { method: "POST", body: form });
  },

  uploadBackground: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<string>("/admin/backgrounds", { method: "POST", body: form });
  },

  repairPost: (slug: string) =>
    request<Post>(`/admin/posts/${encodeURIComponent(slug)}/repair`, { method: "POST" }),

  deletePost: (slug: string) =>
    request<void>(`/admin/posts/${encodeURIComponent(slug)}`, { method: "DELETE" }),

  getAllConfigs: () => request<SiteConfigItem[]>("/admin/config"),

  getConfigGroup: <T = any>(group: string) => request<T>(`/admin/config/group/${group}`),

  sensitiveAccessRequests: () => request<any[]>("/admin/sensitive-access"),
  requestSensitiveAccess: (resourceType: string, reason: string) =>
    request<any>("/admin/sensitive-access", {
      method: "POST",
      body: JSON.stringify({ resourceType, reason }),
    }),
  approveSensitiveAccess: (id: number) =>
    request<any>(`/admin/sensitive-access/${id}/approve`, { method: "POST" }),
  rejectSensitiveAccess: (id: number) =>
    request<any>(`/admin/sensitive-access/${id}/reject`, { method: "POST" }),

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

  adminArticles: () => request<any[]>("/admin/articles"),
  adminArticle: (id: number) => request<any>(`/admin/articles/${id}`),
  createArticle: (payload: any) => request<any>("/admin/articles", { method: "POST", body: JSON.stringify(payload) }),
  updateArticle: (id: number, payload: any) =>
    request<any>(`/admin/articles/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteArticle: (id: number) => request<void>(`/admin/articles/${id}`, { method: "DELETE" }),
  uploadArticleImage: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<string>("/admin/articles/images", { method: "POST", body: form });
  },

  adminSuggestions: (status?: string) =>    request<any[]>(`/admin/suggestions${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  adminSuggestion: (id: number) => request<any>(`/admin/suggestions/${id}`),
  reviewSuggestion: (id: number, payload: any) =>
    request<any>(`/admin/suggestions/${id}/review`, { method: "POST", body: JSON.stringify(payload) }),
  adminSuggestionImage: async (id: number) => {
    const token = getToken();
    const response = await fetch(`/api/admin/suggestions/images/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return URL.createObjectURL(await response.blob());
  },

  adminMusicPlaylists: () => request<any[]>("/admin/music/playlists"),  adminMusicApplications: () => request<any[]>("/admin/music/applications"),
  createMusicPlaylist: (payload: any) =>
    request<any>("/admin/music/playlists", { method: "POST", body: JSON.stringify(payload) }),
  importMusicPlaylist: (externalPlaylistId: string) =>
    request<any>(`/admin/music/playlists/import?externalPlaylistId=${encodeURIComponent(externalPlaylistId)}`, { method: "POST" }),
  upsertMusicTrack: (payload: any) =>
    request<any>("/admin/music/tracks", { method: "POST", body: JSON.stringify(payload) }),
  reviewMusicApplication: (id: number, approve: boolean, note = "") =>
    request<any>(`/admin/music/applications/${id}/review?approve=${approve}&note=${encodeURIComponent(note)}`, { method: "POST" }),
  setMusicPlaylistStatus: (id: number, status: string) =>
    request<any>(`/admin/music/playlists/${id}/status?status=${encodeURIComponent(status)}`, { method: "POST" }),
  setMusicPlaylistTracks: (id: number, trackIds: number[]) =>
    request<any>(`/admin/music/playlists/${id}/tracks`, { method: "PUT", body: JSON.stringify({ trackIds }) }),
  deleteComment: (id: number) => request<void>(`/admin/comments/${id}`, { method: "DELETE" }),
  hideComment: (id: number) => request<void>(`/admin/comments/${id}/hide`, { method: "POST" }),
  restoreComment: (id: number) => request<void>(`/admin/comments/${id}/restore`, { method: "POST" }),
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
