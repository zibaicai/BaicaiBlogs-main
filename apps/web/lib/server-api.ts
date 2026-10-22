// 服务端数据读取：直接访问内网后端，避免浏览器跨域；带 60s ISR 缓存。
import type { Album, Chatter, Friend, Moment, Post, Project } from "./api";
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
    const res = await fetch(`${INTERNAL_BASE}${path}`, {
      next: { revalidate },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { success?: boolean; data?: T };
    if (json?.success === false) return null;
    return (json?.data ?? null) as T | null;
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

export async function getChatters(): Promise<Chatter[]> {
  const data = await getJson<Chatter[]>("/api/public/chatters");
  return sortByDate(data || []);
}

export async function getProjects(): Promise<Project[]> {
  const data = await getJson<Project[]>("/api/public/projects");
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
  const [siteInfo, background, danmakuList, aiConfig, misc] = await Promise.all([
    getJson<Partial<SiteInfo>>("/api/public/config/group/site-info"),
    getJson<Partial<BackgroundConfig>>("/api/public/config/group/background"),
    getJson<string[]>("/api/public/config/group/danmaku"),
    getJson<Partial<AiConfig>>("/api/public/config/group/ai"),
    getJson<Partial<MiscConfig>>("/api/public/config/group/misc"),
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
      counts: { ...DEFAULT_MISC.counts, ...((misc || {}).counts || {}) },
      gitalkConfig: { ...DEFAULT_MISC.gitalkConfig, ...((misc || {}).gitalkConfig || {}) },
      footerBadges: (misc || {}).footerBadges?.length ? misc!.footerBadges! : DEFAULT_MISC.footerBadges,
    },
  };
}
