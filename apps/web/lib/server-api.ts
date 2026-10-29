// 服务端数据读取：直接访问内网后端，避免浏览器跨域；带 60s ISR 缓存。
import { cookies } from "next/headers";
import { isScopedPath } from "./content-scope";
import type { Album, Category, Friend, FriendMessage, Moment, Post, Project, RoomProfile } from "./api";
import {
  DEFAULT_AI_CONFIG,
  DEFAULT_BACKGROUND,
  DEFAULT_DANMAKU,
  DEFAULT_MISC,
  DEFAULT_SITE_INFO,
  type AiConfig,
  type BackgroundConfig,
  type MiscConfig,
  type SiteInfo,
} from "./site-config";

const INTERNAL_BASE = (
  process.env.API_INTERNAL ||
  process.env.NEXT_PUBLIC_API_INTERNAL ||
  "http://127.0.0.1:8080"
).replace(/\/+$/, "");

async function getJson<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const cookieStore = await cookies();
    const mine = cookieStore.get("content-scope")?.value === "mine";
    const scopedPath =
      mine && isScopedPath(path)
        ? `${path}${path.includes("?") ? "&" : "?"}scope=mine`
        : path;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (mine) {
      const token = cookieStore.get("BC_TOKEN")?.value;
      if (token) headers.Cookie = `BC_TOKEN=${token}`;
    }
    const res = mine
      ? await fetch(`${INTERNAL_BASE}${scopedPath}`, { cache: "no-store", headers })
      : await fetch(`${INTERNAL_BASE}${scopedPath}`, {
          next: { revalidate },
          headers,
        });
    if (!res.ok) return null;
    const json = (await res.json()) as { success?: boolean; data?: T };
    if (json?.success === false) return null;
    return (json?.data ?? null) as T | null;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<{ username: string; nickname?: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("BC_TOKEN")?.value;
    if (!token) return null;
    const res = await fetch(`${INTERNAL_BASE}/api/auth/me`, {
      cache: "no-store",
      headers: { Accept: "application/json", Cookie: `BC_TOKEN=${token}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { success?: boolean; data?: { username: string; nickname?: string } };
    return json?.success === false ? null : json?.data ?? null;
  } catch {
    return null;
  }
}

function sortByDate<T extends { date?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export async function getPosts(): Promise<Post[]> {
  const data = await getJson<Post[]>("/api/public/posts");
  return sortByDate(data || []);
}

export async function getPost(slug: string): Promise<Post | null> {
  return getJson<Post>(`/api/public/posts/${encodeURIComponent(slug)}`, 30);
}

export async function getRooms(): Promise<RoomProfile[]> {
  const data = await getJson<RoomProfile[]>("/api/public/rooms", 0);
  return data || [];
}

export async function getRoom(username: string): Promise<RoomProfile | null> {
  return getJson<RoomProfile>(`/api/public/rooms/${encodeURIComponent(username)}`, 0);
}

export async function getProjects(): Promise<Project[]> {
  const data = await getJson<Project[]>("/api/public/projects", 0);
  return data || [];
}

export async function getAlbums(): Promise<Album[]> {
  const data = await getJson<Album[]>("/api/public/albums");
  return data || [];
}

export async function getFriends(): Promise<Friend[]> {
  const data = await getJson<Friend[]>("/api/public/friends");
  return data || [];
}

export async function getFriendMessages(): Promise<FriendMessage[]> {
  const data = await getJson<FriendMessage[]>("/api/public/friend-messages", 0);
  return data || [];
}

export async function getCategories(): Promise<Category[]> {
  const data = await getJson<Category[]>("/api/public/categories");
  return data || [];
}

export async function getMoments(): Promise<Moment[]> {
  const data = await getJson<Moment[]>("/api/public/moments");
  return sortByDate(data || []);
}

export interface PublicSiteConfig {
  siteInfo: SiteInfo;
  background: BackgroundConfig;
  danmakuList: string[];
  aiConfig: AiConfig;
  misc: MiscConfig;
}

export async function getPublicSiteConfig(): Promise<PublicSiteConfig> {
  // 配置改动要尽快生效（管理端保存后下一次请求即可看到），不做 60s 数据缓存。
  const [siteInfo, background, danmakuList, aiConfig, misc] = await Promise.all([
    getJson<Partial<SiteInfo>>("/api/public/config/group/site-info", 0),
    getJson<Partial<BackgroundConfig>>("/api/public/config/group/background", 0),
    getJson<string[]>("/api/public/config/group/danmaku", 0),
    getJson<Partial<AiConfig>>("/api/public/config/group/ai", 0),
    getJson<Partial<MiscConfig>>("/api/public/config/group/misc", 0),
  ]);

  return {
    siteInfo: {
      ...DEFAULT_SITE_INFO,
      ...(siteInfo || {}),
      social: { ...DEFAULT_SITE_INFO.social, ...((siteInfo || {}).social || {}) },
      icpConfig: { ...DEFAULT_SITE_INFO.icpConfig, ...((siteInfo || {}).icpConfig || {}) },
    },
    background: { ...DEFAULT_BACKGROUND, ...(background || {}) },
    danmakuList: danmakuList?.length ? danmakuList : DEFAULT_DANMAKU,
    aiConfig: { ...DEFAULT_AI_CONFIG, ...(aiConfig || {}) },
    misc: {
      ...DEFAULT_MISC,
      ...(misc || {}),
      footerBadges: (misc || {}).footerBadges?.length ? misc!.footerBadges! : DEFAULT_MISC.footerBadges,
    },
  };
}
