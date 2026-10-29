"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, Save, ShieldAlert, UserRound } from "lucide-react";
import { api } from "../../lib/api";
import FloatingImageTool from "../editor/FloatingImageTool";
import {
  inputClass,
  SettingsCard,
  SettingsField,
} from "./SettingsControls";

type ProfileProps = {
  formData: any;
  handleUpdate: (field: string, value: any) => void;
  pushToQueue: (label: string, key?: string, value?: any) => void;
};

export default function ProfileSection({ formData, handleUpdate, pushToQueue }: ProfileProps) {
  const data = formData || {};
  const social = data.social || {};
  const restricted = Boolean(data.__restricted?.length);

  const avatarInput = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [imageToolOpen, setImageToolOpen] = useState(false);
  const [targetField, setTargetField] = useState<"avatarUrl" | "faviconUrl" | null>(null);

  const uploadAvatar = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("请选择图片文件");
      return;
    }

    setUploadingAvatar(true);
    setAvatarError("");
    try {
      const response = await api.uploadImage(file);
      handleUpdate("avatarUrl", response.data);
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "头像上传失败");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const requestSensitiveAccess = async () => {
    const reason = window.prompt("请输入申请原因（至少 10 个字）");
    if (!reason || reason.trim().length < 10) return;

    try {
      await api.requestSensitiveAccess("site_social", reason.trim());
      window.alert("申请已提交，等待超级管理员审批（1 小时有效）");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "申请失败");
    }
  };

  const openImageTool = (field: "avatarUrl" | "faviconUrl") => {
    setTargetField(field);
    setImageToolOpen(true);
  };

  const insertImage = (url: string) => {
    if (targetField) handleUpdate(targetField, url);
    setImageToolOpen(false);
    setTargetField(null);
  };

  const updateSocial = (key: string, value: string) => {
    handleUpdate("social", { ...social, [key]: value });
  };

  return (
    <>
      <SettingsCard
        title="个人名片"
        description="头像、站点标题、社交链接与首页展示信息"
        icon={<UserRound size={20} className="text-indigo-400" />}
        action={
          <button
            type="button"
            onClick={() => pushToQueue("全量更新个人名片")}
            className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-600"
          >
            <Save size={14} /> 暂存修改
          </button>
        }
      >
        <div className="grid gap-8 lg:grid-cols-[170px_minmax(0,1fr)]">
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => avatarInput.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void uploadAvatar(event.dataTransfer.files?.[0]);
              }}
              className="group relative h-36 w-36 overflow-hidden rounded-[28px] border border-white/60 bg-white/60 p-1.5 shadow-xl transition hover:scale-[1.02] dark:border-white/10 dark:bg-slate-800/60"
              aria-label="更换头像"
            >
              <img
                src={data.avatarUrl || ""}
                alt="站点头像"
                className="h-full w-full rounded-[22px] object-cover"
              />
              <span className="absolute inset-1.5 flex items-center justify-center rounded-[22px] bg-slate-950/55 text-[10px] font-black text-white opacity-0 transition group-hover:opacity-100">
                {uploadingAvatar ? "上传中…" : "更换头像"}
              </span>
            </button>

            <input
              ref={avatarInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                void uploadAvatar(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <p className="text-[10px] font-bold text-slate-400">点击或拖拽图片更换头像</p>
            {avatarError && <p className="text-[10px] font-bold text-rose-400">{avatarError}</p>}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200/70 bg-white/35 p-4 dark:border-slate-700/50 dark:bg-slate-800/30">
              <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                导航栏文字
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ["navTitle", "前缀"],
                  ["navSuffix", "连接符"],
                  ["navAfter", "尾部"],
                ].map(([field, label]) => (
                  <SettingsField key={field} label={label}>
                    <input
                      type="text"
                      value={data[field] || ""}
                      onChange={(event) => handleUpdate(field, event.target.value)}
                      className={inputClass}
                    />
                  </SettingsField>
                ))}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <SettingsField label="网站总标题">
                <input
                  type="text"
                  value={data.title || ""}
                  onChange={(event) => handleUpdate("title", event.target.value)}
                  className={inputClass}
                />
              </SettingsField>

              <SettingsField label="作者名称">
                <input
                  type="text"
                  value={data.authorName || ""}
                  onChange={(event) => handleUpdate("authorName", event.target.value)}
                  className={inputClass}
                />
              </SettingsField>

              <div className="md:col-span-2">
                <SettingsField label="网页图标 Favicon">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={data.faviconUrl || ""}
                      onChange={(event) => handleUpdate("faviconUrl", event.target.value)}
                      className={`${inputClass} flex-1`}
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={() => openImageTool("faviconUrl")}
                      className="flex items-center gap-1 rounded-xl bg-indigo-50 px-4 text-xs font-black text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300"
                    >
                      <ImagePlus size={14} /> 图床
                    </button>
                  </div>
                </SettingsField>
              </div>

              <div className="md:col-span-2">
                <SettingsField label="个人简介 BIO">
                  <textarea
                    rows={3}
                    value={data.bio || ""}
                    onChange={(event) => handleUpdate("bio", event.target.value)}
                    className={`${inputClass} resize-none`}
                  />
                </SettingsField>
              </div>
            </div>

            <div className="border-t border-slate-200/70 pt-5 dark:border-slate-700/50">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-300">
                  <Link2 size={15} /> 社交链接
                </h3>
                {restricted && (
                  <button
                    type="button"
                    onClick={() => void requestSensitiveAccess()}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-[10px] font-black text-amber-600 dark:text-amber-300"
                  >
                    <ShieldAlert size={12} /> 申请查看敏感字段
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["github", "GitHub", false],
                  ["gitee", "Gitee", false],
                  ["email", "邮箱 Email", restricted],
                  ["google", "Google 邮箱/链接", restricted],
                  ["wechat", "微信 ID", restricted],
                  ["qq", "QQ 号", restricted],
                ].map(([key, label, disabled]) => (
                  <SettingsField key={String(key)} label={String(label)}>
                    <input
                      type="text"
                      value={social[String(key)] || ""}
                      onChange={(event) => updateSocial(String(key), event.target.value)}
                      disabled={Boolean(disabled)}
                      className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
                    />
                  </SettingsField>
                ))}
              </div>
            </div>

            <SettingsField label="友链申请模板">
              <textarea
                rows={4}
                value={data.friendLinkApplyFormat || ""}
                onChange={(event) => handleUpdate("friendLinkApplyFormat", event.target.value)}
                className={`${inputClass} resize-none font-mono`}
                placeholder="名称：...&#10;简介：...&#10;链接：..."
              />
            </SettingsField>
          </div>
        </div>
      </SettingsCard>

      <FloatingImageTool
        isOpen={imageToolOpen}
        onClose={() => setImageToolOpen(false)}
        onInsert={insertImage}
      />
    </>
  );
}
