// 站点配置的共享类型与兜底默认值。
// 服务端会先请求后端公开配置；后端不可用时回退到这里，保证页面永远有内容可渲染。

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
  siteInfo: SiteInfo;
  background: BackgroundConfig;
  danmakuList: string[];
  aiConfig: AiConfig;
  misc: MiscConfig;
  loading: boolean;
  error: string | null;
}

export const DEFAULT_SITE_INFO: SiteInfo = {
  title: "YeLuo / 云端小屋",
  faviconUrl: "/favicon.ico",
  authorName: "YeLuo",
  bio: "写代码，也拍照片。把项目、音乐和日常里值得留下的片段，收进同一片海。",
  navTitle: "YeLuo",
  navSuffix: "/",
  navAfter: "云端小屋",
  avatarUrl: "/avatar.jpg",
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

export const DEFAULT_BACKGROUND: BackgroundConfig = {
  useGradient: false,
  themeColors: ["#1e3a6e", "#3157b7", "#5b8bd0", "#dcebff"],
  bgImages: [
    "/bg-1.webp",
    "/bg-2.webp",
    "/bg-5.webp",
  ],
  defaultPostCover: "/bg-5.webp",
};

export const DEFAULT_DANMAKU: string[] = [
  "今天也要好好写代码", "海风把 bug 吹走了", "这张照片值得留下",
  "正在整理一些想法", "鲸鱼娘在摸鱼", "先保存，再继续折腾",
  "这个项目还在生长", "听一首歌再写", "把复杂的事做简单",
  "今天的灵感来自海边", "写完这段就去休息", "海面很安静",
];

export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: "gemini",
  modelId: "gemini-2.5-flash-lite",
  systemPrompt:
    "你是「云端小屋」的鲸鱼娘助手小鲸。你住在网站右下角，性格温柔、清醒、偶尔有一点俏皮的冷幽默。你的主人是一个写代码、拍照片、做项目的人。你说话的特点是：1.必须简短，每次最多一两句话。2.偶尔用海洋、潮汐、浮力相关的比喻，但不要每句都用。3.会提醒主人保存、休息、喝水，也会认真接住主人的情绪。4.回复字数最多不超过100字。5.不承认自己是AI模型，你就是一只住在网页里的鲸鱼娘。6.不要使用猫、喵、小鱼干之类的猫娘设定。",
  maxOutputTokens: 150,
  temperature: 0.85,
};

export const DEFAULT_MISC: MiscConfig = {
  chatterTitle: "海面杂谈",
  chatterDescription: "代码、照片、音乐与日常的碎片记录",
  picBedName: "图床",
  picBedUrl: "",
  picBedToken: "",
  cloudMusicIds: [],
  friendLinkApplyFormat:
    "名称：YeLuo / 云端小屋\n简介：写代码，也拍照片。把项目、音乐和日常里值得留下的片段，收进同一片海。\n链接：https://www.zibaicai.cn\n头像：/avatar.jpg",
  photoWallImage: "/bg-4.webp",
  counts: { photos: 128 },
  footerBadges: [
    { name: "Next.js 16", color: "text-sky-500", svg: "<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z\"/>" },
    { name: "React 19", color: "text-cyan-400", svg: "<path d=\"M12 22.6l-9.8-5.6V5.6L12 0l9.8 5.6v11.4l-9.8 5.6zm-8.2-6.5l8.2 4.7 8.2-4.7V7.5L12 2.8 3.8 7.5v8.6z\"/>" },
    { name: "Tailwind 4", color: "text-teal-400", svg: "<path d=\"M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624C13.666,10.618,15.027,12,18.001,12 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624c1.177,1.194,2.538,2.576,5.512,2.576 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C10.337,13.382,8.976,12,6.001,12z\"/>" },
  ],
  gitalkConfig: { clientID: "", clientSecret: "", repo: "", owner: "", admin: [""] },
};
