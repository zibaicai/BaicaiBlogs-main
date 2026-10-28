"use client";

import { useState } from "react";
import { BadgeCheck, CalendarDays, Link2, Plus, Shield, Trash2 } from "lucide-react";
import { useToast } from "../ToastProvider";
import {
  inputClass,
  SettingsCard,
  SettingsField,
  SettingsSaveButton,
} from "./SettingsControls";

type FooterProps = {
  formData: any;
  handleUpdate: (field: string, value: any) => void;
  pushToQueue: (label: string, key?: string, value?: any) => void;
};

const BADGE_COLORS = [
  "text-slate-500",
  "text-sky-500",
  "text-cyan-400",
  "text-teal-400",
  "text-indigo-500",
  "text-purple-500",
  "text-pink-500",
  "text-rose-400",
  "text-amber-500",
];

const STAR_PATH =
  '<path d="M12 2.5l2.85 6.05 6.65.92-4.82 4.56 1.17 6.57L12 17.5l-5.85 3.1 1.17-6.57-4.82-4.56 6.65-.92z"/>';

export default function FooterSection({ formData, handleUpdate, pushToQueue }: FooterProps) {
  const { showToast } = useToast();
  const data = formData || {};
  const buildDate: string = data.buildDate || "2026-03-23T00:00:00";
  const icp = data.icpConfig || { name: "", link: "" };
  const badges: any[] = Array.isArray(data.footerBadges) ? data.footerBadges : [];

  const [badgeName, setBadgeName] = useState("");
  const [badgeColor, setBadgeColor] = useState(BADGE_COLORS[4]);

  const save = () => {
    pushToQueue("首页底部配置", "footerConfig", {
      buildDate,
      icpConfig: icp,
      footerBadges: badges,
    });
  };

  const addBadge = () => {
    const name = badgeName.trim();
    if (!name) {
      showToast("徽章名称不能为空", "warning");
      return;
    }

    handleUpdate("footerBadges", [
      ...badges,
      { name, color: badgeColor, svg: STAR_PATH },
    ]);
    setBadgeName("");
    showToast("徽章已添加", "success");
  };

  const removeBadge = (index: number) => {
    handleUpdate(
      "footerBadges",
      badges.filter((_: any, current: number) => current !== index)
    );
  };

  return (
    <SettingsCard
      title="首页底部设置"
      description="建站时间、备案信息与页脚技术徽章"
      icon={<BadgeCheck size={20} className="text-indigo-400" />}
      action={<SettingsSaveButton onClick={save}>保存修改</SettingsSaveButton>}
    >
      <div className="space-y-7">
        <SettingsField label="建站时间" hint="首页运行时间以这个时间点为起点计算。">
          <div className="relative">
            <CalendarDays
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="datetime-local"
              value={buildDate.slice(0, 16)}
              onChange={(event) => handleUpdate("buildDate", `${event.target.value}:00`)}
              className={`${inputClass} pl-11`}
            />
          </div>
        </SettingsField>

        <div className="grid gap-4 md:grid-cols-2">
          <SettingsField label="备案显示名称">
            <div className="relative">
              <Shield
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400"
              />
              <input
                type="text"
                value={icp.name}
                onChange={(event) => handleUpdate("icpConfig", { ...icp, name: event.target.value })}
                className={`${inputClass} pl-11`}
                placeholder="例如：豫ICP备 2024102131号"
              />
            </div>
          </SettingsField>

          <SettingsField label="备案跳转链接">
            <div className="relative">
              <Link2
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="url"
                value={icp.link}
                onChange={(event) => handleUpdate("icpConfig", { ...icp, link: event.target.value })}
                className={`${inputClass} pl-11`}
                placeholder="https://..."
              />
            </div>
          </SettingsField>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-5 dark:border-slate-700/50 dark:bg-slate-950/30">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-200">技术徽章</h3>
              <p className="mt-1 text-[10px] text-slate-400">用于页脚展示技术栈，可删除或新增。</p>
            </div>
            <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-black text-slate-400 dark:bg-white/5">
              {badges.length}
            </span>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {badges.map((badge, index) => (
              <div
                key={`${badge.name}-${index}`}
                className="group flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white/70 px-3 py-2 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/60"
              >
                <svg
                  viewBox="0 0 24 24"
                  className={`h-3.5 w-3.5 ${badge.color || "text-slate-500"}`}
                  fill="currentColor"
                  dangerouslySetInnerHTML={{ __html: badge.svg || STAR_PATH }}
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{badge.name}</span>
                <button
                  type="button"
                  onClick={() => removeBadge(index)}
                  className="ml-1 rounded-full p-1 text-slate-400 opacity-60 transition hover:bg-rose-500/10 hover:text-rose-500 group-hover:opacity-100"
                  aria-label={`删除 ${badge.name}`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {badges.length === 0 && (
              <span className="text-xs text-slate-400">暂无页脚徽章</span>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-white/55 p-3 md:flex-row md:items-center dark:border-slate-700/50 dark:bg-slate-900/40">
            <input
              type="text"
              value={badgeName}
              onChange={(event) => setBadgeName(event.target.value)}
              placeholder="新徽章名称，例如 React"
              className={`${inputClass} flex-1 py-2.5`}
            />
            <div className="flex items-center gap-1.5 px-1">
              {BADGE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`选择颜色 ${color}`}
                  onClick={() => setBadgeColor(color)}
                  className={`h-5 w-5 rounded-full bg-current ${color} ${
                    badgeColor === color ? "ring-2 ring-slate-400 ring-offset-1" : "opacity-70"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={addBadge}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-cyan-600"
            >
              <Plus size={14} /> 添加
            </button>
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
