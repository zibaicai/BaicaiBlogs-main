"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Image as ImageIcon, Loader2, Plus, Trash2, UploadCloud } from "lucide-react";
import Navbar from "../../../components/Navbar";
import PageTransition from "../../../components/PageTransition";
import { useAuth } from "../../../lib/auth";
import {
  galleryRequest,
  imageSize,
  uploadToOss,
  type GalleryAlbum,
  type GalleryPhoto,
} from "../../../lib/gallery-client";

export default function MyPhotosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [selected, setSelected] = useState<GalleryAlbum | null>(null);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("PRIVATE");
  const [password, setPassword] = useState("");
  const [hideCount, setHideCount] = useState(false);
  const [accessLogs, setAccessLogs] = useState<any[] | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const loadAlbums = async (keep?: string) => {
    try {
      const data = await galleryRequest<GalleryAlbum[]>("/user/albums");
      setAlbums(data);
      if (keep) await loadAlbum(keep);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "加载失败");
    }
  };

  const loadAlbum = async (albumId: string) => {
    try {
      const data = await galleryRequest<GalleryAlbum>(`/public/gallery/albums/${encodeURIComponent(albumId)}`);
      setSelected(data);
      setAccessLogs(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "加载失败");
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
    if (user) void loadAlbums();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const createAlbum = async () => {
    if (!title.trim()) return;
    try {
      const data = await galleryRequest<GalleryAlbum>("/user/albums", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), visibility, password: visibility === "PASSWORD" ? password : undefined, hidePhotoCount: hideCount }),
      });
      setTitle("");
      setPassword("");
      setMessage("相册已创建");
      await loadAlbums(data.albumId);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "创建失败");
    }
  };

  const upload = async (files: FileList | null) => {
    if (!selected || !files?.length) return;
    const list = Array.from(files).slice(0, 10);
    setUploading(true);
    setMessage("");
    try {
      const presign = await galleryRequest<Array<{ key: string; uploadUrl: string }>>(
        `/user/albums/${encodeURIComponent(selected.albumId)}/photos/presign`,
        { method: "POST", body: JSON.stringify(list.map((f) => ({ name: f.name, type: f.type, size: f.size }))) }
      );
      const confirm: any[] = [];
      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        setProgress((p) => ({ ...p, [file.name]: 0 }));
        await uploadToOss(presign[i].uploadUrl, file, (v) => setProgress((p) => ({ ...p, [file.name]: v })));
        const size = await imageSize(file);
        confirm.push({
          key: presign[i].key,
          width: size.width,
          height: size.height,
          bytes: file.size,
          mime: file.type,
          caption: file.name.replace(/\.[^.]+$/, ""),
        });
        setProgress((p) => ({ ...p, [file.name]: 100 }));
      }
      await galleryRequest(`/user/albums/${encodeURIComponent(selected.albumId)}/photos/confirm`, {
        method: "POST",
        body: JSON.stringify({ photos: confirm }),
      });
      setMessage(`已上传 ${confirm.length} 张`);
      await loadAlbums(selected.albumId);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploading(false);
      setProgress({});
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const loadAccessLogs = async () => {
    if (!selected) return;
    try {
      const data = await galleryRequest<any[]>(`/user/albums/${encodeURIComponent(selected.albumId)}/access-logs`);
      setAccessLogs(data);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "加载访问记录失败");
    }
  };

  const deletePhoto = async (photo: GalleryPhoto) => {
    if (!confirm("删除后不可恢复，并立即释放配额。确认？")) return;
    try {
      await galleryRequest(`/user/photos/${photo.id}`, { method: "DELETE" });
      if (selected) await loadAlbum(selected.albumId);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "删除失败");
    }
  };

  const appealPhoto = async (photo: GalleryPhoto) => {
    const reason = window.prompt("申诉理由：请说明图片没有违规");
    if (!reason) return;
    try {
      await galleryRequest(`/public/photos/${photo.id}/appeal`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      setMessage("申诉已提交，等待管理员审核");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "申诉失败");
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    if (!selected?.photos) return;
    const photos = [...selected.photos];
    const target = index + dir;
    if (target < 0 || target >= photos.length) return;
    [photos[index], photos[target]] = [photos[target], photos[index]];
    try {
      await galleryRequest(`/user/albums/${encodeURIComponent(selected.albumId)}/photos/order`, {
        method: "PATCH",
        body: JSON.stringify({ items: photos.map((p, i) => ({ photoId: p.id, weight: (photos.length - i) * 10 })) }),
      });
      setSelected({ ...selected, photos });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "排序失败");
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell">
          <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white">我的图片</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2">
              单次最多 10 张、单张 10MB；公开+私密合计每天 10 张
            </p>
          </header>

          {message && <div className="mb-4 text-sm font-bold text-indigo-500">{message}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-start">
            <aside className="rounded-3xl bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 p-4">
              <div className="space-y-2 mb-4">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="新相册名称"
                  className="w-full rounded-xl bg-white/60 dark:bg-slate-900/50 border border-white/40 dark:border-slate-700 px-4 py-2.5 text-sm outline-none"
                />
                <div className="flex gap-2">
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="flex-1 rounded-xl bg-white/60 dark:bg-slate-900/50 border border-white/40 dark:border-slate-700 px-3 py-2.5 text-xs outline-none"
                  >
                    <option value="PRIVATE">私密</option>
                    <option value="PASSWORD">密码</option>
                    <option value="PUBLIC">公开</option>
                  </select>
                  <button onClick={createAlbum} className="px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-black flex items-center gap-1">
                    <Plus size={14} /> 新建
                  </button>
                </div>
                {visibility === "PASSWORD" && (
                  <div className="space-y-2">
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      placeholder="相册密码"
                      className="w-full rounded-xl bg-white/60 dark:bg-slate-900/50 border border-white/40 dark:border-slate-700 px-4 py-2.5 text-sm outline-none"
                    />
                    <label className="flex items-center gap-2 text-[11px] text-slate-500 font-bold">
                      <input type="checkbox" checked={hideCount} onChange={(e) => setHideCount(e.target.checked)} className="accent-indigo-500" />
                      未解锁时隐藏照片数量
                    </label>
                  </div>
                )}
              </div>
              <div className="space-y-2 max-h-[55vh] overflow-y-auto">
                {albums.map((album) => (
                  <button
                    key={album.albumId}
                    onClick={() => void loadAlbum(album.albumId)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-2xl border text-left ${
                      selected?.albumId === album.albumId
                        ? "bg-indigo-500/15 border-indigo-400/40"
                        : "bg-white/40 dark:bg-slate-900/30 border-white/30 dark:border-white/5"
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                      {album.coverThumbUrl ? (
                        <img src={album.coverThumbUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500"><ImageIcon size={16} /></div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate">{album.title}</div>
                      <div className="text-[10px] text-slate-400">{album.photoCount} 张 · {album.visibility}</div>
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            <section className="rounded-3xl bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 p-5 min-h-[50vh]">
              {!selected ? (
                <div className="h-full min-h-[40vh] flex items-center justify-center text-sm text-slate-400 font-bold">
                  选择左侧相册，或新建一个
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-black">{selected.title}</h2>
                      <div className="text-[10px] text-slate-400">{selected.photoCount} 张 · {selected.status}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selected.visibility === "PASSWORD" && (
                        <button onClick={() => void loadAccessLogs()} className="text-xs font-bold text-indigo-400">
                          访问记录
                        </button>
                      )}
                      <Link href={`/photowall/${encodeURIComponent(selected.albumId)}`} className="text-xs font-bold text-indigo-500">
                        在前台查看
                      </Link>
                    </div>
                  </div>

                  {accessLogs && (
                    <div className="mb-4 rounded-2xl bg-white/50 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-black text-slate-500">管理员查看记录（仅授权访问）</span>
                        <button onClick={() => setAccessLogs(null)} className="text-[10px] text-slate-400">收起</button>
                      </div>
                      {accessLogs.length === 0 ? (
                        <div className="text-[11px] text-slate-400">暂无记录</div>
                      ) : (
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {accessLogs.map((log) => (
                            <div key={log.id} className="text-[10px] text-slate-500">
                              {log.adminLabel} · {log.action} · {log.viewedAt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    onClick={() => fileRef.current?.click()}
                    className="rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-8 text-center cursor-pointer hover:border-indigo-400"
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                      multiple
                      className="hidden"
                      onChange={(e) => void upload(e.target.files)}
                    />
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin text-indigo-400" />
                        {Object.entries(progress).map(([name, p]) => (
                          <div key={name} className="w-full max-w-sm text-left text-[10px] text-slate-400">
                            <div className="truncate">{name}</div>
                            <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-1">
                              <div className="h-1 bg-indigo-500 rounded-full" style={{ width: `${p}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <UploadCloud size={26} />
                        <span className="text-sm font-bold">点击上传（最多 10 张）</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 mt-5">
                    {(selected.photos || []).map((photo, index) => (
                      <div key={photo.id} className="relative rounded-2xl overflow-hidden bg-slate-900 border border-white/10 group">
                        <img src={photo.thumbUrl} alt={photo.caption} className="w-full aspect-square object-cover" loading="lazy" />
                        {photo.status !== "VISIBLE" && (
                          <span className="absolute top-2 left-2 px-2 py-1 rounded-md bg-amber-500 text-black text-[9px] font-black">
                            审核中
                          </span>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2 flex items-center justify-between">
                          <span className="text-[9px] text-white/80">权重 {photo.weight}</span>
                          <div className="flex gap-1">
                            {photo.status !== "VISIBLE" && (
                              <button onClick={() => void appealPhoto(photo)} className="text-amber-300 text-[9px] px-1">申诉</button>
                            )}
                            <button onClick={() => void move(index, -1)} className="text-white/70 hover:text-white"><ChevronUp size={13} /></button>
                            <button onClick={() => void move(index, 1)} className="text-white/70 hover:text-white"><ChevronDown size={13} /></button>
                            <button onClick={() => void deletePhoto(photo)} className="text-red-300 hover:text-red-400"><Trash2 size={13} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
