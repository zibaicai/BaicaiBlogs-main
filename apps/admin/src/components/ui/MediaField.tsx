"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { useToast } from "../ToastProvider";

interface MediaFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  hint?: string;
  multiple?: boolean;
  max?: number;
  kind?: "image" | "background";
  disabled?: boolean;
}

const ACCEPT = "image/jpeg,image/png,image/webp";

export default function MediaField({
  value,
  onChange,
  label = "图片",
  hint,
  multiple = true,
  max = 9,
  kind = "image",
  disabled = false,
}: MediaFieldProps) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState("");

  const limit = multiple ? max : 1;

  const addUrls = (urls: string[]) => {
    const next = [...value, ...urls].filter(Boolean).slice(0, limit);
    onChange(next);
  };

  const upload = async (files: FileList | File[]) => {
    if (disabled) return;
    const list = Array.from(files).filter((file) => ACCEPT.split(",").includes(file.type));
    if (!list.length) {
      showToast("仅支持 JPEG / PNG / WebP 图片", "warning");
      return;
    }
    if (!multiple && value.length >= 1) {
      onChange([]);
    }
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of list.slice(0, Math.max(1, limit - value.length))) {
        const res = kind === "background" ? await api.uploadBackground(file) : await api.uploadImage(file);
        if (!res.success || !res.data) throw new Error(res.message || "上传失败");
        uploaded.push(res.data);
      }
      addUrls(uploaded);
      showToast(`已上传 ${uploaded.length} 张图片`, "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "图片上传失败", "warning");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const addUrl = () => {
    const next = url.trim();
    if (!next) return;
    addUrls([next]);
    setUrl("");
  };

  return (
    <div className="flex flex-col gap-2">
      {(label || hint) && (
        <div className="flex items-end justify-between gap-3">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</span>
          {hint && <span className="text-[9px] font-bold text-slate-500">{hint}</span>}
        </div>
      )}

      {value.length > 0 && (
        <div className={`grid gap-2 ${multiple ? "grid-cols-3" : "grid-cols-1"}`}>
          {value.map((item, index) => (
            <div key={`${item}-${index}`} className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/20">
              <img src={item} alt="" className="h-24 w-full object-cover" />
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100 disabled:hidden"
                aria-label="移除图片"
              >
                <Trash2 size={12} />
              </button>
              {multiple && <span className="absolute bottom-1.5 left-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-bold text-white">{index + 1}</span>}
            </div>
          ))}
        </div>
      )}

      {value.length < limit && (
        <div
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (event.dataTransfer.files?.length) void upload(event.dataTransfer.files);
          }}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed px-4 py-5 transition-colors ${
            dragging ? "border-indigo-400 bg-indigo-500/10" : "border-white/15 bg-black/10 hover:border-indigo-400/50 hover:bg-white/5"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <input ref={inputRef} type="file" accept={ACCEPT} multiple={multiple} className="hidden" disabled={disabled} onChange={(event) => event.target.files && void upload(event.target.files)} />
          {uploading ? <Loader2 size={16} className="animate-spin text-indigo-400" /> : <ImagePlus size={16} className="text-indigo-400" />}
          <span className="text-xs font-bold text-slate-300">{uploading ? "上传中…" : "点击或拖拽上传图片"}</span>
          {multiple && <span className="text-[10px] font-bold text-slate-500">{value.length}/{limit}</span>}
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Link2 size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addUrl())}
            placeholder="或粘贴图片 URL"
            disabled={disabled || value.length >= limit}
            className="h-9 w-full rounded-xl border border-white/10 bg-black/20 pl-8 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-indigo-400/50 disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          onClick={addUrl}
          disabled={disabled || !url.trim() || value.length >= limit}
          className="flex h-9 items-center gap-1 rounded-xl bg-white/5 px-3 text-[10px] font-black text-slate-300 hover:bg-white/10 disabled:opacity-40"
        >
          <Plus size={12} /> 添加
        </button>
      </div>
    </div>
  );
}
