import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Loader2, Save } from "lucide-react";
import { useSiteConfigContext } from "../context/SiteConfigProvider";
import { useToast } from "../components/ToastProvider";
import { api } from "../lib/api";
import { AdminLoading, AdminPageHeader, AdminPageShell, Tabs } from "../components/admin/AdminUI";

import ProfileSection from "../components/settings/ProfileSection";
import BackgroundSection from "../components/settings/BackgroundSection";
import MusicSection from "../components/settings/MusicSection";
import AIWhaleSection from "../components/settings/AIWhaleSection";
import FooterSection from "../components/settings/FooterSection";
import GallerySection from "../components/settings/GallerySection";
import DisplaySection from "../components/settings/DisplaySection";

const TABS = [
  { id: "profile", label: "站点信息", icon: "🪪" },
  { id: "background", label: "背景", icon: "🖼️" },
  { id: "music", label: "音乐", icon: "🎵" },
  { id: "ai", label: "AI", icon: "🤖" },
  { id: "footer", label: "页脚", icon: "📄" },
  { id: "gallery", label: "图库", icon: "🌄" },
  { id: "display", label: "显示", icon: "🎨" },
];

const SITE_INFO_KEYS = [
  "title", "ownerUsername", "faviconUrl", "authorName", "bio", "navAfter",
  "avatarUrl", "buildDate", "social", "icpConfig",
] as const;

const BACKGROUND_KEYS = ["useGradient", "themeColors", "bgImages", "defaultPostCover"] as const;

const MISC_KEYS = [
  "cloudMusicIds", "friendLinkApplyFormat", "photoWallImage",
  "footerBadges",
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
    footerBadges: misc.footerBadges || [],
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
      <AdminPageShell>
        <AdminPageHeader
          title="系统设置"
          description="所有面板直接读写 /api/admin/config，保存后 C 端下一次请求即可生效"
          eyebrow="站点配置"
        />
        <AdminLoading label="正在加载站点配置…" />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="系统设置"
        description="所有面板直接读写 /api/admin/config，保存后 C 端下一次请求即可生效"
        eyebrow="站点配置"
      />

      {headerSlot &&
        createPortal(
          <button
            onClick={() => saveAll("全部站点配置")}
            disabled={saving}
            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-indigo-500 px-3 text-[11px] font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-400 active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={13} /> : <Save size={13} />}
            <span className="hidden sm:inline">{saving ? "保存中..." : "保存全部配置"}</span>
          </button>,
          headerSlot
        )}

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        items={TABS.map((tab) => ({ value: tab.id, label: `${tab.icon} ${tab.label}` }))}
      />

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {activeTab === "profile" && <ProfileSection {...panelProps} />}
        {activeTab === "background" && <BackgroundSection {...panelProps} />}
        {activeTab === "music" && <MusicSection {...panelProps} />}
        {activeTab === "ai" && <AIWhaleSection {...panelProps} />}
        {activeTab === "footer" && <FooterSection {...panelProps} />}
        {activeTab === "gallery" && <GallerySection {...panelProps} />}
        {activeTab === "display" && <DisplaySection {...panelProps} />}
      </motion.div>
    </AdminPageShell>
  );
}
