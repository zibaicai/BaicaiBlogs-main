import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">图片墙</h1>
          <p className="text-sm text-slate-400 mt-1 font-bold">
            单次最多 10 张、单张 10MB；权重最高的图片自动成为封面
          </p>
        </div>
        <button
          onClick={() => void loadAlbums(selected?.albumId)}
          className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-slate-300 text-xs font-black flex items-center gap-2 hover:bg-white/10"
        >
          <RefreshCw size={14} /> 刷新
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-5 items-start">
        <aside className="rounded-3xl bg-white/5 border border-white/10 p-4">
          <div className="space-y-3 mb-5">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="新相册名称"
              className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <Select
                value={newVisibility}
                onChange={setNewVisibility}
                ariaLabel="新相册可见性"
                className="flex-1 !h-10"
                options={[
                  { value: "PUBLIC", label: "公开" },
                  { value: "PASSWORD", label: "密码" },
                  { value: "PRIVATE", label: "私密" },
                ]}
              />
              <button
                onClick={createAlbum}
                className="px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-black flex items-center gap-1"
              >
                <Plus size={14} /> 新建
              </button>
            </div>
            {newVisibility === "PASSWORD" && (
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="相册密码"
                type="password"
                className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-sm text-slate-100 outline-none"
              />
            )}
          </div>

          <div className="space-y-2 max-h-[65vh] overflow-y-auto admin-scrollbar pr-1">
            {albums.map((album) => (
              <button
                key={album.albumId}
                onClick={() => void loadAlbum(album.albumId)}
                className={`w-full text-left rounded-2xl p-2.5 border transition-all flex gap-3 items-center ${
                  selected?.albumId === album.albumId
                    ? "bg-indigo-500/20 border-indigo-400/40"
                    : "bg-black/10 border-white/5 hover:bg-white/5"
                }`}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                  {album.coverThumbUrl ? (
                    <AuthImage src={album.coverThumbUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <ImageIcon size={18} />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-100 truncate">{album.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {album.photoCount} 张 · {album.visibility}
                  </div>
                </div>
              </button>
            ))}
            {!loading && albums.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-500">还没有相册</div>
            )}
          </div>
        </aside>

        <section className="rounded-3xl bg-white/5 border border-white/10 p-5 min-h-[60vh]">
          {!selected ? (
            <div className="h-full min-h-[50vh] flex flex-col items-center justify-center text-slate-500 gap-3">
              <ImageIcon size={28} />
              <div className="text-sm font-bold">选择左侧相册，或新建一个</div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white">{selected.title}</h2>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {selected.photoCount} 张 · 封面 = 权重最高 · 状态：{selected.status}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selected.isOwner === false ? (
                    <button
                      onClick={() => void requestAccess()}
                      className="px-3 py-2 rounded-xl bg-amber-500/10 text-amber-300 text-xs font-bold flex items-center gap-1"
                    >
                      <Lock size={13} /> 申请查看
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditMode((v) => !v)}
                        className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300"
                      >
                        {editMode ? "收起编辑" : "编辑相册"}
                      </button>
                      <button
                        onClick={deleteAlbum}
                        className="px-3 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold flex items-center gap-1"
                      >
                        <Trash2 size={13} /> 删除
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editMode && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-2xl bg-black/15 p-4 border border-white/5">
                  <input
                    value={selected.title}
                    onChange={(e) => setSelected({ ...selected, title: e.target.value })}
                    className="rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-sm text-slate-100"
                  />
                  <Select
                    value={selected.visibility}
                    onChange={(value) => setSelected({ ...selected, visibility: value })}
                    ariaLabel="相册可见性"
                    className="!h-10"
                    options={[
                      { value: "PUBLIC", label: "公开" },
                      { value: "PASSWORD", label: "密码" },
                      { value: "PRIVATE", label: "私密" },
                    ]}
                  />
                  <input
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    type="password"
                    placeholder={selected.hasPassword ? "新密码（留空不变）" : "设置密码"}
                    className="rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-sm text-slate-100"
                  />
                  <label className="md:col-span-3 flex items-center gap-2 text-xs text-slate-400 font-bold">
                    <input
                      type="checkbox"
                      checked={hideCount}
                      onChange={(e) => setHideCount(e.target.checked)}
                      className="w-4 h-4 accent-indigo-500"
                    />
                    未解锁时隐藏照片数量
                  </label>
                  <button
                    onClick={saveAlbum}
                    className="md:col-span-3 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-black"
                  >
                    保存相册设置
                  </button>
                </div>
              )}

              {selected.isOwner !== false && (
              <div
                onClick={() => fileRef.current?.click()}
                className="rounded-3xl border-2 border-dashed border-white/15 hover:border-indigo-400/60 bg-black/10 p-8 text-center cursor-pointer transition-colors"
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
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-indigo-400" />
                    <div className="text-sm font-bold text-slate-300">上传中...</div>
                    <div className="w-full max-w-md space-y-1">
                      {Object.entries(progress).map(([name, percent]) => (
                        <div key={name} className="text-left text-[10px] text-slate-400">
                          <div className="truncate">{name}</div>
                          <div className="h-1 bg-white/10 rounded-full mt-1">
                            <div className="h-1 bg-indigo-500 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <UploadCloud size={28} />
                    <div className="text-sm font-bold">点击选择图片（最多 10 张，单张 10MB）</div>
                    <div className="text-[10px]">浏览器直传 OSS，不经过服务器</div>
                  </div>
                )}
              </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(selected.photos || []).map((photo, index) => (
                  <div
                    key={photo.id}
                    className="group relative rounded-2xl overflow-hidden bg-slate-800 border border-white/10"
                  >
                    <div className="aspect-square relative">
                      <AuthImage src={photo.thumbUrl} alt={photo.caption} className="w-full h-full object-cover" />
                      {index === 0 && (
                        <span className="absolute top-2 left-2 px-2 py-1 rounded-md bg-indigo-500 text-white text-[9px] font-black">
                          封面
                        </span>
                      )}
                      {photo.status !== "VISIBLE" && (
                        <span className="absolute top-2 right-2 px-2 py-1 rounded-md bg-amber-500 text-black text-[9px] font-black">
                          审核中
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <div className="text-[10px] text-slate-300 truncate">{photo.caption || `图片 ${photo.id}`}</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[9px] text-slate-500">权重 {photo.weight}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => void movePhoto(index, -1)}
                            className="p-1 rounded bg-white/5 text-slate-300 hover:bg-white/10"
                            title="上移"
                          >
                            <ChevronUp size={12} />
                          </button>
                          <button
                            onClick={() => void movePhoto(index, 1)}
                            className="p-1 rounded bg-white/5 text-slate-300 hover:bg-white/10"
                            title="下移"
                          >
                            <ChevronDown size={12} />
                          </button>
                          <button
                            onClick={() => void deletePhoto(photo)}
                            className="p-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white"
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

              {(selected.photos || []).length === 0 && (
                <div className="text-center py-10 text-xs text-slate-500">还没有图片，先上传几张吧</div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
