"use client";

import { GitBranch, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import {
  inputClass,
  SettingsCard,
  SettingsField,
  SettingsSaveButton,
} from "./SettingsControls";

type CommentProps = {
  formData: any;
  handleUpdate: (field: string, value: any) => void;
  pushToQueue: (label: string, key?: string, value?: any) => void;
};

const EMPTY_GITALK = {
  clientID: "",
  clientSecret: "",
  repo: "",
  owner: "",
  admin: [] as string[],
};

export default function CommentSection({ formData, handleUpdate, pushToQueue }: CommentProps) {
  const gitalk = { ...EMPTY_GITALK, ...(formData?.gitalkConfig || {}) };
  const admins: string[] = Array.isArray(gitalk.admin) ? gitalk.admin : [];

  const update = (key: keyof typeof EMPTY_GITALK, value: string | string[]) => {
    handleUpdate("gitalkConfig", { ...gitalk, [key]: value });
  };

  const save = () => {
    pushToQueue("Gitalk 评论系统", "gitalkConfig", gitalk);
  };

  return (
    <SettingsCard
      title="评论系统配置"
      description="连接 GitHub Issues 的 Gitalk 评论参数"
      icon={<ShieldCheck size={20} className="text-indigo-400" />}
      action={<SettingsSaveButton onClick={save}>保存修改</SettingsSaveButton>}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <SettingsField label="Client ID">
          <div className="relative">
            <KeyRound
              size={15}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400"
            />
            <input
              type="text"
              value={gitalk.clientID}
              onChange={(event) => update("clientID", event.target.value)}
              className={`${inputClass} pl-10 font-mono`}
              placeholder="OAuth App Client ID"
            />
          </div>
        </SettingsField>

        <SettingsField label="Client Secret">
          <div className="relative">
            <ShieldCheck
              size={15}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-rose-400"
            />
            <input
              type="password"
              value={gitalk.clientSecret}
              onChange={(event) => update("clientSecret", event.target.value)}
              className={`${inputClass} pl-10 font-mono`}
              placeholder="OAuth App Client Secret"
            />
          </div>
        </SettingsField>

        <SettingsField label="GitHub 仓库名">
          <div className="relative">
            <GitBranch
              size={15}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={gitalk.repo}
              onChange={(event) => update("repo", event.target.value)}
              className={`${inputClass} pl-10 font-mono`}
              placeholder="例如：blog-comments"
            />
          </div>
        </SettingsField>

        <SettingsField label="仓库所有者">
          <div className="relative">
            <UserRound
              size={15}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sky-400"
            />
            <input
              type="text"
              value={gitalk.owner}
              onChange={(event) => update("owner", event.target.value)}
              className={`${inputClass} pl-10 font-mono`}
              placeholder="GitHub 用户名"
            />
          </div>
        </SettingsField>

        <div className="md:col-span-2">
          <SettingsField
            label="管理员列表"
            hint="多个 GitHub 用户名用英文逗号分隔。这些账号可以初始化和管理评论区。"
          >
            <input
              type="text"
              value={admins.join(", ")}
              onChange={(event) =>
                update(
                  "admin",
                  event.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                )
              }
              className={`${inputClass} font-mono`}
              placeholder="user1, user2"
            />
          </SettingsField>
        </div>
      </div>
    </SettingsCard>
  );
}
