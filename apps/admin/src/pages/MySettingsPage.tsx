"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, UserRound } from "lucide-react";
import { api } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { AdminPageHeader, AdminPageShell } from "../components/admin/AdminUI";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { inputClass, SettingsCard, SettingsField } from "../components/settings/SettingsControls";

type Profile = { nickname?: string; avatar?: string; roomName?: string; roomBio?: string };

export default function MySettingsPage() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<Profile>({});
  const [preferences, setPreferences] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.myProfile(), api.myPreferences()])
      .then(([profileResponse, preferencesResponse]) => {
        setProfile((profileResponse.data || {}) as Profile);
        setPreferences(preferencesResponse.data || {});
      })
      .catch((error) => showToast(error instanceof Error ? error.message : "加载失败", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all([api.updateMyProfile(profile), api.updateMyPreferences(preferences)]);
      showToast("个人设置已保存", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "保存失败", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminPageShell>
        <div className="flex h-64 items-center justify-center text-sm text-slate-400">
          <Loader2 className="mr-2 animate-spin" size={16} /> 加载中…
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="个人设置"
        description="只影响当前账户的资料、主题与阅读偏好。"
        eyebrow="MY SETTINGS"
        actions={
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} 保存
          </Button>
        }
      />

      <SettingsCard
        title="个人资料"
        description="这些字段只属于当前账户，不会影响站点 SEO 或全站文案。"
        icon={<UserRound size={20} className="text-indigo-400" />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <SettingsField label="昵称">
            <input className={inputClass} value={profile.nickname || ""} onChange={(event) => setProfile({ ...profile, nickname: event.target.value })} />
          </SettingsField>
          <SettingsField label="头像 URL">
            <input className={inputClass} value={profile.avatar || ""} onChange={(event) => setProfile({ ...profile, avatar: event.target.value })} />
          </SettingsField>
          <SettingsField label="空间名称">
            <input className={inputClass} value={profile.roomName || ""} onChange={(event) => setProfile({ ...profile, roomName: event.target.value })} />
          </SettingsField>
          <SettingsField label="空间简介">
            <input className={inputClass} value={profile.roomBio || ""} onChange={(event) => setProfile({ ...profile, roomBio: event.target.value })} />
          </SettingsField>
        </div>
      </SettingsCard>

      <div className="mt-4">
        <SettingsCard title="外观偏好" description="只影响当前账户在 C 端的展示偏好。">
          <div className="grid gap-4 md:grid-cols-2">
            <SettingsField label="主题模式">
              <Select
                value={String(preferences.themeMode || "dark")}
                onChange={(value) => setPreferences({ ...preferences, themeMode: value })}
                ariaLabel="主题模式"
                options={[
                  { value: "dark", label: "深色" },
                  { value: "light", label: "浅色" },
                ]}
              />
            </SettingsField>
            <SettingsField label="主题预设">
              <Select
                value={String(preferences.themePreset || "ocean")}
                onChange={(value) => setPreferences({ ...preferences, themePreset: value })}
                ariaLabel="主题预设"
                options={[
                  { value: "ocean", label: "深海鲸歌" },
                  { value: "violet", label: "旧日紫夜" },
                ]}
              />
            </SettingsField>
            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(preferences.backgroundAnimation ?? true)}
                onChange={(event) => setPreferences({ ...preferences, backgroundAnimation: event.target.checked })}
              />
              背景动画
            </label>
            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(preferences.glassContent ?? true)}
                onChange={(event) => setPreferences({ ...preferences, glassContent: event.target.checked })}
              />
              内容毛玻璃
            </label>
          </div>
        </SettingsCard>
      </div>
    </AdminPageShell>
  );
}
