"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, Trash2, UploadCloud } from "lucide-react";
import { api } from "../../lib/api";
import { useToast } from "../ToastProvider";
import {
  inputClass,
  SettingsCard,
  SettingsSaveButton,
} from "./SettingsControls";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function BackgroundSection({ formData, handleUpdate, pushToQueue }: any) {
  const { showToast } = useToast();
  const images: string[] = Array.isArray(formData?.bgImages) ? formData.bgImages : [];

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const removeImage = (index: number) => {
    handleUpdate(
      "bgImages",
      images.filter((_, current) => current !== index)
    );
    showToast("已移除一张背景图", "success");
  };

  const addUrl = () => {
    const url = String(formData?.newBgUrl || "").trim();
    if (!url) {
      showToast("URL 不能为空", "warning");
      return;
    }
    if (images.includes(url)) {
      showToast("这张图已经在背景列表中", "warning");
      return;
    }
    handleUpdate("bgImages", [...images, url]);
    handleUpdate("newBgUrl", "");
    showToast("背景图已添加", "success");
  };

  const uploadFile = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast("仅支持 JPEG / PNG / WebP 背景图", "warning");
      return;
    }

    setUploading(true);
    setPendingUrl(null);
    try {
      const response = await api.uploadBackground(file);
      if (!response.success || !response.data) {
        throw new Error(response.message || "上传失败");
      }
      setPendingUrl(response.data);
      showToast("背景图已上传，请确认是否加入背景库", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "背景图上传失败", "warning");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const confirmPending = () => {
    if (!pendingUrl) return;
    handleUpdate("bgImages", [...images, pendingUrl]);
    setPendingUrl(null);
    showToast("已加入视觉背景库", "success");
  };

  const cancelPending = () => {
    setPendingUrl(null);
    showToast("已取消加入背景库，图片仍保留在图床中", "info");
  };

  return (
    <SettingsCard
      title="视觉背景配置"
      description={`管理全站轮播背景图，当前 ${images.length} 张`}
      icon={<ImagePlus size={20} className="text-indigo-400" />}
      action={
        <SettingsSaveButton onClick={() => pushToQueue("视觉背景图", "bgImages", images)}>
          暂存背景修改
        </SettingsSaveButton>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="max-h-[430px] overflow-y-auto rounded-2xl bg-slate-100/60 p-4 custom-scrollbar dark:bg-slate-800/40">
          <div className="grid grid-cols-2 gap-3">
            {images.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="group relative aspect-video overflow-hidden rounded-xl border border-white/30 shadow-sm"
              >
                <img src={url} alt={`背景图 ${index + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute inset-0 flex items-center justify-center bg-slate-950/45 text-white opacity-0 transition group-hover:opacity-100"
                  aria-label={`删除背景图 ${index + 1}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          {images.length === 0 && (
            <div className="flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-xs text-slate-400 dark:border-slate-600">
              还没有背景图
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-slate-200/70 bg-white/45 p-4 dark:border-slate-700/50 dark:bg-slate-800/40">
            <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              <Link2 size={13} /> 粘贴网络图片 URL
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                value={formData?.newBgUrl || ""}
                onChange={(event) => handleUpdate("newBgUrl", event.target.value)}
                placeholder="https://..."
                className={`${inputClass} flex-1 py-2.5`}
              />
              <button
                type="button"
                onClick={addUrl}
                className="rounded-xl bg-emerald-500 px-4 text-xs font-black text-white transition hover:bg-emerald-600"
              >
                添加
              </button>
            </div>
          </div>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const file = event.dataTransfer.files?.[0];
              if (file) void uploadFile(file);
            }}
            onClick={() => !uploading && fileInput.current?.click()}
            className={`flex min-h-[190px] flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition ${
              dragging
                ? "border-indigo-400 bg-indigo-500/10"
                : "border-slate-300 hover:border-indigo-400 dark:border-slate-600"
            }`}
          >
            <input
              ref={fileInput}
              type="file"
              accept={ALLOWED_TYPES.join(",")}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadFile(file);
              }}
            />
            <UploadCloud size={26} className="text-indigo-400" />
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {uploading ? "正在上传到图床…" : "点击或拖拽图片到这里"}
              </p>
              <p className="mt-1 text-[10px] text-slate-400">JPEG / PNG / WebP</p>
            </div>
          </div>
        </div>
      </div>

      {pendingUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white p-6 shadow-2xl dark:bg-slate-800">
            <h3 className="mb-2 text-center text-lg font-black text-slate-800 dark:text-white">
              图片上传成功
            </h3>
            <p className="mb-4 text-center text-xs text-slate-500 dark:text-slate-400">
              是否将这张图片加入网站轮播背景？
            </p>
            <div className="mb-5 aspect-video overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <img src={pendingUrl} alt="待确认背景图" className="h-full w-full object-cover" />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={cancelPending}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
              >
                仅上传，不加入
              </button>
              <button
                type="button"
                onClick={confirmPending}
                className="flex-1 rounded-xl bg-indigo-500 py-2.5 text-xs font-black text-white transition hover:bg-indigo-600"
              >
                加入背景库
              </button>
            </div>
          </div>
        </div>
      )}
    </SettingsCard>
  );
}
