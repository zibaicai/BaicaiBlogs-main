import { useCallback, useEffect, useState } from "react";

// 管理端与 C 端同源部署：浏览器始终请求 /api，由 nginx 或 Vite 代理到后端。
const API_BASE_URL = "";

export interface SocialLinks {
  github?: string;
  gitee?: string;
  google?: string;
  email?: string;
  qq?: string;
  wechat?: string;
}

export interface IcpConfig {
  name: string;
  link: string;
}

export interface SiteInfo {
  title: string;
  faviconUrl: string;
  authorName: string;
  bio: string;
  navTitle: string;
  navSuffix: string;
  navAfter: string;
  avatarUrl: string;
  buildDate: string;
  social: SocialLinks;
  icpConfig: IcpConfig;
}

export interface BackgroundConfig {
  useGradient: boolean;
  themeColors: string[];
  bgImages: string[];
  defaultPostCover: string;
}

export interface AiConfig {
  provider: "gemini" | "deepseek";
  modelId: string;
  systemPrompt: string;
  maxOutputTokens: number;
  temperature: number;
}

export interface FooterBadge {
  name: string;
  color: string;
  svg: string;
}

export interface GitalkConfig {
  clientID: string;
  clientSecret: string;
  repo: string;
  owner: string;
  admin: string[];
}

export interface MiscConfig {
  chatterTitle: string;
  chatterDescription: string;
  picBedName: string;
  picBedUrl: string;
  picBedToken: string;
  cloudMusicIds: string[];
  friendLinkApplyFormat: string;
  photoWallImage: string;
  counts: { photos: number };
  footerBadges: FooterBadge[];
  gitalkConfig: GitalkConfig;
}

export interface SiteConfigState {
  siteInfo: SiteInfo | null;
  background: BackgroundConfig | null;
  danmakuList: string[];
  aiConfig: AiConfig | null;
  misc: MiscConfig | null;
  loading: boolean;
  error: string | null;
}

const DEFAULT_SITE_INFO: SiteInfo = {
  title: "YeLuo / 云端小屋",
  faviconUrl: "https://www.zibaicai.cn/favicon.ico",
  authorName: "YeLuo",
  bio: "写代码，也拍照片。把项目、音乐和日常里值得留下的片段，收进同一片海。",
  navTitle: "YeLuo",
  navSuffix: "/",
  navAfter: "云端小屋",
  avatarUrl: "https://www.zibaicai.cn/avatar.jpg",
  buildDate: "2026-03-23T00:00:00",
  social: {
    github: "https://github.com/zibaicai",
    gitee: "https://github.com/zibaicai",
    google: "",
    email: "",
    qq: "",
    wechat: "",
  },
  icpConfig: {
    name: "豫ICP备 2024102131号",
    link: "https://icp.gov.moe/?keyword=2024102131",
  },
};

const DEFAULT_BACKGROUND: BackgroundConfig = {
  useGradient: false,
  themeColors: ["#a18cd1", "#fbc2eb", "#a1c4fd", "#c2e9fb"],
  bgImages: [
    "https://www.zibaicai.cn/bg-1.webp",
    "https://www.zibaicai.cn/bg-2.webp",
    "https://www.zibaicai.cn/bg-3.webp",
    "https://www.zibaicai.cn/bg-5.webp",
  ],
  defaultPostCover: "https://www.zibaicai.cn/bg-3.webp",
};

const DEFAULT_DANMAKU: string[] = [
  "今天也要好好写代码", "海风把 bug 吹走了", "这张照片值得留下",
  "正在整理一些想法", "鲸鱼娘在摸鱼", "先保存，再继续折腾",
  "这个项目还在生长", "听一首歌再写", "把复杂的事做简单",
  "今天的灵感来自海边", "写完这段就去休息", "海面很安静",
];

const DEFAULT_AI_CONFIG: AiConfig = {
  provider: "gemini",
  modelId: "gemini-2.5-flash-lite",
  systemPrompt:
    "你是「云端小屋」的鲸鱼娘助手小鲸。你住在网站右下角，性格温柔、清醒、偶尔有一点俏皮的冷幽默。你的主人是一个写代码、拍照片、做项目的人。你说话的特点是：1.必须简短，每次最多一两句话。2.偶尔用海洋、潮汐、浮力相关的比喻，但不要每句都用。3.会提醒主人保存、休息、喝水，也会认真接住主人的情绪。4.回复字数最多不超过100字。5.不承认自己是AI模型，你就是一只住在网页里的鲸鱼娘。6.不要使用猫、喵、小鱼干之类的猫娘设定。",
  maxOutputTokens: 150,
  temperature: 0.85,
};

const DEFAULT_MISC: MiscConfig = {
  chatterTitle: "海面杂谈",
  chatterDescription: "代码、照片、音乐与日常的碎片记录",
  picBedName: "图床",
  picBedUrl: "",
  picBedToken: "",
  cloudMusicIds: [],
  friendLinkApplyFormat:
    "名称：YeLuo / 云端小屋\n简介：写代码，也拍照片。把项目、音乐和日常里值得留下的片段，收进同一片海。\n链接：https://www.zibaicai.cn\n头像：https://www.zibaicai.cn/avatar.jpg",
  photoWallImage: "https://www.zibaicai.cn/bg-4.webp",
  counts: { photos: 128 },
  footerBadges: [
    { name: "Next.js 16", color: "text-sky-500", svg: "<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z\"/>" },
    { name: "React 19", color: "text-cyan-400", svg: "<path d=\"M12 22.6l-9.8-5.6V5.6L12 0l9.8 5.6v11.4l-9.8 5.6zm-8.2-6.5l8.2 4.7 8.2-4.7V7.5L12 2.8 3.8 7.5v8.6z\"/>" },
    { name: "Tailwind 4", color: "text-teal-400", svg: "<path d=\"M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624C13.666,10.618,15.027,12,18.001,12 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624c1.177,1.194,2.538,2.576,5.512,2.576 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C10.337,13.382,8.976,12,6.001,12z\"/>" },
  ],
  gitalkConfig: { clientID: "", clientSecret: "", repo: "", owner: "", admin: [""] },
};

export function useSiteConfig() {
  const [state, setState] = useState<SiteConfigState>({
    siteInfo: null,
    background: null,
    danmakuList: [],
    aiConfig: null,
    misc: null,
    loading: true,
    error: null,
  });

  const fetchAllConfigs = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const token = localStorage.getItem("bc_admin_token") || "";
      const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const [siteInfoRes, bgRes, danmakuRes, aiRes, miscRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/config/group/site-info`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/admin/config/group/background`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/admin/config/group/danmaku`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/admin/config/group/ai`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/admin/config/group/misc`, { headers: authHeaders }),
      ]);

      const [siteInfoJson, bgJson, danmakuJson, aiJson, miscJson] = await Promise.all([
        siteInfoRes.ok ? siteInfoRes.json() : null,
        bgRes.ok ? bgRes.json() : null,
        danmakuRes.ok ? danmakuRes.json() : null,
        aiRes.ok ? aiRes.json() : null,
        miscRes.ok ? miscRes.json() : null,
      ]);

      setState({
        siteInfo: siteInfoJson?.data || DEFAULT_SITE_INFO,
        background: bgJson?.data || DEFAULT_BACKGROUND,
        danmakuList: danmakuJson?.data?.items || danmakuJson?.data || DEFAULT_DANMAKU,
        aiConfig: aiJson?.data || DEFAULT_AI_CONFIG,
        misc: miscJson?.data || DEFAULT_MISC,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        siteInfo: DEFAULT_SITE_INFO,
        background: DEFAULT_BACKGROUND,
        danmakuList: DEFAULT_DANMAKU,
        aiConfig: DEFAULT_AI_CONFIG,
        misc: DEFAULT_MISC,
        loading: false,
        error: error instanceof Error ? error.message : "配置加载失败",
      });
    }
  }, []);

  useEffect(() => {
    fetchAllConfigs();
  }, [fetchAllConfigs]);

  return {
    ...state,
    refetch: fetchAllConfigs,
    defaults: {
      siteInfo: DEFAULT_SITE_INFO,
      background: DEFAULT_BACKGROUND,
      danmakuList: DEFAULT_DANMAKU,
      aiConfig: DEFAULT_AI_CONFIG,
      misc: DEFAULT_MISC,
    },
  };
}
