import { useEffect, useState, type ReactNode } from "react";
import { Check, RefreshCw, X } from "lucide-react";
import { api } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { Button, Input, Textarea } from "../components/ui";
import { AdminPageHeader, AdminPageShell, StatusBadge } from "../components/admin/AdminUI";
import { DataTable } from "../components/admin/DataTable";

function Panel({
  title,
  hint,
  actions,
  children,
}: {
  title: string;
  hint?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <div className="min-w-0">
          <h2 className="text-[11px] font-bold text-white">{title}</h2>
          {hint && <p className="mt-0.5 text-[10px] text-slate-500">{hint}</p>}
        </div>
        {actions}
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

const PLAYLIST_STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-300",
  DEMOTED: "bg-amber-500/10 text-amber-300",
};

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
      const ids = trackIds
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isFinite(item) && item > 0);
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

  const review = async (id: number, approve: boolean) => {
    try {
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

  const editTracks = (item: any) => {
    const value = window.prompt(
      "输入曲目 ID，逗号分隔",
      String((item.tracks || []).map((track: any) => track.id).join(","))
    );
    if (value == null) return;
    const ids = value
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isFinite(v) && v > 0);
    void api
      .setMusicPlaylistTracks(item.id, ids)
      .then(() => load())
      .catch((error) => showToast(error instanceof Error ? error.message : "更新失败", "error"));
  };

  const pendingApplications = applications.filter((item) => item.status === "PENDING").length;

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="音乐管理"
        description="先录入歌曲，再用歌曲 ID 创建推荐歌单。私人导入不在此处展示。"
        actions={
          <Button variant="ghost" onClick={() => void load()}>
            <RefreshCw size={13} /> 刷新
          </Button>
        }
      />

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel
          title="导入公开歌单"
          hint="支持网易云公开歌单 ID 或分享链接；只保存歌单 ID，不保存 uct2。"
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="min-w-0 flex-1">
              <Input
                value={importPlaylistId}
                onChange={(e) => setImportPlaylistId(e.target.value)}
                placeholder="例如 2823950709 或 https://music.163.com/playlist?id=2823950709"
                aria-label="公开歌单 ID 或链接"
              />
            </div>
            <Button className="shrink-0" onClick={() => void importPlaylist()} disabled={saving}>
              {saving ? "导入中..." : "导入歌单"}
            </Button>
          </div>
        </Panel>

        <Panel title="录入歌曲">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={track.externalTrackId}
              onChange={(e) => setTrack({ ...track, externalTrackId: e.target.value })}
              placeholder="平台歌曲 ID"
              aria-label="平台歌曲 ID"
            />
            <Input
              value={track.title}
              onChange={(e) => setTrack({ ...track, title: e.target.value })}
              placeholder="歌曲名"
              aria-label="歌曲名"
            />
            <Input
              value={track.artist}
              onChange={(e) => setTrack({ ...track, artist: e.target.value })}
              placeholder="歌手"
              aria-label="歌手"
            />
            <Input
              value={track.cover}
              onChange={(e) => setTrack({ ...track, cover: e.target.value })}
              placeholder="封面 URL"
              aria-label="封面 URL"
            />
            <div className="sm:col-span-2">
              <Input
                value={track.externalUrl}
                onChange={(e) => setTrack({ ...track, externalUrl: e.target.value })}
                placeholder="平台链接"
                aria-label="平台链接"
              />
            </div>
          </div>
          <Button className="mt-2" onClick={() => void saveTrack()} disabled={saving}>
            保存歌曲
          </Button>
        </Panel>
      </div>

      <Panel title="新建推荐歌单">
        <div className="grid gap-2 md:grid-cols-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="歌单标题"
            aria-label="歌单标题"
          />
          <Input
            value={cover}
            onChange={(e) => setCover(e.target.value)}
            placeholder="封面 URL"
            aria-label="歌单封面 URL"
          />
          <div className="md:col-span-2">
            <Input
              value={trackIds}
              onChange={(e) => setTrackIds(e.target.value)}
              placeholder="歌曲 ID，逗号分隔"
              aria-label="歌曲 ID，逗号分隔"
            />
          </div>
          <div className="md:col-span-2">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简介"
              rows={2}
              aria-label="歌单简介"
            />
          </div>
        </div>
        <Button className="mt-2" onClick={() => void createPlaylist()} disabled={saving}>
          创建推荐歌单
        </Button>
      </Panel>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[11px] font-bold text-white">
            用户申请 <span className="font-normal text-slate-500">· {pendingApplications} 待审核 / 共 {applications.length} 条</span>
          </h2>
        </div>
        <DataTable
          rows={applications}
          loading={loading}
          rowKey={(item) => item.id}
          empty="暂无申请。"
          columns={[
            {
              key: "application",
              header: "申请",
              cell: (item) => (
                <div className="min-w-0">
                  <div className="truncate text-[11px] font-bold text-slate-200">
                    {item.title || item.externalPlaylistId || "未命名歌单"}
                  </div>
                  <div className="mt-0.5 font-mono text-[9px] text-slate-500">#{item.id}</div>
                </div>
              ),
            },
            {
              key: "external",
              header: "歌单 ID",
              cell: (item) => (
                <span className="font-mono text-[10px] text-slate-400">{item.externalPlaylistId || "—"}</span>
              ),
            },
            {
              key: "note",
              header: "备注",
              className: "max-w-[280px]",
              cell: (item) => (
                <p className="line-clamp-2 text-[10px] leading-5 text-slate-400">
                  {item.note || item.description || "无备注"}
                </p>
              ),
            },
            {
              key: "status",
              header: "状态",
              cell: (item) => <StatusBadge status={item.status} />,
            },
            {
              key: "actions",
              header: "操作",
              className: "text-right",
              cell: (item) =>
                item.status === "PENDING" ? (
                  <div className="flex justify-end gap-0.5">
                    <button
                      type="button"
                      onClick={() => void review(item.id, true)}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-300 hover:bg-emerald-500/20"
                    >
                      <Check size={11} /> 通过
                    </button>
                    <button
                      type="button"
                      onClick={() => void review(item.id, false)}
                      className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-1 text-[9px] font-bold text-red-300 hover:bg-red-500/20"
                    >
                      <X size={11} /> 拒绝
                    </button>
                  </div>
                ) : (
                  <span className="text-slate-600">—</span>
                ),
            },
          ]}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-[11px] font-bold text-white">
          推荐歌单 <span className="font-normal text-slate-500">· 共 {playlists.length} 个</span>
        </h2>
        <DataTable
          rows={playlists}
          loading={loading}
          rowKey={(item) => item.id}
          empty="暂无推荐歌单。"
          columns={[
            {
              key: "playlist",
              header: "歌单",
              cell: (item) => (
                <div className="min-w-0">
                  <div className="truncate text-[11px] font-bold text-slate-200">{item.title}</div>
                  <div className="mt-0.5 font-mono text-[9px] text-slate-500">#{item.id}</div>
                </div>
              ),
            },
            {
              key: "stats",
              header: "数据",
              cell: (item) => (
                <span className="whitespace-nowrap text-[10px] text-slate-400">
                  {item.trackCount} 首 · 热度 {item.heatScore} · {item.likeCount}/{item.dislikeCount}
                </span>
              ),
            },
            {
              key: "status",
              header: "状态",
              cell: (item) => (
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    PLAYLIST_STATUS_STYLE[item.status] || "bg-white/10 text-slate-300"
                  }`}
                >
                  {item.status}
                </span>
              ),
            },
            {
              key: "actions",
              header: "操作",
              className: "text-right",
              cell: (item) => (
                <div className="flex justify-end gap-0.5">
                  <button
                    type="button"
                    onClick={() => editTracks(item)}
                    className="rounded-md bg-indigo-500/10 px-2 py-1 text-[9px] font-bold text-indigo-300 hover:bg-indigo-500/20"
                  >
                    曲目
                  </button>
                  <button
                    type="button"
                    onClick={() => void setStatus(item.id, "ACTIVE")}
                    className="rounded-md bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-300 hover:bg-emerald-500/20"
                  >
                    恢复
                  </button>
                  <button
                    type="button"
                    onClick={() => void setStatus(item.id, "DEMOTED")}
                    className="rounded-md bg-amber-500/10 px-2 py-1 text-[9px] font-bold text-amber-300 hover:bg-amber-500/20"
                  >
                    下架
                  </button>
                </div>
              ),
            },
          ]}
        />
      </section>
    </AdminPageShell>
  );
}
