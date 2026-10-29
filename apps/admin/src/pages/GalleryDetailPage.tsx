"use client";

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, Image as ImageIcon, Loader2, Lock, Pencil, RefreshCw, Trash2, UploadCloud } from "lucide-react";

import { api, uploadToOss, type GalleryAlbum, type GalleryPhoto } from "../lib/api";
import AuthImage from "../components/AuthImage";
import { useToast } from "../components/ToastProvider";
import { AdminEmptyState, AdminLoading, AdminPageHeader, AdminPageShell } from "../components/admin/AdminUI";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";

const VISIBILITY_OPTIONS = [
  { value: "PUBLIC", label: "公开" },
  { value: "PASSWORD", label: "密码" },
  { value: "PRIVATE", label: "私密" },
];

function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });
}

export default function GalleryDetailPage() {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [album, setAlbum] = useState<GalleryAlbum | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editVisibility, setEditVisibility] = useState("PUBLIC");
  const [editPassword, setEditPassword] = useState("");
  const [hidePhotoCount, setHidePhotoCount] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!albumId) return;
    setLoading(true);
    try {
      const response = await api.get<GalleryAlbum>(`/public/gallery/albums/${encodeURIComponent(albumId)}`);
      setAlbum(response.data);
      setHidePhotoCount(Boolean(response.data.hidePhotoCount));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "加载相册失败", "error");
      navigate("/gallery", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [albumId]);

  const openEdit = () => {
    if (!album) return;
    setEditTitle(album.title);
    setEditDescription(album.description || "");
    setEditVisibility(album.visibility);
    setEditPassword("");
    setHidePhotoCount(Boolean(album.hidePhotoCount));
    setEditOpen(true);
  };

  const saveAlbum = async () => {
    if (!album) return;
    setSaving(true);
    try {
      await api.updateAlbum(album.albumId, {
        title: editTitle,
        description: editDescription,
        visibility: editVisibility,
        password: editPassword || undefined,
        hidePhotoCount,
      });
      showToast("相册已更新", "success");
      setEditOpen(false);
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "更新失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteAlbum = async () => {
    if (!album) return;
    if (!window.confirm(`删除相册「${album.title}」及其中所有图片？不可恢复。`)) return;
    try {
      await api.deleteAlbum(album.albumId);
      showToast("相册已删除", "success");
      navigate("/gallery", { replace: true });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "删除失败", "error");
    }
  };

  const requestAccess = async () => {
    if (!album) return;
    const reason = window.prompt("申请查看原因（至少 10 个字，用于合规审计）");
    if (!reason || reason.trim().length < 10) return;
    try {
      const response = await api.requestAccess(album.albumId, reason.trim());
      showToast(response.message || "申请已提交", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "申请失败", "error");
    }
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!album || !files || files.length === 0) return;
    const list = Array.from(files).slice(0, 10);
    if (files.length > 10) showToast("单次最多上传 10 张，已截取前 10 张", "warning");
    setUploading(true);
    try {
      const presign = await api.presignPhotos(album.albumId, list.map((file) => ({ name: file.name, type: file.type, size: file.size })));
      if (!presign.success) throw new Error(presign.message);
      const confirmed: any[] = [];
      for (let index = 0; index < list.length; index++) {
        const file = list[index];
        const item = presign.data[index];
        setProgress((current) => ({ ...current, [file.name]: 0 }));
        await uploadToOss(item.uploadUrl, file, (percent) => setProgress((current) => ({ ...current, [file.name]: percent })));
        const size = await readImageSize(file);
        confirmed.push({ key: item.key, width: size.width, height: size.height, bytes: file.size, mime: file.type, caption: file.name.replace(/\.[^.]+$/, "") });
        setProgress((current) => ({ ...current, [file.name]: 100 }));
      }
      const response = await api.confirmPhotos(album.albumId, confirmed);
      if (!response.success) throw new Error(response.message);
      showToast(`已上传 ${response.data.length} 张图片`, "success");
      setUploadOpen(false);
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "上传失败", "error");
    } finally {
      setUploading(false);
      setProgress({});
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const deletePhoto = async (photo: GalleryPhoto) => {
    if (!window.confirm("删除后不可恢复，且会立即释放存储配额。确认删除？")) return;
    try {
      await api.deletePhoto(photo.id);
      showToast("图片已删除", "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "删除失败", "error");
    }
  };

  const movePhoto = async (index: number, direction: -1 | 1) => {
    if (!album?.photos) return;
    const photos = [...album.photos];
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    [photos[index], photos[target]] = [photos[target], photos[index]];
    try {
      await api.reorderPhotos(album.albumId, photos.map((photo, position) => ({ photoId: photo.id, weight: (photos.length - position) * 10 })));
      setAlbum({ ...album, photos });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "排序失败", "error");
    }
  };

  if (loading) return <AdminLoading label="正在加载相册…" />;
  if (!album) return null;

  const photos = album.photos || [];
  const isOwner = album.isOwner !== false;

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={album.title}
        eyebrow="图库"
        description={`${album.photoCount ?? photos.length} 张照片 · ${album.visibility === "PASSWORD" ? "密码访问" : album.visibility === "PRIVATE" ? "私密" : "公开"}${album.status !== "ACTIVE" ? ` · ${album.status}` : ""}`}
        breadcrumbs={[{ label: "影像", to: "/gallery" }, { label: album.title }]}
        actions={<>
          <Link to="/gallery" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-white/5"><ArrowLeft size={13} /> 返回</Link>
          <Button variant="ghost" onClick={() => void load()}><RefreshCw size={13} /> 刷新</Button>
          {isOwner ? (
            <>
              <Button onClick={() => setUploadOpen(true)}><UploadCloud size={13} /> 上传照片</Button>
              <Button variant="secondary" onClick={openEdit}><Pencil size={13} /> 编辑</Button>
              <Button variant="ghost" onClick={() => void deleteAlbum()}><Trash2 size={13} /> 删除</Button>
            </>
          ) : <Button onClick={() => void requestAccess()}><Lock size={13} /> 申请查看</Button>}
        </>}
      />

      {photos.length === 0 ? (
        <AdminEmptyState title="还没有图片" description="点击上传照片，添加第一批影像。" />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
          {photos.map((photo, index) => (
            <div key={photo.id} className="group relative overflow-hidden rounded-lg border border-white/10 bg-slate-800">
              <div className="relative aspect-square">
                <AuthImage src={photo.thumbUrl} alt={photo.caption || ""} className="h-full w-full object-cover" />
                {index === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-indigo-500 px-1.5 py-0.5 text-[8px] font-bold text-white">封面</span>}
                {photo.status !== "VISIBLE" && <span className="absolute right-1.5 top-1.5 rounded bg-amber-500 px-1.5 py-0.5 text-[8px] font-bold text-black">审核中</span>}
                {isOwner && (
                  <div className="absolute inset-0 flex items-center justify-center gap-1 bg-slate-950/65 opacity-0 transition-opacity group-hover:opacity-100">
                    <button type="button" onClick={() => void movePhoto(index, -1)} disabled={index === 0} title="上移" className="rounded-md bg-white/15 p-1.5 text-white disabled:opacity-30"><ChevronUp size={13} /></button>
                    <button type="button" onClick={() => void movePhoto(index, 1)} disabled={index === photos.length - 1} title="下移" className="rounded-md bg-white/15 p-1.5 text-white disabled:opacity-30"><ChevronDown size={13} /></button>
                    <button type="button" onClick={() => void deletePhoto(photo)} title="删除" className="rounded-md bg-red-500/80 p-1.5 text-white"><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
              <div className="px-2 py-1.5">
                <p className="truncate text-[10px] text-slate-300">{photo.caption || `图片 ${photo.id}`}</p>
                <p className="text-[8px] text-slate-500">权重 {photo.weight}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={uploadOpen}
        onClose={() => { if (!uploading) setUploadOpen(false); }}
        title="上传照片"
        description="单次最多 10 张，单张 10MB，浏览器直传 OSS。"
        widthClassName="max-w-md"
        footer={<div className="flex justify-end"><Button variant="ghost" onClick={() => setUploadOpen(false)} disabled={uploading}>关闭</Button></div>}
      >
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" multiple className="hidden" onChange={(event) => void uploadFiles(event.target.files)} />
        {uploading ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-400"><Loader2 size={14} className="animate-spin" /> 上传中…</div>
            {Object.entries(progress).map(([name, percent]) => (
              <div key={name} className="text-[10px] text-slate-500">
                <div className="truncate">{name}</div>
                <div className="mt-1 h-1 rounded-full bg-white/10"><div className="h-1 rounded-full bg-indigo-500" style={{ width: `${percent}%` }} /></div>
              </div>
            ))}
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-white/15 bg-black/10 px-4 py-8 text-slate-400 hover:border-indigo-400/60">
            <UploadCloud size={22} />
            <span className="text-[11px] font-bold">点击选择图片</span>
            <span className="text-[9px]">最多 10 张，单张 10MB</span>
          </button>
        )}
      </Dialog>

      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="编辑相册"
        widthClassName="max-w-md"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setEditOpen(false)}>取消</Button><Button onClick={() => void saveAlbum()} disabled={saving}>保存</Button></div>}
      >
        <div className="space-y-3">
          <label className="block text-[10px] font-bold text-slate-400">相册名称<Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} className="mt-1" /></label>
          <label className="block text-[10px] font-bold text-slate-400">描述<textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} rows={3} className="control-field mt-1" /></label>
          <label className="block text-[10px] font-bold text-slate-400">可见性<Select value={editVisibility} onChange={setEditVisibility} ariaLabel="相册可见性" options={VISIBILITY_OPTIONS} className="mt-1" /></label>
          <label className="block text-[10px] font-bold text-slate-400">密码<Input type="password" value={editPassword} onChange={(event) => setEditPassword(event.target.value)} className="mt-1" placeholder={album.hasPassword ? "留空保持不变" : "可选"} /></label>
          <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400"><input type="checkbox" checked={hidePhotoCount} onChange={(event) => setHidePhotoCount(event.target.checked)} className="h-3.5 w-3.5 accent-indigo-500" /> 未解锁时隐藏照片数量</label>
        </div>
      </Dialog>
    </AdminPageShell>
  );
}
