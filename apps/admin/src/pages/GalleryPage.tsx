import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { api, uploadToOss, type GalleryAlbum, type GalleryPhoto } from "../lib/api";
import AuthImage from "../components/AuthImage";
import { useToast } from "../components/ToastProvider";
import { AdminEmptyState, AdminLoading, AdminPageHeader, AdminPageShell } from "../components/admin/AdminUI";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";

function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

const VISIBILITY_OPTIONS = [
  { value: "PUBLIC", label: "公开" },
  { value: "PASSWORD", label: "密码" },
  { value: "PRIVATE", label: "私密" },
];

export default function GalleryPage() {
  const { showToast } = useToast();
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [selected, setSelected] = useState<GalleryAlbum | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [newTitle, setNewTitle] = useState("");
  const [newVisibility, setNewVisibility] = useState("PUBLIC");
  const [newPassword, setNewPassword] = useState("");
  const [hideCount, setHideCount] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadAlbums = async (keepId?: string) => {
    setLoading(true);
    try {
      const res = await api.myAlbums();
      setAlbums(res.data || []);
      const id = keepId || selected?.albumId;
      if (id) {
        await loadAlbum(id);
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "加载相册失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadAlbum = async (albumId: string) => {
    try {
      const res = await api.get<GalleryAlbum>(`/public/gallery/albums/${encodeURIComponent(albumId)}`);
      if (res.success) {
        setSelected(res.data);
        setHideCount(Boolean(res.data.hidePhotoCount));
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "加载相册失败", "error");
    }
  };

  useEffect(() => {
    void loadAlbums();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createAlbum = async () => {
    if (!newTitle.trim()) {
      showToast("请填写相册名称", "warning");
      return;
    }
    try {
      const res = await api.createAlbum({
        title: newTitle.trim(),
        visibility: newVisibility,
        password: newVisibility === "PASSWORD" ? newPassword : undefined,
      });
      if (!res.success) throw new Error(res.message);
      setNewTitle("");
      setNewPassword("");
      showToast("相册已创建", "success");
      await loadAlbums(res.data.albumId);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "创建失败", "error");
    }
  };

  const saveAlbum = async () => {
    if (!selected) return;
    try {
      const res = await api.updateAlbum(selected.albumId, {
        title: selected.title,
        description: selected.description,
        visibility: selected.visibility,
        password: newPassword || undefined,
        hidePhotoCount: hideCount,
      });
      if (!res.success) throw new Error(res.message);
      showToast("相册已更新", "success");
      setNewPassword("");
      setEditMode(false);
      await loadAlbums(selected.albumId);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "更新失败", "error");
    }
  };

  const requestAccess = async () => {
    if (!selected) return;
    const reason = window.prompt("申请查看原因（至少 10 个字，用于合规审计）");
    if (!reason || reason.trim().length < 10) return;
    try {
      const res = await api.requestAccess(selected.albumId, reason.trim());
      showToast(res.message || "申请已提交", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "申请失败", "error");
    }
  };

  const deleteAlbum = async () => {
    if (!selected) return;
    if (!confirm(`删除相册「${selected.title}」及其中所有图片？不可恢复。`)) return;
    try {
      await api.deleteAlbum(selected.albumId);
      showToast("相册已删除", "success");
      setSelected(null);
      await loadAlbums();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "删除失败", "error");
    }
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!selected || !files || files.length === 0) return;
    const list = Array.from(files).slice(0, 10);
    if (files.length > 10) showToast("单次最多上传 10 张，已截取前 10 张", "warning");

    setUploading(true);
    try {
      const presign = await api.presignPhotos(
        selected.albumId,
        list.map((f) => ({ name: f.name, type: f.type, size: f.size }))
      );
      if (!presign.success) throw new Error(presign.message);

      const confirmed: any[] = [];
      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        const item = presign.data[i];
        setProgress((p) => ({ ...p, [file.name]: 0 }));
        await uploadToOss(item.uploadUrl, file, (percent) =>
          setProgress((p) => ({ ...p, [file.name]: percent }))
        );
        const size = await readImageSize(file);
        confirmed.push({
          key: item.key,
          width: size.width,
          height: size.height,
          bytes: file.size,
          mime: file.type,
          caption: file.name.replace(/\.[^.]+$/, ""),
        });
        setProgress((p) => ({ ...p, [file.name]: 100 }));
      }

      const res = await api.confirmPhotos(selected.albumId, confirmed);
      if (!res.success) throw new Error(res.message);
      showToast(`已上传 ${res.data.length} 张图片`, "success");
      await loadAlbums(selected.albumId);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "上传失败", "error");
    } finally {
      setUploading(false);
      setProgress({});
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const deletePhoto = async (photo: GalleryPhoto) => {
    if (!confirm("删除后不可恢复，且会立即释放存储配额。确认删除？")) return;
    try {
      await api.deletePhoto(photo.id);
      showToast("图片已删除", "success");
      if (selected) await loadAlbum(selected.albumId);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "删除失败", "error");
    }
  };

  const movePhoto = async (index: number, direction: -1 | 1) => {
    if (!selected?.photos) return;
    const photos = [...selected.photos];
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    [photos[index], photos[target]] = [photos[target], photos[index]];
    const items = photos.map((p, i) => ({ photoId: p.id, weight: (photos.length - i) * 10 }));
    try {
      await api.reorderPhotos(selected.albumId, items);
      setSelected({ ...selected, photos });
    } catch (e) {
      showToast(e instanceof Error ? e.message : "排序失败", "error");
    }
  };

  const photos = selected?.photos || [];

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="影像"
        description="单次最多 10 张、单张 10MB；权重最高的图片自动成为封面"
        eyebrow="图库"
        actions={
          <Button variant="secondary" onClick={() => void loadAlbums(selected?.albumId)} disabled={loading}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> 刷新
          </Button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">相册</span>
            <span className="text-[10px] text-slate-600">{albums.length} 个</span>
          </div>

          <div className="space-y-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="新相册名称"
              aria-label="新相册名称"
            />
            <div className="flex gap-1.5">
              <Select
                value={newVisibility}
                onChange={setNewVisibility}
                ariaLabel="新相册可见性"
                className="flex-1"
                options={VISIBILITY_OPTIONS}
              />
              <Button onClick={() => void createAlbum()} className="shrink-0">
                <Plus size={13} /> 新建
              </Button>
            </div>
            {newVisibility === "PASSWORD" && (
              <Input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="相册密码"
                type="password"
                aria-label="相册密码"
              />
            )}
          </div>

          <div className="admin-scrollbar max-h-[65vh] space-y-1 overflow-y-auto pr-0.5">
            {loading && albums.length === 0 ? (
              <AdminLoading label="正在加载相册…" />
            ) : albums.length === 0 ? (
              <p className="px-2 py-6 text-center text-[10px] text-slate-500">还没有相册，先在上方创建一个。</p>
            ) : (
              albums.map((album) => (
                <button
                  key={album.albumId}
                  onClick={() => void loadAlbum(album.albumId)}
                  className={`flex w-full items-center gap-2 rounded-lg border p-1.5 text-left transition-colors ${
                    selected?.albumId === album.albumId
                      ? "border-indigo-400/40 bg-indigo-500/15"
                      : "border-transparent bg-white/[0.02] hover:bg-white/5"
                  }`}
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-slate-800">
                    {album.coverThumbUrl ? (
                      <AuthImage src={album.coverThumbUrl} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-500">
                        <ImageIcon size={15} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-bold text-slate-100">{album.title}</div>
                    <div className="mt-0.5 truncate text-[9px] text-slate-500">
                      {album.photoCount ?? 0} 张 · {album.visibility}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="min-h-[60vh] rounded-xl border border-white/10 bg-white/[0.03] p-3">
          {!selected ? (
            <div className="flex min-h-[55vh] items-center justify-center">
              <div className="w-full max-w-sm">
                <AdminEmptyState
                  title="未选择相册"
                  description="从左侧选择一个相册，或新建一个相册开始整理影像。"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-white">{selected.title}</h2>
                  <div className="mt-0.5 text-[10px] text-slate-500">
                    {selected.photoCount} 张 · 封面 = 权重最高 · 状态：{selected.status}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {selected.isOwner === false ? (
                    <button
                      onClick={() => void requestAccess()}
                      className="inline-flex h-8 items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 text-[10px] font-bold text-amber-300 hover:bg-amber-500/20"
                    >
                      <Lock size={12} /> 申请查看
                    </button>
                  ) : (
                    <>
                      <Button variant="secondary" onClick={() => setEditMode((v) => !v)}>
                        {editMode ? "收起编辑" : "编辑相册"}
                      </Button>
                      <button
                        onClick={() => void deleteAlbum()}
                        className="inline-flex h-8 items-center gap-1 rounded-lg bg-red-500/10 px-2.5 text-[10px] font-bold text-red-300 hover:bg-red-500/20"
                      >
                        <Trash2 size={12} /> 删除
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editMode && (
                <div className="grid grid-cols-1 gap-2 rounded-lg border border-white/5 bg-black/15 p-2.5 md:grid-cols-3">
                  <Input
                    value={selected.title}
                    onChange={(e) => setSelected({ ...selected, title: e.target.value })}
                    placeholder="相册标题"
                    aria-label="相册标题"
                  />
                  <Select
                    value={selected.visibility}
                    onChange={(value) => setSelected({ ...selected, visibility: value })}
                    ariaLabel="相册可见性"
                    options={VISIBILITY_OPTIONS}
                  />
                  <Input
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    type="password"
                    placeholder={selected.hasPassword ? "新密码（留空不变）" : "设置密码"}
                    aria-label="相册密码"
                  />
                  <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 md:col-span-3">
                    <input
                      type="checkbox"
                      checked={hideCount}
                      onChange={(e) => setHideCount(e.target.checked)}
                      className="h-3.5 w-3.5 accent-indigo-500"
                    />
                    未解锁时隐藏照片数量
                  </label>
                  <Button onClick={() => void saveAlbum()} className="w-full md:col-span-3">
                    保存相册设置
                  </Button>
                </div>
              )}

              {selected.isOwner !== false && (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="cursor-pointer rounded-xl border border-dashed border-white/15 bg-black/10 p-4 text-center transition-colors hover:border-indigo-400/60"
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                    multiple
                    className="hidden"
                    onChange={(e) => void uploadFiles(e.target.files)}
                  />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-indigo-400" size={18} />
                      <div className="text-[11px] font-bold text-slate-300">上传中...</div>
                      <div className="w-full max-w-md space-y-1">
                        {Object.entries(progress).map(([name, percent]) => (
                          <div key={name} className="text-left text-[10px] text-slate-400">
                            <div className="truncate">{name}</div>
                            <div className="mt-1 h-1 rounded-full bg-white/10">
                              <div className="h-1 rounded-full bg-indigo-500" style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-slate-400">
                      <UploadCloud size={22} />
                      <div className="text-[11px] font-bold">点击选择图片（最多 10 张，单张 10MB）</div>
                      <div className="text-[9px]">浏览器直传 OSS，不经过服务器</div>
                    </div>
                  )}
                </div>
              )}

              {photos.length > 0 && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                  {photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="group relative overflow-hidden rounded-lg border border-white/10 bg-slate-800"
                    >
                      <div className="relative aspect-square">
                        <AuthImage src={photo.thumbUrl} alt={photo.caption} className="h-full w-full object-cover" />
                        {index === 0 && (
                          <span className="absolute left-1.5 top-1.5 rounded bg-indigo-500 px-1.5 py-0.5 text-[8px] font-bold text-white">
                            封面
                          </span>
                        )}
                        {photo.status !== "VISIBLE" && (
                          <span className="absolute right-1.5 top-1.5 rounded bg-amber-500 px-1.5 py-0.5 text-[8px] font-bold text-black">
                            审核中
                          </span>
                        )}
                      </div>
                      <div className="p-2">
                        <div className="truncate text-[10px] text-slate-300">{photo.caption || `图片 ${photo.id}`}</div>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-[9px] text-slate-500">权重 {photo.weight}</span>
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => void movePhoto(index, -1)}
                              className="rounded bg-white/5 p-1 text-slate-300 hover:bg-white/10"
                              title="上移"
                            >
                              <ChevronUp size={12} />
                            </button>
                            <button
                              onClick={() => void movePhoto(index, 1)}
                              className="rounded bg-white/5 p-1 text-slate-300 hover:bg-white/10"
                              title="下移"
                            >
                              <ChevronDown size={12} />
                            </button>
                            <button
                              onClick={() => void deletePhoto(photo)}
                              className="rounded bg-red-500/10 p-1 text-red-400 hover:bg-red-500 hover:text-white"
                              title="删除"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {photos.length === 0 && (
                <AdminEmptyState title="还没有图片" description="点击上方上传区域，添加第一批影像。" />
              )}
            </div>
          )}
        </section>
      </div>
    </AdminPageShell>
  );
}
