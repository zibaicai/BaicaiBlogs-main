import { useEffect, useState } from "react";
import { Check, Loader2, Music2, Plus, Trash2, X } from "lucide-react";
import { api } from "../lib/api";
import { useToast } from "../components/ToastProvider";

export default function MusicAdminPage() {
  const { showToast } = useToast();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [cover, setCover] = useState("");
  const [description, setDescription] = useState("");
  const [trackIds, setTrackIds] = useState("");
  const [importPlaylistId, setImportPlaylistId] = useState("");
  const [track, setTrack] = useState({
    externalTrackId: "",
    title: "",
    artist: "",
    cover: "",
    externalUrl: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([api.adminMusicPlaylists(), api.adminMusicApplications()]);
      setPlaylists(p.data || []);
      setApplications(a.data || []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const saveTrack = async () => {
    if (!track.externalTrackId.trim()) return;
    setSaving(true);
    try {
      const res = await api.upsertMusicTrack(track);
      showToast(`歌曲已保存：#${res.data?.id || ""}`, "success");
      setTrack({ externalTrackId: "", title: "", artist: "", cover: "", externalUrl: "" });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "保存失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const createPlaylist = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const ids = trackIds.split(",").map((item) => Number(item.trim())).filter((item) => Number.isFinite(item) && item > 0);
      await api.createMusicPlaylist({ title, cover, description, trackIds: ids });
      setTitle("");
      setCover("");
      setDescription("");
      setTrackIds("");
      showToast("推荐歌单已创建", "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "创建失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const importPlaylist = async () => {
    if (!importPlaylistId.trim()) return;
    setSaving(true);
    try {
      const response = await api.importMusicPlaylist(importPlaylistId.trim());
      setImportPlaylistId("");
      showToast(`已导入：${response.data?.title || "歌单"} · ${response.data?.trackCount || 0} 首`, "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "导入失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const review = async (id: number, approve: boolean) => {    try {
      await api.reviewMusicApplication(id, approve, approve ? "审核通过" : "暂不推荐");
      showToast(approve ? "已通过" : "已拒绝", "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "操作失败", "error");
    }
  };

  const setStatus = async (id: number, status: string) => {
    try {
      await api.setMusicPlaylistStatus(id, status);
      showToast(`已切换为 ${status}`, "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "操作失败", "error");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-black text-white">音乐管理</h1>
        <p className="mt-1 text-sm font-bold text-slate-400">
          先录入歌曲，再用歌曲 ID 创建推荐歌单。私人导入不在此处展示。
        </p>
      </header>

      <section className="rounded-3xl border border-indigo-400/20 bg-indigo-500/10 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-white"><Music2 size={16} /> 导入公开歌单</h2>
        <p className="mb-3 text-xs font-bold text-slate-400">支持网易云公开歌单 ID 或分享链接；只保存歌单 ID，不保存 uct2。</p>
        <div className="flex flex-col gap-2 md:flex-row">
          <input value={importPlaylistId} onChange={(e) => setImportPlaylistId(e.target.value)} placeholder="例如 2823950709 或 https://music.163.com/playlist?id=2823950709" className="admin-input" />
          <button onClick={() => void importPlaylist()} disabled={saving} className="shrink-0 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-black text-white disabled:opacity-50">
            {saving ? "导入中..." : "导入歌单"}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-white"><Plus size={16} /> 录入歌曲</h2>
        <div className="grid gap-3 md:grid-cols-5">
          <input value={track.externalTrackId} onChange={(e) => setTrack({ ...track, externalTrackId: e.target.value })} placeholder="平台歌曲 ID" className="admin-input" />
          <input value={track.title} onChange={(e) => setTrack({ ...track, title: e.target.value })} placeholder="歌曲名" className="admin-input" />
          <input value={track.artist} onChange={(e) => setTrack({ ...track, artist: e.target.value })} placeholder="歌手" className="admin-input" />
          <input value={track.cover} onChange={(e) => setTrack({ ...track, cover: e.target.value })} placeholder="封面 URL" className="admin-input" />
          <input value={track.externalUrl} onChange={(e) => setTrack({ ...track, externalUrl: e.target.value })} placeholder="平台链接" className="admin-input" />
        </div>
        <button onClick={() => void saveTrack()} disabled={saving} className="mt-3 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-black text-white disabled:opacity-50">
          保存歌曲
        </button>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-white"><Music2 size={16} /> 新建推荐歌单</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="歌单标题" className="admin-input" />
          <input value={cover} onChange={(e) => setCover(e.target.value)} placeholder="封面 URL" className="admin-input" />
          <input value={trackIds} onChange={(e) => setTrackIds(e.target.value)} placeholder="歌曲 ID，逗号分隔" className="admin-input md:col-span-2" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="简介" rows={2} className="admin-input md:col-span-2" />
        </div>
        <button onClick={() => void createPlaylist()} disabled={saving} className="mt-3 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-black text-white disabled:opacity-50">
          创建推荐歌单
        </button>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-3 text-lg font-black text-white">用户申请 · {applications.filter((item) => item.status === "PENDING").length} 待审核</h2>
        <div className="space-y-2">
          {applications.map((item) => (
            <div key={item.id} className="flex flex-col gap-2 rounded-2xl bg-black/15 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-bold text-white">#{item.id} · {item.title || item.externalPlaylistId} · {item.status}</div>
                <div className="text-xs text-slate-400">{item.note || item.description || "无备注"}</div>
              </div>
              {item.status === "PENDING" && (
                <div className="flex gap-2">
                  <button onClick={() => void review(item.id, true)} className="rounded-xl bg-emerald-500/15 px-3 py-2 text-[10px] font-black text-emerald-300"><Check size={12} className="inline" /> 通过</button>
                  <button onClick={() => void review(item.id, false)} className="rounded-xl bg-red-500/15 px-3 py-2 text-[10px] font-black text-red-300"><X size={12} className="inline" /> 拒绝</button>
                </div>
              )}
            </div>
          ))}
          {applications.length === 0 && <div className="text-xs text-slate-500">暂无申请。</div>}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-3 text-lg font-black text-white">推荐歌单</h2>
        {loading ? <Loader2 className="animate-spin text-indigo-400" /> : (
          <div className="space-y-2">
            {playlists.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 rounded-2xl bg-black/15 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{item.title} <span className="text-xs text-slate-400">#{item.id} · {item.status}</span></div>
                  <div className="text-xs text-slate-400">{item.trackCount} 首 · 热度 {item.heatScore} · {item.likeCount}/{item.dislikeCount}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {
                    const value = window.prompt("输入曲目 ID，逗号分隔", String((item.tracks || []).map((track: any) => track.id).join(",")));
                    if (value == null) return;
                    const ids = value.split(",").map((v) => Number(v.trim())).filter((v) => Number.isFinite(v) && v > 0);
                    void api.setMusicPlaylistTracks(item.id, ids).then(() => load()).catch((error) => showToast(error instanceof Error ? error.message : "更新失败", "error"));
                  }} className="rounded-xl bg-indigo-500/15 px-3 py-2 text-[10px] font-black text-indigo-300">曲目</button>
                  <button onClick={() => void setStatus(item.id, "ACTIVE")} className="rounded-xl bg-emerald-500/15 px-3 py-2 text-[10px] font-black text-emerald-300">恢复</button>
                  <button onClick={() => void setStatus(item.id, "DEMOTED")} className="rounded-xl bg-amber-500/15 px-3 py-2 text-[10px] font-black text-amber-300">下架</button>
                </div>
              </div>
            ))}
            {playlists.length === 0 && <div className="text-xs text-slate-500">暂无推荐歌单。</div>}
          </div>
        )}
      </section>
    </div>
  );
}
