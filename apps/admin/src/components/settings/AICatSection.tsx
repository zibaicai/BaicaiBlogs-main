"use client";

import { useEffect, useState } from "react";
import { Bot, Cpu, MessageSquareText, SlidersHorizontal, Sparkles } from "lucide-react";
import {
  inputClass,
  SettingsCard,
  SettingsField,
  SettingsSaveButton,
} from "./SettingsControls";

const DEFAULT_CONFIG = {
  modelId: "gemini-2.5-flash-lite",
  systemPrompt: "",
  maxOutputTokens: 150,
  temperature: 0.85,
};

export default function AICatSection({ formData, handleUpdate, pushToQueue }: any) {
  const config = { ...DEFAULT_CONFIG, ...(formData?.geminiConfig || {}) };
  const [promptText, setPromptText] = useState("");

  useEffect(() => {
    if (config.systemPrompt) {
      setPromptText(String(config.systemPrompt).replace(/\\n/g, "\n"));
    }
    // Initialize from the saved value once; subsequent edits are local until saved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (key: keyof typeof DEFAULT_CONFIG, value: string | number) => {
    handleUpdate("geminiConfig", { ...config, [key]: value });
  };

  const updatePrompt = (value: string) => {
    setPromptText(value);
    update("systemPrompt", value.replace(/\n/g, "\\n"));
  };

  return (
    <SettingsCard
      title="AI 小猫性格调度中心"
      description="调整鲸鱼娘的说话方式、模型与生成参数"
      icon={<Bot size={20} className="text-indigo-400" />}
      action={
        <SettingsSaveButton onClick={() => pushToQueue("AI 小猫配置")}>
          暂存到队列
        </SettingsSaveButton>
      }
    >
      <div className="space-y-6">
        <SettingsField label="模型 ID" hint="建议使用轻量模型，响应速度更快。">
          <div className="relative">
            <Cpu
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={config.modelId}
              onChange={(event) => update("modelId", event.target.value)}
              className={`${inputClass} pl-11`}
              placeholder="gemini-2.5-flash-lite"
            />
          </div>
        </SettingsField>

        <SettingsField label="灵魂 Prompt / 性格设定">
          <div className="relative">
            <MessageSquareText
              size={16}
              className="pointer-events-none absolute left-4 top-4 text-indigo-400"
            />
            <textarea
              value={promptText}
              onChange={(event) => updatePrompt(event.target.value)}
              className={`${inputClass} min-h-[190px] resize-y pl-11 leading-relaxed`}
              placeholder="输入 AI 的性格、行为模式和约束..."
            />
          </div>
        </SettingsField>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-5 dark:border-slate-700/50 dark:bg-slate-950/30">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-300">
                <SlidersHorizontal size={15} /> 最大回复 Tokens
              </span>
              <span className="rounded-md bg-indigo-500/10 px-2 py-1 text-[10px] font-black text-indigo-500">
                {config.maxOutputTokens}
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={1000}
              step={10}
              value={config.maxOutputTokens}
              onChange={(event) => update("maxOutputTokens", Number(event.target.value))}
              className="h-2 w-full cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-5 dark:border-slate-700/50 dark:bg-slate-950/30">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-300">
                <Sparkles size={15} /> 模型发散度
              </span>
              <span className="rounded-md bg-indigo-500/10 px-2 py-1 text-[10px] font-black text-indigo-500">
                {config.temperature}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={config.temperature}
              onChange={(event) => update("temperature", Number(event.target.value))}
              className="h-2 w-full cursor-pointer accent-indigo-500"
            />
            <p className="mt-3 text-[10px] leading-5 text-slate-400">
              数值越大越随机、有创造力；数值越小越稳定、严谨。
            </p>
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
