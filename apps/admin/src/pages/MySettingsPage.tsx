"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { api } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { AdminPageHeader, AdminPageShell } from "../components/admin/AdminUI";
import { Button } from "../components/ui/Button";

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
    return <AdminPageShell><div className="flex h-64 items-center justify-center text-sm text-slate-400"><Loader2 className="mr-2 animate-spin" size={16} />加载中…</div></AdminPageShell>;
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="个人设置"
        description="只影响当前账户的资料、主题与阅读偏好。"
        eyebrow="MY SETTINGS"
        actions={<Button onClick={() => void save()} disabled={saving}>{saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} 保存</Button>}
      />

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">个人资料</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-[11px] font-bold text-slate-300">昵称
            <input className="admin-input mt-2" value={profile.nickname || ""} onChange={(event) => setProfile({ ...profile, nickname: event.target.value })} />
          </label>
          <label className="text-[11px] font-bold text-slate-300">头像 URL
            <input className="admin-input mt-2" value={profile.avatar || ""} onChange={(event) => setProfile({ ...profile, avatar: event.target.value })} />
          </label>
          <label className="text-[11px] font-bold text-slate-300">空间名称
            <input className="admin-input mt-2" value={profile.roomName || ""} onChange={(event) => setProfile({ ...profile, roomName: event.target.value })} />
          </label>
          <label className="text-[11px] font-bold text-slate-300">空间简介
            <input className="admin-input mt-2" value={profile.roomBio || ""} onChange={(event) => setProfile({ ...profile, roomBio: event.target.value })} />
          </label>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">外观偏好</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-[11px] font-bold text-slate-300">主题模式
            <select className="admin-input mt-2" value={String(preferences.themeMode || "dark")} onChange={(event) => setPreferences({ ...preferences, themeMode: event.target.value })}>
              <option value="dark">深色</option>
              <option value="light">浅色</option>
            </select>
          </label>
          <label className="text-[11px] font-bold text-slate-300">主题预设
            <select className="admin-input mt-2" value={String(preferences.themePreset || "ocean")} onChange={(event) => setPreferences({ ...preferences, themePreset: event.target.value })}>
              <option value="ocean">深海鲸歌</option>
              <option value="violet">旧日紫夜</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
            <input type="checkbox" checked={Boolean(preferences.backgroundAnimation ?? true)} onChange={(event) => setPreferences({ ...preferences, backgroundAnimation: event.target.checked })} />
            背景动画
          </label>
          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
            <input type="checkbox" checked={Boolean(preferences.glassContent ?? true)} onChange={(event) => setPreferences({ ...preferences, glassContent: event.target.checked })} />
            内容毛玻璃
          </label>
        </div>
      </section>
    </AdminPageShell>
  );
}
