"use client";

import { useRef, useState } from "react";
import { Check, Clipboard, ImagePlus, Link2, LoaderCircle, UploadCloud, X } from "lucide-react";
import { api } from "../../lib/api";
import { useToast } from "../ToastProvider";

type ImageToolProps = {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string) => void;
  mode?: "insert" | "cover";
};

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

async function prepareCover(file: File) {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("仅支持 JPEG / PNG / WebP 图片");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const width = 1000;
    const height = 563;
    const ratio = width / height;
    let cropW = bitmap.width;
    let cropH = bitmap.height;

    if (cropW / cropH > ratio) cropW = Math.round(cropH * ratio);
    else cropH = Math.round(cropW / ratio);

    const sx = Math.round((bitmap.width - cropW) / 2);
    const sy = Math.round((bitmap.height - cropH) / 2);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("浏览器不支持图片压缩");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, sx, sy, cropW, cropH, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error("图片压缩失败"))),
        "image/jpeg",
        0.82
      );
    });

    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "cover"}.jpg`, {
      type: "image/jpeg",
    });
  } finally {
    bitmap.close();
  }
}

export default function FloatingImageTool({
  isOpen,
  onClose,
  onInsert,
  mode = "insert",
}: ImageToolProps) {
  const { showToast } = useToast();
  const [tab, setTab] = useState<"upload" | "url">("url");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");
  const [url, setUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const finish = (value: string) => {
    onInsert(value);
    setPreview("");
    setUrl("");
    if (mode === "cover") {
      onClose();
      showToast("封面已更新，请保存或发布", "success");
    }
  };

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const prepared = mode === "cover" ? await prepareCover(file) : file;
      const response = await api.uploadImage(prepared);
      if (!response.success || !response.data) {
        throw new Error(response.message || "上传失败");
      }

      if (mode === "cover") {
        finish(response.data);
      } else {
        setPreview(response.data);
        showToast("图片已上传", "success");
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "上传失败", "warning");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const confirmUrl = () => {
    const value = url.trim();
    if (!value) {
      showToast("请输入图片 URL", "warning");
      return;
    }
    if (!/\.(jpe?g|gif|png|webp|svg|avif)$|^data:image/i.test(value)) {
      showToast("这似乎不是标准图片链接，仍会尝试使用", "warning");
    }
    if (mode === "cover") {
      finish(value);
    } else {
      setPreview(value);
      showToast("图片预览已生成", "success");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-[5vw] top-[15vh] z-[99999] w-80 overflow-hidden rounded-3xl border border-white/50 bg-white/85 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/90">
      <header className="flex items-center justify-between border-b border-white/30 bg-white/50 px-5 py-4 dark:border-slate-700/50 dark:bg-slate-800/50">
        <h3 className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-100">
          <ImagePlus size={17} className="text-emerald-500" />
          {mode === "cover" ? "封面工作台" : "图片工作台"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 text-slate-400 transition hover:bg-rose-500 hover:text-white"
          aria-label="关闭图片工作台"
        >
          <X size={16} />
        </button>
      </header>

      <div className="p-5">
        {!preview && (
          <div className="mb-4 flex rounded-xl bg-slate-200/60 p-1 dark:bg-slate-800/60">
            <button
              type="button"
              onClick={() => setTab("upload")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                tab === "upload"
                  ? "bg-white text-emerald-500 shadow-sm dark:bg-slate-700"
                  : "text-slate-500"
              }`}
            >
              云端上传
            </button>
            <button
              type="button"
              onClick={() => setTab("url")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                tab === "url"
                  ? "bg-white text-emerald-500 shadow-sm dark:bg-slate-700"
                  : "text-slate-500"
              }`}
            >
              外链插入
            </button>
          </div>
        )}

        {preview ? (
          <div className="space-y-4">
            <div className="flex h-36 items-center justify-center overflow-hidden rounded-xl border border-white/40 bg-white/60 p-2 dark:border-slate-700/50 dark:bg-slate-950/40">
              <img src={preview} alt="图片预览" className="max-h-full max-w-full rounded-lg object-contain" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(preview);
                  showToast("链接已复制", "success");
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-white/70 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-white dark:bg-slate-800/70 dark:text-slate-200"
              >
                <Clipboard size={13} /> 复制链接
              </button>
              <button
                type="button"
                onClick={() => {
                  onInsert(preview);
                  setPreview("");
                  showToast(mode === "cover" ? "封面已更新" : "图片已插入", "success");
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 text-xs font-black text-white transition hover:bg-emerald-600"
              >
                <Check size={13} /> {mode === "cover" ? "设为封面" : "嵌入正文"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setPreview("");
                setUrl("");
              }}
              className="w-full text-center text-[10px] font-bold text-slate-400 hover:text-indigo-500"
            >
              重新选择
            </button>
          </div>
        ) : tab === "upload" ? (
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const file = event.dataTransfer.files?.[0];
              if (file) void upload(file);
            }}
            onClick={() => inputRef.current?.click()}
            className={`flex h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed text-center transition ${
              dragging
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-slate-300 hover:border-emerald-400 dark:border-slate-600"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ALLOWED.join(",")}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
              }}
            />
            {uploading ? <LoaderCircle size={28} className="animate-spin text-emerald-500" /> : <UploadCloud size={28} className="text-emerald-500" />}
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {uploading ? "正在上传…" : "点击或拖拽图片到这里"}
              </p>
              <p className="mt-1 text-[10px] text-slate-400">JPEG / PNG / WebP</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3 top-3.5 text-slate-400" size={15} />
              <textarea
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="粘贴图片链接 https://..."
                className="h-24 w-full resize-none rounded-xl border border-slate-200 bg-white/70 p-3 pl-9 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200"
              />
            </div>
            <button
              type="button"
              onClick={confirmUrl}
              className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-black text-white transition hover:opacity-90 dark:bg-white dark:text-slate-900"
            >
              确认图片链接
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
