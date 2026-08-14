"use client";

import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// ============ 类型定义 ============
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
  enableLevelSystem: boolean;
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

// ============ 默认值（从 siteConfig.ts 提取，作为 fallback）============
const DEFAULT_SITE_INFO: SiteInfo = {
  title: "XingHuiSama の 宝藏之地",
  faviconUrl: "https://bu.dusays.com/2026/03/24/69c1e38ac1846.jpg",
  authorName: "XingHuiSama",
  bio: "在代码、学术与分子动力学模拟间穿梭的普通人。近期正埋头于 GROMACS 模拟研究与神经网络计算。",
  navTitle: "XingHuiSama",
  navSuffix: "の",
  navAfter: "宝藏之地",
  avatarUrl: "https://bu.dusays.com/2026/03/24/69c1e38ac1846.jpg",
  buildDate: "2026-03-23T00:00:00",
  enableLevelSystem: true,
  social: {
    github: "https://github.com/zibaicai",
    gitee: "https://github.com/zibaicai",
    google: "mailto:yeziluochen@gmail.com",
    email: "1165441364@qq.com",
    qq: "1165441364",
    wechat: "w6795783",
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
    "https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg",
    "https://bu.dusays.com/2026/03/24/69c26fe4acdb5.jpg",
    "https://bu.dusays.com/2026/03/24/69c26fe4d9486.jpg",
  ],
  defaultPostCover: "https://bu.dusays.com/2026/03/24/69c1e38b346cb.jpg",
};

const DEFAULT_DANMAKU: string[] = [
  "在干嘛呢？", "有笨蛋嘛？", "前方高能反应！", "GROMACS 跑起来了吗？",
  "MD 模拟什么时候才能出图啊", "Graph Neural Networks 炼丹中...",
  "BUG 修复进度 99%", "今天背单词了吗？", "Tailwind CSS 拯救前端",
  "写算法中", "睡大觉中", "到底在干嘛？",
];

const DEFAULT_AI_CONFIG: AiConfig = {
  modelId: "gemini-2.5-flash-lite",
  systemPrompt: "你现在是一只傲娇、聪明、有点毒舌但很可爱的暹罗猫。你的名字叫煤球。你的主人是一个喜欢折腾代码的极客。你说话的特点是：1.必须简短，每次最多一两句话。2.喜欢在句尾加上喵~或者喵呜~。3.经常抱怨肚子饿，喜欢要小鱼干。4.回复字数最多不能超过100字。5.绝对不要承认自己是一个AI模型，你就是一只真实的猫。6.笨猫。",
  maxOutputTokens: 150,
  temperature: 0.85,
};

const DEFAULT_MISC: MiscConfig = {
  chatterTitle: "云端杂谈",
  chatterDescription: "代码、学术、提瓦特与泰拉大陆的碎片记录",
  picBedName: "图床",
  picBedUrl: "",
  picBedToken: "",
  cloudMusicIds: ["1809646618", "3361076230", "1859390262"],
  friendLinkApplyFormat: "名称：XingHuiSamaの宝藏之地\n简介：今天我也要学习吗\n链接：https://www.xinghuisama.top\n头像：https://bu.dusays.com/2026/03/24/69c1e38ac1846.jpg",
  photoWallImage: "https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg",
  counts: { photos: 128 },
  footerBadges: [
    { name: "Next.js 15", color: "text-sky-500", svg: "<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z\"/>" },
    { name: "React 19", color: "text-cyan-400", svg: "<path d=\"M12 22.6l-9.8-5.6V5.6L12 0l9.8 5.6v11.4l-9.8 5.6zm-8.2-6.5l8.2 4.7 8.2-4.7V7.5L12 2.8 3.8 7.5v8.6z\"/>" },
    { name: "Tailwind 4", color: "text-teal-400", svg: "<path d=\"M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C10.337,13.382,8.976,12,6.001,12z\"/>" },
  ],
  gitalkConfig: { clientID: "", clientSecret: "", repo: "", owner: "", admin: [""] },
};

// ============ Hook 实现 ============
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
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const [siteInfoRes, bgRes, danmakuRes, aiRes, miscRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/public/config/group/site-info`),
        fetch(`${API_BASE_URL}/api/public/config/group/background`),
        fetch(`${API_BASE_URL}/api/public/config/group/danmaku`),
        fetch(`${API_BASE_URL}/api/public/config/group/ai`),
        fetch(`${API_BASE_URL}/api/public/config/group/misc`),
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
        danmakuList: danmakuJson?.data || DEFAULT_DANMAKU,
        aiConfig: aiJson?.data || DEFAULT_AI_CONFIG,
        misc: miscJson?.data || DEFAULT_MISC,
        loading: false,
        error: null,
      });
    } catch (error) {
      // 降级到默认值
      setState({
        siteInfo: DEFAULT_SITE_INFO,
        background: DEFAULT_BACKGROUND,
        danmakuList: DEFAULT_DANMAKU,
        aiConfig: DEFAULT_AI_CONFIG,
        misc: DEFAULT_MISC,
        loading: false,
        error: error instanceof Error ? error.message : '配置加载失败',
      });
    }
  }, []);

  useEffect(() => {
    fetchAllConfigs();
  }, [fetchAllConfigs]);

  return { ...state, refetch: fetchAllConfigs };
}
