"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Image as ImageIcon, Plus, Search, Trash2 } from "lucide-react";

import { api, type GalleryAlbum } from "../lib/api";
import AuthImage from "../components/AuthImage";
import { useToast } from "../components/ToastProvider";
import { AdminPageHeader, AdminPageShell, StatusBadge } from "../components/admin/AdminUI";
import { DataTable } from "../components/admin/DataTable";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";

const VISIBILITY_OPTIONS = [
  { value: "PUBLIC", label: "公开" },
  { value: "PASSWORD", label: "密码" },
  { value: "PRIVATE", label: "私密" },
];

function visibilityLabel(album: GalleryAlbum) {
  if (album.visibility === "PASSWORD") return "密码";
  if (album.visibility === "PRIVATE") return "私密";
  return "公开";
}

export default function GalleryListPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.myAlbums();
      setAlbums(response.data || []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "加载相册失败", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return albums;
    return albums.filter((album) => [album.title, album.description, album.albumId].join(" ").toLowerCase().includes(keyword));
  }, [albums, query]);

  const create = async () => {
    if (!title.trim()) {
      showToast("请填写相册名称", "warning");
      return;
    }
    setSaving(true);
    try {
      const response = await api.createAlbum({
        title: title.trim(),
        visibility,
        password: visibility === "PASSWORD" ? password : undefined,
      });
      if (!response.success) throw new Error(response.message);
      showToast("相册已创建", "success");
      setCreateOpen(false);
      setTitle("");
      setPassword("");
      await load();
      if (response.data?.albumId) navigate(`/gallery/${response.data.albumId}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "创建失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (album: GalleryAlbum) => {
    if (!window.confirm(`删除相册「${album.title}」及其中所有图片？不可恢复。`)) return;
    try {
      await api.deleteAlbum(album.albumId);
      showToast("相册已删除", "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "删除失败", "error");
    }
  };

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="影像"
        eyebrow="图库"
        breadcrumbs={[{ label: "内容" }, { label: "影像" }]}
        description={`相册与照片管理 · 共 ${albums.length} 个相册`}
        actions={<Button onClick={() => setCreateOpen(true)}><Plus size={13} /> 新建相册</Button>}
      />

      <div className="relative rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
        <Search size={14} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索相册名称或 ID" className="admin-input pl-8" />
      </div>

      <DataTable
        rows={filtered}
        loading={loading}
        rowKey={(album) => album.albumId}
        empty="还没有相册，先新建一个。"
        onRowClick={(album) => navigate(`/gallery/${album.albumId}`)}
        columns={[
          {
            key: "album",
            header: "相册",
            cell: (album) => (
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md bg-slate-800">
                  {album.coverThumbUrl ? <AuthImage src={album.coverThumbUrl} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-slate-500"><ImageIcon size={14} /></div>}
                </div>
                <div className="min-w-0">
                  <p className="max-w-[260px] truncate text-[12px] font-bold text-white">{album.title}</p>
                  <p className="mt-0.5 max-w-[220px] truncate font-mono text-[9px] text-slate-600">{album.albumId}</p>
                </div>
              </div>
            ),
          },
          { key: "count", header: "照片", cell: (album) => <span className="text-[11px] text-slate-300">{album.photoCount ?? 0}</span> },
          { key: "visibility", header: "可见性", cell: (album) => <span className="text-[10px] text-slate-400">{visibilityLabel(album)}{album.hasPassword ? " · 已设密码" : ""}</span> },
          { key: "status", header: "状态", cell: (album) => <StatusBadge status={album.status} label={album.status === "ACTIVE" ? "正常" : undefined} /> },
          { key: "owner", header: "归属", cell: (album) => <span className="text-[10px] text-slate-500">{album.ownerLabel || (album.isOwner === false ? "他人相册" : "我的")}</span> },
          {
            key: "action",
            header: "操作",
            className: "text-right",
            cell: (album) => (
              <div className="flex justify-end gap-0.5">
                <button type="button" onClick={(event) => { event.stopPropagation(); navigate(`/gallery/${album.albumId}`); }} className="rounded-md px-2 py-1 text-[9px] font-bold text-indigo-300 hover:bg-indigo-500/10">进入</button>
                <button type="button" onClick={(event) => { event.stopPropagation(); void remove(album); }} className="rounded-md p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={13} /></button>
              </div>
            ),
          },
        ]}
      />

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="新建相册"
        description="创建后可进入相册上传照片。"
        widthClassName="max-w-md"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setCreateOpen(false)}>取消</Button><Button onClick={() => void create()} disabled={saving}>创建</Button></div>}
      >
        <div className="space-y-3">
          <label className="block text-[10px] font-bold text-slate-400">相册名称<Input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1" placeholder="例如：旅行日记" /></label>
          <label className="block text-[10px] font-bold text-slate-400">可见性<Select value={visibility} onChange={setVisibility} ariaLabel="相册可见性" options={VISIBILITY_OPTIONS} className="mt-1" /></label>
          {visibility === "PASSWORD" && <label className="block text-[10px] font-bold text-slate-400">密码<Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1" placeholder="设置访问密码" /></label>}
        </div>
      </Dialog>
    </AdminPageShell>
  );
}
