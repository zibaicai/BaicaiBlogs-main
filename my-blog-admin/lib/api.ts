const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

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

export interface Post {
  id: number;
  /** URL 友好的唯一标识 */
  slug: string;
  title: string;
  description: string;
  /** Markdown 原文 */
  content: string;
  /** 渲染后的 HTML */
  htmlContent: string;
  cover: string;
  /** ISO 日期字符串 */
  date: string;
  status: string;
  views: number;
  /** 标签列表，例如 ["React","Spring Boot"] */
  tags: string[];
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface Moment {
  id: number;
  slug: string;
  content: string;
  htmlContent: string;
  date: string;
  images: string[];
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

export interface Friend {
  id: number;
  friendId: string;
  name: string;
  url: string;
  description: string;
  avatar: string;
  themeColor: string;
  sortOrder: number;
}

export interface Album {
  id: number;
  albumId: string;
  title: string;
  description: string;
  cover: string;
  date: string;
  sortOrder: number;
  photos: Photo[];
}

export interface Photo {
  id: number;
  url: string;
  caption: string;
  sortOrder: number;
}

export interface SiteConfig {
  id: number;
  configKey: string;
  configValue: string;
  description: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  postId: number;
  chatterId: number;
  momentId: number;
  author: string;
  email: string;
  content: string;
  avatar: string;
  status: string;
  createdAt: string;
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

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  username: string;
  role: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    requiresAuth = false
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      // 每次请求时从 localStorage 重新读取 token，避免 SSR 时 constructor 未获取到
      if (typeof window !== 'undefined' && !this.token) {
        this.token = localStorage.getItem('auth_token');
      }
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json() as ApiResponse<T>;

      if (!response.ok) {
        throw new Error(data.message || `请求失败 (${response.status})`);
      }

      // 401 或 403 都表示认证失败，清除 token 并跳转
      if (requiresAuth && (response.status === 401 || response.status === 403)) {
        this.clearToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/admin';
        }
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络错误');
    }
  }

  // Auth API
  async login(request: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('POST', '/api/auth/login', request);
  }

  async register(request: LoginRequest): Promise<ApiResponse<void>> {
    return this.request<void>('POST', '/api/auth/register', request);
  }

  // Public API - Posts
  async getPosts(page = 0, size = 10): Promise<ApiResponse<PageResponse<Post>>> {
    return this.request<PageResponse<Post>>('GET', `/api/public/posts/page?page=${page}&size=${size}`);
  }

  async getAllPosts(): Promise<ApiResponse<Post[]>> {
    return this.request<Post[]>('GET', '/api/public/posts');
  }

  async getPostBySlug(slug: string): Promise<ApiResponse<Post>> {
    return this.request<Post>('GET', `/api/public/posts/${slug}`);
  }

  async searchPosts(keyword: string): Promise<ApiResponse<Post[]>> {
    return this.request<Post[]>('GET', `/api/public/posts/search?keyword=${encodeURIComponent(keyword)}`);
  }

  // Public API - Chatters
  async getChatters(page = 0, size = 10): Promise<ApiResponse<PageResponse<Chatter>>> {
    return this.request<PageResponse<Chatter>>('GET', `/api/public/chatters/page?page=${page}&size=${size}`);
  }

  async getAllChatters(): Promise<ApiResponse<Chatter[]>> {
    return this.request<Chatter[]>('GET', '/api/public/chatters');
  }

  async getChatterBySlug(slug: string): Promise<ApiResponse<Chatter>> {
    return this.request<Chatter>('GET', `/api/public/chatters/${slug}`);
  }

  // Public API - Moments
  async getAllMoments(): Promise<ApiResponse<Moment[]>> {
    return this.request<Moment[]>('GET', '/api/public/moments');
  }

  // Public API - Projects
  async getAllProjects(): Promise<ApiResponse<Project[]>> {
    return this.request<Project[]>('GET', '/api/public/projects');
  }

  // Admin API - My Projects (当前登录用户)
  async getMyProjects(): Promise<ApiResponse<Project[]>> {
    return this.request<Project[]>('GET', '/api/admin/projects/mine', undefined, true);
  }

  // Public API - Friends
  async getAllFriends(): Promise<ApiResponse<Friend[]>> {
    return this.request<Friend[]>('GET', '/api/public/friends');
  }

  // Public API - Albums
  async getAllAlbums(): Promise<ApiResponse<Album[]>> {
    return this.request<Album[]>('GET', '/api/public/albums');
  }

  // Public API - Site Config
  async getAllConfigs(): Promise<ApiResponse<SiteConfig[]>> {
    return this.request<SiteConfig[]>('GET', '/api/public/config');
  }

  async getConfigByKey(key: string): Promise<ApiResponse<SiteConfig>> {
    return this.request<SiteConfig>('GET', `/api/public/config/${key}`);
  }

  // Public API - Music
  async getMusic(ids: string[]): Promise<MusicResponse[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/music?ids=${encodeURIComponent(ids.join(','))}`);
      if (!response.ok) throw new Error('音乐接口请求失败');
      return await response.json() as MusicResponse[];
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('网络错误');
    }
  }

  // Public API - Comments
  async getCommentsByPostId(postId: number): Promise<ApiResponse<Comment[]>> {
    return this.request<Comment[]>('GET', `/api/public/comments?postId=${postId}`);
  }

  async getCommentsByChatterId(chatterId: number): Promise<ApiResponse<Comment[]>> {
    return this.request<Comment[]>('GET', `/api/public/comments?chatterId=${chatterId}`);
  }

  async createComment(request: Omit<Comment, 'id' | 'status' | 'createdAt'>): Promise<ApiResponse<Comment>> {
    return this.request<Comment>('POST', '/api/public/comments', request);
  }

  // Admin API - Posts
  /**
   * 获取当前登录用户的已发布文章列表
   * 用于时间线页面展示该用户自己的文章
   * 需要携带 JWT token 认证
   */
  async getMyPosts(): Promise<ApiResponse<Post[]>> {
    return this.request<Post[]>('GET', '/api/admin/posts/mine', undefined, true);
  }

  /**
   * 获取当前登录用户所有文章中出现过的 tag 集合（去重）
   * 用于编辑器标签历史提示功能
   */
  async getAllTags(): Promise<ApiResponse<string[]>> {
    return this.request<string[]>('GET', '/api/admin/posts/all_tags', undefined, true);
  }

  /**
   * 按 slug 获取当前登录用户的单篇文章（编辑器加载用）
   * 不限发布状态，DRAFT 也能获取
   */
  async getMyPostBySlug(slug: string): Promise<ApiResponse<Post>> {
    return this.request<Post>('GET', `/api/admin/posts/${encodeURIComponent(slug)}`, undefined, true);
  }

  /**
   * 上传 Markdown 文件并导入为文章
   * 后端解析 frontmatter（title/date/tags/cover/description）并存入数据库
   * 如果 slug（文件名）已存在则更新，否则创建新文章
   *
   * @param file 用户选择的 .md 文件
   */
  async uploadPost(file: File): Promise<ApiResponse<Post>> {
    // 使用 FormData 包装文件，以 multipart/form-data 格式上传
    const formData = new FormData();
    formData.append('file', file);

    // 手动构建请求（不使用 this.request，因为 body 是 FormData 不是 JSON）
    const token = this.getToken();
    if (!token) {
      return { success: false, message: '未登录', code: 401, data: null as any };
    }

    const API_BASE_URL = 'http://localhost:8080';
    const res = await fetch(`${API_BASE_URL}/api/admin/posts/upload`, {
      method: 'POST',
      headers: {
        // FormData 请求不要手动设置 Content-Type，浏览器会自动设置 boundary
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (res.status === 401 || res.status === 403) {
      this.clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return { success: false, message: '登录已过期', code: res.status, data: null as any };
    }

    return res.json();
  }

  async createPost(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'htmlContent'>): Promise<ApiResponse<Post>> {
    return this.request<Post>('POST', '/api/admin/posts', post, true);
  }

  async updatePost(slug: string, post: Partial<Post>): Promise<ApiResponse<Post>> {
    return this.request<Post>('PUT', `/api/admin/posts/${slug}`, post, true);
  }

  async deletePost(slug: string): Promise<ApiResponse<void>> {
    return this.request<void>('DELETE', `/api/admin/posts/${slug}`, undefined, true);
  }

  // Admin API - Chatters
  async createChatter(chatter: Omit<Chatter, 'id' | 'createdAt' | 'updatedAt' | 'htmlContent'>): Promise<ApiResponse<Chatter>> {
    return this.request<Chatter>('POST', '/api/admin/chatters', chatter, true);
  }

  async updateChatter(slug: string, chatter: Partial<Chatter>): Promise<ApiResponse<Chatter>> {
    return this.request<Chatter>('PUT', `/api/admin/chatters/${slug}`, chatter, true);
  }

  async deleteChatter(slug: string): Promise<ApiResponse<void>> {
    return this.request<void>('DELETE', `/api/admin/chatters/${slug}`, undefined, true);
  }

  // Admin API - Moments
  async createMoment(moment: Omit<Moment, 'id' | 'createdAt' | 'updatedAt' | 'htmlContent'>): Promise<ApiResponse<Moment>> {
    return this.request<Moment>('POST', '/api/admin/moments', moment, true);
  }

  async updateMoment(slug: string, moment: Partial<Moment>): Promise<ApiResponse<Moment>> {
    return this.request<Moment>('PUT', `/api/admin/moments/${slug}`, moment, true);
  }

  async deleteMoment(slug: string): Promise<ApiResponse<void>> {
    return this.request<void>('DELETE', `/api/admin/moments/${slug}`, undefined, true);
  }

  // Admin API - Projects
  async createProject(project: Omit<Project, 'id'>): Promise<ApiResponse<Project>> {
    return this.request<Project>('POST', '/api/admin/projects', project, true);
  }

  async updateProject(projectId: string, project: Partial<Project>): Promise<ApiResponse<Project>> {
    return this.request<Project>('PUT', `/api/admin/projects/${projectId}`, project, true);
  }

  async deleteProject(projectId: string): Promise<ApiResponse<void>> {
    return this.request<void>('DELETE', `/api/admin/projects/${projectId}`, undefined, true);
  }

  // Admin API - Friends
  async createFriend(friend: Omit<Friend, 'id'>): Promise<ApiResponse<Friend>> {
    return this.request<Friend>('POST', '/api/admin/friends', friend, true);
  }

  async updateFriend(friendId: string, friend: Partial<Friend>): Promise<ApiResponse<Friend>> {
    return this.request<Friend>('PUT', `/api/admin/friends/${friendId}`, friend, true);
  }

  async deleteFriend(friendId: string): Promise<ApiResponse<void>> {
    return this.request<void>('DELETE', `/api/admin/friends/${friendId}`, undefined, true);
  }

  // Admin API - Albums
  async createAlbum(album: Omit<Album, 'id'>): Promise<ApiResponse<Album>> {
    return this.request<Album>('POST', '/api/admin/albums', album, true);
  }

  async updateAlbum(albumId: string, album: Partial<Album>): Promise<ApiResponse<Album>> {
    return this.request<Album>('PUT', `/api/admin/albums/${albumId}`, album, true);
  }

  async deleteAlbum(albumId: string): Promise<ApiResponse<void>> {
    return this.request<void>('DELETE', `/api/admin/albums/${albumId}`, undefined, true);
  }

  // Admin API - Site Config
  async createConfig(config: Omit<SiteConfig, 'id' | 'updatedAt'>): Promise<ApiResponse<SiteConfig>> {
    return this.request<SiteConfig>('POST', '/api/admin/config', config, true);
  }

  async updateConfig(key: string, config: Partial<SiteConfig>): Promise<ApiResponse<SiteConfig>> {
    return this.request<SiteConfig>('PUT', `/api/admin/config/${key}`, config, true);
  }

  async deleteConfig(key: string): Promise<ApiResponse<void>> {
    return this.request<void>('DELETE', `/api/admin/config/${key}`, undefined, true);
  }
}

export const apiClient = new ApiClient();

export function getApiClient() {
  return apiClient;
}
