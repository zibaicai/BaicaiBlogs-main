// 浏览器侧 API 客户端。所有请求都走同源 `/api`，由 Next rewrite（开发）
// 或 nginx（生产）转发到后端，因此不依赖构建期注入的地址。

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  code?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
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
  views: number;
  tags: string[];
  categoryId?: number;
  categoryName?: string;
  categoryPath?: string;
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
  visibility?: string;
}

export interface Chatter {
  id: number;
  slug: string;
  title: string;
  description?: string;
  content: string;
  htmlContent: string;
  mood: string;
  cover: string;
  date: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
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
}

export interface Moment {
  id: number;
  slug: string;
  content: string;
  htmlContent: string;
  date: string;
  images: string[];
  createdAt: string;
  userId?: number;
  authorId?: number;
  authorName?: string;
  authorAvatar?: string;
}

export interface Friend {
  id: number;
  friendId: string;
  name: string;
  url: string;
  description: string;
  avatar: string;
  themeColor: string;
  sortOrder: number;
  createdAt?: string;
}

export interface Photo {
  id: number;
  url: string;
  caption: string;
  sortOrder: number;
}

export interface Album {
  id: number;
  albumId: string;
  title: string;
  description: string;
  cover: string;
  coverThumbUrl?: string;
  coverStandardUrl?: string;
  coverBlurUrl?: string;
  locked?: boolean;
  visibility?: string;
  date: string;
  sortOrder: number;
  photos: Photo[];
}

export interface MusicResponse {
  id: string;
  name?: string;
  artist?: string;
  author?: string;
  cover?: string;
  pic?: string;
  url?: string;
  lrc?: string;
  error?: string;
}

export interface MusicTrack {
  id: number;
  platform: string;
  externalTrackId: string;
  title: string;
  artist?: string;
  cover?: string;
  duration?: number;
  externalUrl?: string;
  status: string;
  accessStatus?: string;
  audioUrl?: string;
  lrcText?: string;
  playable?: boolean;
  unavailableReason?: string;
  unavailableSince?: string;
}

export interface MusicIssue {
  id: number;
  trackId?: number;
  title: string;
  artist?: string;
  issueType: string;
  firstSeenAt: string;
  lastCheckedAt?: string;
  detailVisible: boolean;
}

export interface MusicPlaylist {
  id: number;
  slug: string;
  title: string;
  cover?: string;
  description?: string;
  type: "CURATED" | "PERSONAL";
  visibility: string;
  status: string;
  trackCount: number;
  heatScore: number;
  recommenderName?: string;
  likeCount: number;
  dislikeCount: number;
  favoriteCount: number;
  myReaction?: "LIKE" | "DISLIKE" | null;
  favorited: boolean;
  tracks?: MusicTrack[];
  issues?: MusicIssue[];
  playableCount?: number;
  removedCount?: number;
  vipOnlyCount?: number;
  regionBlockedCount?: number;
  createdAt: string;
}

async function musicRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers as Record<string, string>) },
    ...init,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new Error(json?.message || `请求失败 (${res.status})`);
  return json.data as T;
}

export const musicApi = {
  publicPlaylists: () => musicRequest<MusicPlaylist[]>("/public/music/playlists"),
  publicPlaylist: (slug: string) => musicRequest<MusicPlaylist>(`/public/music/playlists/${encodeURIComponent(slug)}`),
  publicTrack: (id: number) => musicRequest<MusicTrack>(`/public/music/tracks/${id}`),
  myPlaylists: () => musicRequest<MusicPlaylist[]>("/user/music/playlists"),
  createPersonal: (payload: Record<string, unknown>) =>
    musicRequest<MusicPlaylist>("/user/music/playlists", { method: "POST", body: JSON.stringify(payload) }),
  react: (id: number, type: "LIKE" | "DISLIKE") =>
    musicRequest<MusicPlaylist>(`/user/music/playlists/${id}/reaction`, {
      method: "POST",
      body: JSON.stringify({ type }),
    }),
  favorite: (id: number) =>
    musicRequest<MusicPlaylist>(`/user/music/playlists/${id}/favorite`, { method: "POST" }),
  apply: (payload: Record<string, unknown>) =>
    musicRequest<any>("/user/music/applications", { method: "POST", body: JSON.stringify(payload) }),
};

async function publicRequest<T>(path: string): Promise<ApiResponse<T>> {
  const res = await fetch(`/api${path}`, { cache: "no-store" });
  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!res.ok || !json) {
    throw new Error(json?.message || `请求失败 (${res.status})`);
  }
  return json;
}

/**
 * 兼容旧组件的客户端。C 端只保留公开读取能力；
 * 管理端写操作一律在 apps/admin 中完成。
 */
class PublicApiClient {
  private token: string | null = null;

  getToken() {
    return this.token;
  }

  setToken(token: string) {
    this.token = token || null;
  }

  clearToken() {
    this.token = null;
  }

  getAllPosts() {
    return publicRequest<Post[]>("/public/posts");
  }

  getPostBySlug(slug: string) {
    return publicRequest<Post>(`/public/posts/${encodeURIComponent(slug)}`);
  }

  getAllChatters() {
    return publicRequest<Chatter[]>("/public/chatters");
  }

  getAllProjects() {
    return publicRequest<Project[]>("/public/projects");
  }

  getAllAlbums() {
    return publicRequest<Album[]>("/public/albums");
  }

  getAllFriends() {
    return publicRequest<Friend[]>("/public/friends");
  }

  async getMusic(ids: string[]): Promise<MusicResponse[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`/api/public/music?ids=${encodeURIComponent(ids.join(","))}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("音乐接口请求失败");
      return (await res.json()) as MusicResponse[];
    } finally {
      clearTimeout(timer);
    }
  }

  // 旧的配置编辑器方法保留签名，C 端不再使用。
  async getAllConfigs() {
    return publicRequest<Array<{ id: number; configKey: string; configValue: string; description: string; updatedAt: string }>>(
      "/public/config"
    );
  }
}

export const apiClient = new PublicApiClient();

/** 把后端 ISO 时间转成旧组件期望的 `YYYY-MM-DD HH:mm`。 */
export function formatDate(value?: string | null): string {
  if (!value) return "";
  const text = String(value);
  const m = text.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}`;
  return text;
}

export function formatDay(value?: string | null): string {
  return formatDate(value).slice(0, 10);
}
