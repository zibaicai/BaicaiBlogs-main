"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_AI_CONFIG,
  DEFAULT_BACKGROUND,
  DEFAULT_DANMAKU,
  DEFAULT_MISC,
  DEFAULT_SITE_INFO,
  type AiConfig,
  type BackgroundConfig,
  type MiscConfig,
  type SiteConfigState,
  type SiteInfo,
} from "../lib/site-config";

type InitialConfig = Omit<SiteConfigState, "loading" | "error">;

async function getJson(path: string) {
  try {
    const res = await fetch(`/api${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    return json?.success === false ? null : json;
  } catch {
    return null;
  }
}

function mergeConfig(
  siteInfo: Partial<SiteInfo> | null,
  background: Partial<BackgroundConfig> | null,
  danmakuList: string[] | null,
  aiConfig: Partial<AiConfig> | null,
  misc: Partial<MiscConfig> | null
): InitialConfig {
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

export function useSiteConfig(initial?: InitialConfig) {
  const [state, setState] = useState<SiteConfigState>(() => ({
    ...(initial || {
      siteInfo: DEFAULT_SITE_INFO,
      background: DEFAULT_BACKGROUND,
      danmakuList: DEFAULT_DANMAKU,
      aiConfig: DEFAULT_AI_CONFIG,
      misc: DEFAULT_MISC,
    }),
    loading: !initial,
    error: null,
  }));

  const refetch = useCallback(async () => {
    const [site, bg, danmaku, ai, misc] = await Promise.all([
      getJson("/public/config/group/site-info"),
      getJson("/public/config/group/background"),
      getJson("/public/config/group/danmaku"),
      getJson("/public/config/group/ai"),
      getJson("/public/config/group/misc"),
    ]);

    // 全部失败时保留当前值，不把页面打回默认配置
    if (!site && !bg && !danmaku && !ai && !misc) {
      setState((prev) => ({ ...prev, loading: false, error: "配置加载失败" }));
      return;
    }

    setState({
      ...mergeConfig(
        site?.data ?? null,
        bg?.data ?? null,
        danmaku?.data ?? null,
        ai?.data ?? null,
        misc?.data ?? null
      ),
      loading: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    // 首屏用服务端注入的配置，挂载后再刷一次，管理端保存后无需重启 C 端。
    refetch();
  }, [refetch]);

  return useMemo(() => ({ ...state, refetch }), [state, refetch]);
}
