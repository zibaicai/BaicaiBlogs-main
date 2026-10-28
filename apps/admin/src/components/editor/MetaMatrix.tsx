"use client";

import React, { useState, type KeyboardEvent } from "react";
import { Clock3, Image as ImageIcon, Save, Send, Smile, Tag, X } from "lucide-react";
import type { Category } from "../../lib/api";
import { Select } from "../ui/Select";
import MediaField from "../ui/MediaField";

type EditorType = "post" | "chatter" | "about";

interface MetaMatrixProps {
  type: EditorType;
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  cover: string;
  setCover: (value: string) => void;
  summary: string;
  setSummary: (value: string) => void;
  categories: Category[];
  categoryId: string;
  setCategoryId: (value: string) => void;
  mood?: string;
  setMood?: (value: string) => void;
  allHistoryPostTags: string[];
  allHistoryChatterTags: string[];
  isLoadingTags: boolean;
  allHistoryMoods: string[];
  onSave: (publish: boolean) => void;
  isSaving: boolean;
  lastSaved: string | null;
  onOpenImageTool: () => void;
}

function SectionLabel({ icon: Icon, text }: { icon: typeof Tag; text: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
      <Icon size={14} className="text-slate-400" />
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200">
        {text}
      </span>
    </div>
  );
}

export default function MetaMatrix({
  type,
  tags,
  setTags,
  cover,
  setCover,
  summary,
  setSummary,
  categories,
  categoryId,
  setCategoryId,
  mood,
  setMood,
  allHistoryPostTags,
  allHistoryChatterTags,
  isLoadingTags,
  allHistoryMoods,
  onSave,
  isSaving,
  lastSaved,
  onOpenImageTool,
}: MetaMatrixProps) {
  const [tagInput, setTagInput] = useState("");
  const historyTags = type === "chatter" ? allHistoryChatterTags : allHistoryPostTags;

  const commitTag = () => {
    const value = tagInput.trim().replace(/^#/, "");
    if (!value) return;
    if (!tags.includes(value)) setTags([...tags, value]);
    setTagInput("");
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitTag();
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex shrink-0 items-end justify-between border-b border-white/10 bg-white/5 px-5 py-4">
        <div>
          <span className="text-[9px] font-black uppercase tracking-[0.22em] text-indigo-500">
            {type} mode
          </span>
          <h2 className="mt-1 text-base font-black text-slate-900 dark:text-white">属性设置</h2>
        </div>
        <button
          type="button"
          onClick={onOpenImageTool}
          className="rounded-xl bg-indigo-500/10 px-3 py-2 text-[10px] font-black text-indigo-500 transition hover:bg-indigo-500 hover:text-white"
        >
          图片工具
        </button>
      </header>

      <div className="custom-scrollbar flex-1 space-y-7 overflow-y-auto p-5">
        <section>
          <SectionLabel icon={ImageIcon} text="Cover image" />
          <MediaField
            label="封面图"
            hint="16:9，上传后自动压缩"
            value={cover ? [cover] : []}
            onChange={(images) => setCover(images[0] || "")}
            multiple={false}
            max={1}
            kind="image"
          />

          <div className="mt-4">
            <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
              分类
            </span>
            <Select
              value={categoryId}
              onChange={setCategoryId}
              ariaLabel="文章分类"
              placeholder="未分类 / 请选择根分类"
              options={[
                { value: "", label: "未分类 / 请选择根分类" },
                ...categories.map((category) => ({
                  value: String(category.id),
                  label: category.path,
                })),
              ]}
            />
            <p className="mt-2 text-[9px] text-slate-500">必选一个分类；深层子分类可选。</p>
          </div>
        </section>

        {type !== "about" && (
          <section>
            <SectionLabel icon={Tag} text="Relevant tags" />
            <div className="mb-3 flex min-h-12 flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/5 p-3 dark:bg-white/5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-500/15 bg-indigo-500/10 px-2.5 py-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-300"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((item) => item !== tag))}
                    className="text-indigo-400 transition hover:text-rose-500"
                    aria-label={`删除标签 ${tag}`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={commitTag}
                placeholder="输入标签后按 Enter"
                className="min-w-[120px] flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400 dark:text-white"
              />
            </div>

            <div className="custom-scrollbar flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
              {isLoadingTags && <span className="text-[10px] italic text-slate-400">扫描历史标签中…</span>}
              {!isLoadingTags &&
                historyTags.map((tag) => {
                  const selected = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      disabled={selected}
                      onClick={() => setTags([...tags, tag])}
                      className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition ${
                        selected
                          ? "border-transparent bg-slate-200 text-slate-400 opacity-50 dark:bg-slate-700"
                          : "border-white/10 bg-white/10 text-slate-500 hover:border-indigo-500 hover:bg-indigo-500 hover:text-white dark:text-slate-400"
                      }`}
                    >
                      + {tag}
                    </button>
                  );
                })}
              {!isLoadingTags && historyTags.length === 0 && (
                <span className="text-[10px] italic text-slate-500">尚未发现历史标签</span>
              )}
            </div>
          </section>
        )}

        {type === "chatter" && setMood && (
          <section>
            <SectionLabel icon={Smile} text="Mood today" />
            <input
              value={mood || ""}
              onChange={(event) => setMood(event.target.value)}
              placeholder="输入今天的心情…"
              className="mb-3 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-black/20 dark:text-slate-200"
            />
            <div className="flex flex-wrap gap-2">
              {allHistoryMoods.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMood(item)}
                  className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 text-[10px] font-bold text-yellow-600 transition hover:bg-yellow-500 hover:text-white dark:text-yellow-400"
                >
                  {item}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      <footer className="shrink-0 border-t border-white/10 bg-white/5 p-4 backdrop-blur-md">
        <div className="mb-3 flex items-center gap-2 text-[9px] font-bold text-slate-400">
          <Clock3 size={12} />
          {isSaving
            ? "保存中…"
            : lastSaved
              ? `最近保存：${lastSaved}`
              : "尚未生成本地文档"}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => onSave(false)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/20 py-3 text-[10px] font-black uppercase tracking-widest text-slate-700 transition hover:bg-white/30 disabled:opacity-50 dark:text-white"
          >
            <Save size={14} /> 存为草稿
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => onSave(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-50"
          >
            <Send size={14} /> 正式发布
          </button>
        </div>
      </footer>
    </div>
  );
}
