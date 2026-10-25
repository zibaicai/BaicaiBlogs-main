"use client";

import React, { useState, KeyboardEvent, useEffect } from 'react';
import { ImageIcon, Tag, FileText, X, Clock, CloudUpload, Smile, Save, Send } from 'lucide-react';
import type { Category } from '../../lib/api';
import { Select } from '../ui/Select';

interface Props {
  type: 'post' | 'chatter' | 'about';
  tags: string[]; setTags: React.Dispatch<React.SetStateAction<string[]>>;
  cover: string; setCover: (val: string) => void;
  summary: string; setSummary: (val: string) => void;
  categories: Category[];
  categoryId: string;
  setCategoryId: (val: string) => void;
  mood?: string; setMood?: (val: string) => void;
  allHistoryPostTags: string[];
  allHistoryChatterTags: string[];
  isLoadingTags: boolean;
  allHistoryMoods: string[];
  onSave: (isPublish: boolean) => void;
  isSaving: boolean;
  lastSaved: string | null;
  onOpenImageTool: () => void;
}

export default function MetaMatrix({
  type, tags, setTags, cover, setCover, summary, setSummary, categories, categoryId, setCategoryId, mood, setMood,
  allHistoryPostTags, allHistoryChatterTags, isLoadingTags, allHistoryMoods, onSave, isSaving, lastSaved, onOpenImageTool
}: Props) {
  const [tagInput, setTagInput] = useState('');
  const currentHistoryTags = type === 'chatter' ? allHistoryChatterTags : allHistoryPostTags;

  const handleAddTag = (e: KeyboardEvent<HTMLInputElement>) => {
    console.log(e);
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      const val = tagInput.trim().replace(/^#/, '');
      if (!tags.includes(val)) setTags([...tags, val]);
      setTagInput('');
    }
  };
  useEffect(() => {
    console.log(tags);
    
  }, [tags]);
  const Label = ({ icon: Icon, text, color }: any) => (
    <div className={`flex items-center gap-2 mb-3 border-l-4 ${color} pl-4`}>
      <Icon size={14} className="text-slate-400" />
      <span className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200">{text}</span>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* 头部标题 */}
      <div className="shrink-0 px-5 py-3 flex items-center justify-between border-b border-white/10 bg-white/5">
        <div>
          <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.25em]">{type} Mode</span>
          <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">属性设置</h2>
        </div>
        <span className="text-[9px] font-bold text-slate-500">内部滚动</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-6">

        {/* 1. 封面图区 */}
        <div className="flex flex-col">
          <Label icon={ImageIcon} text="Cover Image" color="border-indigo-500" />
          <div onClick={onOpenImageTool} className="w-full aspect-video bg-black/10 dark:bg-black/40 rounded-[32px] border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden mb-4 group relative cursor-pointer shadow-inner transition-all">
            {cover ? (
              <img src={cover} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <CloudUpload size={28} className="opacity-30 group-hover:opacity-100 group-hover:text-indigo-400 transition-all" />
                <span className="text-[9px] font-black uppercase tracking-widest">Click to Upload</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center backdrop-blur-sm transition-opacity">
              <span className="text-white text-xs font-bold tracking-widest">更换封面</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">分类</span>
            <Select
              value={categoryId}
              onChange={setCategoryId}
              ariaLabel="文章分类"
              placeholder="未分类 / 请选择根分类"
              options={[
                { value: "", label: "未分类 / 请选择根分类" },
                ...categories.map((category) => ({ value: String(category.id), label: category.path })),
              ]}
            />
            <span className="text-[9px] text-slate-500">必选一个分类；深层子分类可选。</span>
          </div>
        </div>

        {/* 2. 标签区 */}
        {type !== 'about' && (
          <div className="flex flex-col animate-in fade-in slide-in-from-bottom duration-500">
            <Label icon={Tag} text="Relevant Tags" color="border-pink-500" />
            <div className="flex flex-wrap gap-2 mb-4 p-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-white/5 shadow-inner">
              {tags.map(t => (
                <span key={t} className="px-3 py-1.5 bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-black rounded-xl flex items-center gap-2 shadow-sm border border-indigo-500/10">
                  #{t}
                  <button onClick={() => setTags(tags.filter(x => x !== t))} className="hover:text-red-500 transition-colors"><X size={10}/></button>
                </span>
              ))}
              <input
                type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag}
                placeholder="+" className="flex-1 min-w-[60px] bg-transparent text-xs outline-none text-slate-800 dark:text-white"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar">
              {isLoadingTags ? (
                <span className="text-[10px] text-slate-400 animate-pulse italic">扫描历史标签中...</span>
              ) : currentHistoryTags.length > 0 ? (
                currentHistoryTags.map(t => (
                  <button
                    key={t} disabled={tags.includes(t)} onClick={() => setTags([...tags, t])}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                      tags.includes(t) 
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 border-transparent opacity-50 cursor-not-allowed' 
                      : 'bg-white/10 text-slate-500 dark:text-slate-400 border-white/10 hover:bg-indigo-500 hover:text-white hover:border-indigo-500'
                    }`}
                  >
                    + {t}
                  </button>
                ))
              ) : (
                <span className="text-[10px] text-slate-500 italic">尚未发现标签</span>
              )}
            </div>
          </div>
        )}

        {/* 3. 心情区 */}
        {type === 'chatter' && setMood && (
          <div className="flex flex-col animate-in fade-in slide-in-from-bottom duration-700">
            <Label icon={Smile} text="Mood Today" color="border-yellow-500" />
            <input
              type="text" value={mood} onChange={(e) => setMood(e.target.value)} placeholder="输入心情词..."
              className="w-full bg-white/10 dark:bg-black/20 rounded-2xl px-5 py-4 text-xs text-slate-800 dark:text-slate-200 border border-white/10 outline-none focus:ring-2 focus:ring-yellow-500 mb-4 shadow-inner"
            />
            <div className="flex flex-wrap gap-2">
              {allHistoryMoods.map(h => (
                <button
                  key={h} onClick={() => setMood(h)}
                  className="px-4 py-1.5 bg-yellow-500/10 rounded-full text-[10px] font-bold text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500 hover:text-white transition-all shadow-sm"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="shrink-0 p-4 border-t border-white/10 bg-white/5 backdrop-blur-md">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
            <Clock size={12} />
            {isSaving ? "正在落盘至本地系统..." : lastSaved ? `最近落盘: ${lastSaved}` : "文档尚未在本地生成"}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onSave(false)} disabled={isSaving}
              className="flex-1 py-3.5 bg-white/20 hover:bg-white/30 text-slate-800 dark:text-white font-black text-[10px] uppercase tracking-widest rounded-2xl border border-white/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <Save size={14} /> 存为草稿
            </button>
            <button
              onClick={() => onSave(true)} disabled={isSaving}
              className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <Send size={14} /> 正式发布
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}