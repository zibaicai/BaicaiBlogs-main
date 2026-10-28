import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Loader2, Save } from "lucide-react";
import { useSiteConfigContext } from "../context/SiteConfigProvider";
import { useToast } from "../components/ToastProvider";
import { api } from "../lib/api";

import ProfileSection from "../components/settings/ProfileSection";
import BackgroundSection from "../components/settings/BackgroundSection";
import MusicSection from "../components/settings/MusicSection";
import CommentSection from "../components/settings/CommentSection";
import RepoSection from "../components/settings/RepoSection";
import AIWhaleSection from "../components/settings/AIWhaleSection";
import FooterSection from "../components/settings/FooterSection";
import GallerySection from "../components/settings/GallerySection";
import DisplaySection from "../components/settings/DisplaySection";

const TABS = [
  { id: "profile", label: "站点信息", icon: "🪪" },
  { id: "background", label: "背景", icon: "🖼️" },
  { id: "music", label: "音乐", icon: "🎵" },
  { id: "comment", label: "评论", icon: "🗨️" },
  { id: "repo", label: "仓库", icon: "🗂️" },
  { id: "ai", label: "AI", icon: "🤖" },
  { id: "footer", label: "页脚", icon: "📄" },
  { id: "gallery", label: "图库", icon: "🌄" },
  { id: "display", label: "显示", icon: "🎨" },
];

const SITE_INFO_KEYS = [
  "title", "faviconUrl", "authorName", "bio", "navTitle", "navSuffix", "navAfter",
  "avatarUrl", "buildDate", "enableLevelSystem", "social", "icpConfig",
] as const;

const BACKGROUND_KEYS = ["useGradient", "themeColors", "bgImages", "defaultPostCover"] as const;

const MISC_KEYS = [
  "chatterTitle", "chatterDescription", "picBedName", "picBedUrl", "picBedToken",
  "cloudMusicIds", "friendLinkApplyFormat", "photoWallImage", "counts",
  "footerBadges", "gitalkConfig", "repoConfig",
] as const;

function pick(source: Record<string, any>, keys: readonly string[]) {
  const out: Record<string, any> = {};
  for (const key of keys) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
}

function buildFlat(config: any) {
  const siteInfo = config.siteInfo || {};
  const background = config.background || {};
  const misc = config.misc || {};
  const aiConfig = config.aiConfig || {};
  const normalizedAi = {
    provider: aiConfig.provider || "gemini",
    ...aiConfig,
  };
  return {
    ...siteInfo,
    ...background,
    ...misc,
    ...aiConfig,
    aiConfig: normalizedAi,
    danmakuList: config.danmakuList || [],
    social: { ...(siteInfo.social || {}) },
    icpConfig: { ...(siteInfo.icpConfig || {}) },
    counts: { ...(misc.counts || {}) },
    footerBadges: misc.footerBadges || [],
    gitalkConfig: { ...(misc.gitalkConfig || { admin: [] }) },
    repoConfig: {
      repoUrl: "https://github.com/zibaicai/BaicaiBlogs-main",
      note: "",
      ...(misc.repoConfig || {}),
    },
    cloudMusicIds: misc.cloudMusicIds || [],
    bgImages: background.bgImages || [],
    themeColors: background.themeColors || [],
  };
}

export default function SettingsPage() {
  const config = useSiteConfigContext();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHeaderSlot(document.getElementById("admin-header-actions"));
  }, []);

  useEffect(() => {
    if (!config.loading && config.siteInfo) {
      setFormData(buildFlat(config));
      setHydrated(true);
    }
  }, [config.loading, config.siteInfo, config.background, config.misc, config.aiConfig, config.danmakuList]);

  const handleUpdate = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const saveAll = useCallback(
    async (label = "站点配置") => {
      setSaving(true);
      try {
        const siteInfo = pick(formData, SITE_INFO_KEYS);
        const background = pick(formData, BACKGROUND_KEYS);
        const misc = pick(formData, MISC_KEYS);
        const aiConfig =
          formData.aiConfig ||
          formData.geminiConfig ||
          pick(formData, ["provider", "modelId", "systemPrompt", "maxOutputTokens", "temperature"] as const);

        const updates: Array<{ key: string; value: string; description: string }> = [
          { key: "site_info", value: JSON.stringify(siteInfo), description: "站点基本信息配置" },
          { key: "background", value: JSON.stringify(background), description: "背景与主题配置" },
          { key: "danmaku_list", value: JSON.stringify(formData.danmakuList || []), description: "首页弹幕列表" },
          { key: "ai_config", value: JSON.stringify(aiConfig), description: "AI 助手配置" },
          { key: "misc", value: JSON.stringify(misc), description: "杂项配置" },
        ];

        for (const item of updates) {
          await api.updateConfig(item.key, item.value, item.description);
        }
        await config.refetch();
        showToast(`✅ ${label}已保存`, "success");
      } catch (error) {
        const message = error instanceof Error ? error.message : "未知错误";
        showToast(`保存失败：${message}`, "error");
      } finally {
        setSaving(false);
      }
    },
    [config, formData, showToast]
  );

  const pushToQueue = useCallback(
    (label: string) => {
      void saveAll(label);
    },
    [saveAll]
  );

  const panelProps = useMemo(
    () => ({ formData, handleUpdate, pushToQueue }),
    [formData, handleUpdate, pushToQueue]
  );

  if (config.loading && !hydrated) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-400 gap-3">
        <Loader2 className="animate-spin" size={20} />
        正在加载站点配置...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">系统设置</h1>
        <p className="text-sm text-slate-400 mt-1 font-bold">
          所有面板直接读写 /api/admin/config，保存后 C 端下一次请求即可生效
        </p>
      </div>

      {headerSlot &&
        createPortal(
          <button
            onClick={() => saveAll("全部站点配置")}
            disabled={saving}
            className="shrink-0 px-5 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            <span className="hidden sm:inline">{saving ? "保存中..." : "保存全部配置"}</span>
          </button>,
          headerSlot
        )}

      <div className="flex flex-wrap gap-2 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 rounded-3xl p-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
              activeTab === tab.id
                ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                : "text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60"
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {activeTab === "profile" && <ProfileSection {...panelProps} />}
        {activeTab === "background" && <BackgroundSection {...panelProps} />}
        {activeTab === "music" && <MusicSection {...panelProps} />}
        {activeTab === "comment" && <CommentSection {...panelProps} />}
        {activeTab === "repo" && <RepoSection {...panelProps} />}
        {activeTab === "ai" && <AIWhaleSection {...panelProps} />}
        {activeTab === "footer" && <FooterSection {...panelProps} />}
        {activeTab === "gallery" && <GallerySection {...panelProps} />}
        {activeTab === "display" && <DisplaySection {...panelProps} />}
      </motion.div>
    </div>
  );
}
