"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { Archive, ChevronLeft, ChevronRight, Download, ExternalLink, Loader2, Pencil, Plus, RefreshCw, Search, ShieldCheck, Trash2, UserRound, X } from "lucide-react";
import { getAdminRole, getToken } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { AdminEmptyState, AdminLoading, AdminPageHeader, AdminPageShell, StatusBadge } from "../components/admin/AdminUI";
import { DataTable } from "../components/admin/DataTable";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";

type ArchiveItem = {
  id: number;
  sourceUrl: string;
  canonicalUrl?: string;
  sourceTitle: string;
  sourceAuthor?: string;
  sourceSite?: string;
  sourcePublishedAt?: string;
  importedAt?: string;
  copyrightNote?: string;
  status?: string;
  contentHtml?: string;
};

type AdminUser = { id: number; username: string; nickname?: string };
type Grant = { id: number; adminUserId: number; username?: string; nickname?: string; expiresAt?: string };
type DeleteRequest = { id: number; archiveId: number; requestedBy?: number; title?: string; username?: string; reason?: string; createdAt?: string };
type AccessLog = { id: number; action: string; username?: string; userId: number; ipHash?: string; userAgent?: string; createdAt?: string };

async function archiveRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers as Record<string, string>),
    },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new Error(json?.message || `请求失败 (${res.status})`);
  return json.data as T;
}

function cleanHtml(html = "", proxyBase = "") {
  const rewriteImages = (node: Element) => {
    if (node.tagName !== "IMG" || !proxyBase) return;
    const src = node.getAttribute("src") || "";
    if (!(src.startsWith("http://") || src.startsWith("https://"))) return;
    node.setAttribute("src", `${proxyBase}?url=${encodeURIComponent(src)}`);
  };
  DOMPurify.addHook("afterSanitizeAttributes", rewriteImages);
  try {
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ["style", "iframe", "object", "embed", "form", "input", "button", "svg", "math"],
      FORBID_ATTR: ["style"],
      ALLOW_DATA_ATTR: false,
    });
  } finally {
    DOMPurify.removeHook("afterSanitizeAttributes");
  }
}

const ARCHIVE_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "有效",
  ARCHIVED: "已归档",
  DELETED: "已删除",
  HIDDEN: "已隐藏",
};

function ArchiveStatusBadge({ status }: { status?: string }) {
  const value = (status || "ACTIVE").toUpperCase();
  const badgeStatus = value === "ACTIVE" ? "PUBLISHED" : value;
  return <StatusBadge status={badgeStatus} label={ARCHIVE_STATUS_LABEL[value] || status || "未知"} />;
}

export default function ArchivesPage() {
  const { showToast } = useToast();
  const role = getAdminRole();
  const superAdmin = role === "SUPER_ADMIN";
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [selected, setSelected] = useState<ArchiveItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<ArchiveItem | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [deleteRequests, setDeleteRequests] = useState<DeleteRequest[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [adminId, setAdminId] = useState("");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editCopyright, setEditCopyright] = useState("");
  const [editContent, setEditContent] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [showImport, setShowImport] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await archiveRequest<ArchiveItem[]>("/internal/archives");
      setItems(data || []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "加载失败", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
    if (superAdmin) {
      archiveRequest<AdminUser[]>("/internal/archives/admins")
        .then(setAdmins)
        .catch(() => setAdmins([]));
      archiveRequest<DeleteRequest[]>("/internal/archives/delete-requests")
        .then(setDeleteRequests)
        .catch(() => setDeleteRequests([]));
    }
  }, [load, superAdmin]);

  useEffect(() => {
    setPage(0);
  }, [query, items.length]);

  const open = async (item: ArchiveItem) => {
    setBusy(true);
    try {
      const data = await archiveRequest<ArchiveItem>(`/internal/archives/${item.id}`);
      setSelected(data);
      if (superAdmin) {
        const list = await archiveRequest<Grant[]>(`/internal/archives/${item.id}/grants`);
        setGrants(list || []);
        const logs = await archiveRequest<AccessLog[]>(`/internal/archives/${item.id}/logs`);
        setAccessLogs(logs || []);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "读取失败", "error");
    } finally {
      setBusy(false);
    }
  };

  const previewUrl = async () => {
    if (!url.trim()) {
      showToast("请输入链接", "warning");
      return;
    }
    setBusy(true);
    try {
      setPreview(await archiveRequest<ArchiveItem>("/internal/archives/preview", {
        method: "POST",
        body: JSON.stringify({ url: url.trim() }),
      }));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "预览失败", "error");
    } finally {
      setBusy(false);
    }
  };

  const savePreview = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      const saved = await archiveRequest<ArchiveItem>("/internal/archives", {
        method: "POST",
        body: JSON.stringify({ url: preview.sourceUrl }),
      });
      showToast("已保存为内部存档", "success");
      setPreview(null);
      setUrl("");
      setShowImport(false);
      await load();
      setSelected(saved);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "保存失败", "error");
    } finally {
      setBusy(false);
    }
  };

  const grant = async () => {
    if (!selected || !adminId) return;
    setBusy(true);
    try {
      await archiveRequest(`/internal/archives/${selected.id}/grants`, {
        method: "POST",
        body: JSON.stringify({ adminUserId: Number(adminId) }),
      });
      showToast("已授权", "success");
      setGrants(await archiveRequest<Grant[]>(`/internal/archives/${selected.id}/grants`));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "授权失败", "error");
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (adminUserId: number) => {
    if (!selected) return;
    setBusy(true);
    try {
      await archiveRequest(`/internal/archives/${selected.id}/grants/${adminUserId}`, { method: "DELETE" });
      setGrants(await archiveRequest<Grant[]>(`/internal/archives/${selected.id}/grants`));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "撤销失败", "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!selected || !window.confirm("确认删除这个内部存档？")) return;
    setBusy(true);
    try {
      await archiveRequest(`/internal/archives/${selected.id}`, { method: "DELETE" });
      setSelected(null);
      await load();
      showToast("已删除", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "删除失败", "error");
    } finally {
      setBusy(false);
    }
  };

  const refreshArchive = async () => {
    if (!selected || !window.confirm("重新抓取会覆盖当前正文和图片，确认继续？")) return;
    setBusy(true);
    try {
      const updated = await archiveRequest<ArchiveItem>(`/internal/archives/${selected.id}/refresh`, { method: "POST" });
      setSelected(updated);
      await load();
      showToast("已重新抓取", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "重新抓取失败", "error");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = () => {
    if (!selected) return;
    setEditTitle(selected.sourceTitle || "");
    setEditAuthor(selected.sourceAuthor || "");
    setEditCopyright(selected.copyrightNote || "");
    setEditContent(selected.contentHtml || "");
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const updated = await archiveRequest<ArchiveItem>(`/internal/archives/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          sourceTitle: editTitle,
          sourceAuthor: editAuthor,
          copyrightNote: editCopyright,
          contentHtml: editContent,
        }),
      });
      setSelected(updated);
      setEditing(false);
      await load();
      showToast("已保存", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "保存失败", "error");
    } finally {
      setBusy(false);
    }
  };

  const downloadSnapshot = async () => {
    if (!selected) return;
    try {
      const token = getToken();
      const res = await fetch(`/api/internal/archives/${selected.id}/snapshot`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("快照下载失败");
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = `archive-${selected.id}.html`;
      link.click();
      URL.revokeObjectURL(href);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "快照下载失败", "error");
    }
  };

  const requestDelete = async () => {
    if (!selected) return;
    const reason = window.prompt("请填写删除原因（可选）：") || "";
    try {
      await archiveRequest(`/internal/archives/${selected.id}/delete-request`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      showToast("删除申请已提交，等待超级管理员处理", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "提交失败", "error");
    }
  };

  const reviewRequest = async (requestId: number, approve: boolean) => {
    try {
      await archiveRequest(`/internal/archives/delete-requests/${requestId}/review`, {
        method: "POST",
        body: JSON.stringify({ approve, note: approve ? "同意删除" : "暂不删除" }),
      });
      showToast(approve ? "已批准并删除" : "已拒绝", "success");
      setDeleteRequests(await archiveRequest<DeleteRequest[]>("/internal/archives/delete-requests"));
      await load();
      if (selected) setSelected(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "处理失败", "error");
    }
  };

  const safeContent = useMemo(
    () => cleanHtml(selected?.contentHtml, selected ? `/api/internal/archives/${selected.id}/image` : ""),
    [selected?.contentHtml, selected?.id]
  );
  const safePreview = useMemo(
    () => cleanHtml(preview?.contentHtml, preview ? "/api/internal/archives/preview/image" : ""),
    [preview?.contentHtml]
  );
  const pageSize = 20;
  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) =>
      [item.sourceTitle, item.sourceSite, item.sourceAuthor].some((value) =>
        (value || "").toLowerCase().includes(keyword)
      )
    );
  }, [items, query]);
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pagedItems = filteredItems.slice(page * pageSize, (page + 1) * pageSize);
  const adminOptions = admins.map((admin) => ({
    value: String(admin.id),
    label: admin.nickname || admin.username,
  }));

  const ghostLink = "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-bold text-slate-400 transition hover:bg-white/10 hover:text-slate-100";

  return (
    <AdminPageShell>
      <AdminPageHeader
        eyebrow="INTERNAL ARCHIVE"
        title="内部存档"
        description={`仅内部查阅的外部文章快照，版权归原作者所有 · 共 ${items.length} 篇`}
        actions={
          <>
            <Button variant="ghost" onClick={() => void load()} disabled={loading}>
              <RefreshCw size={13} /> 刷新
            </Button>
            {superAdmin && (
              <Button onClick={() => setShowImport((value) => !value)}>
                <Plus size={13} /> 导入链接
              </Button>
            )}
          </>
        }
      />

      {showImport && superAdmin && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="min-w-0 flex-1">
              <Input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com/article"
              />
            </div>
            <Button onClick={() => void previewUrl()} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" size={13} /> : <ShieldCheck size={13} />} 预览
            </Button>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-500">先预览再确认存档；仅保存正文与图片，原始快照由服务端单独留存。</p>

          {preview && (
            <div className="mt-2.5 rounded-lg border border-indigo-400/20 bg-slate-950/40 p-3">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-xs font-bold text-white">{preview.sourceTitle}</h2>
                  <p className="mt-0.5 truncate text-[10px] text-slate-500">
                    {preview.sourceSite || "未知站点"} · {preview.sourceAuthor || "未知作者"}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="ghost" onClick={() => setPreview(null)}>取消</Button>
                  <Button onClick={() => void savePreview()} disabled={busy}>确认存档</Button>
                </div>
              </div>
              <div
                className="archive-reader admin-scrollbar max-h-[320px] overflow-y-auto rounded-md bg-white/95 p-4 text-slate-800"
                dangerouslySetInnerHTML={{ __html: safePreview }}
              />
            </div>
          )}
        </div>
      )}

      {superAdmin && deleteRequests.length > 0 && (
        <section className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-300">待处理删除申请</span>
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">{deleteRequests.length}</span>
          </div>
          <DataTable
            rows={deleteRequests}
            rowKey={(request) => request.id}
            empty="暂无待处理删除申请"
            columns={[
              {
                key: "title",
                header: "存档",
                className: "max-w-[280px]",
                cell: (request) => (
                  <span className="block truncate text-[11px] font-bold text-slate-200">
                    {request.title || `存档 #${request.archiveId}`}
                  </span>
                ),
              },
              {
                key: "user",
                header: "申请人",
                cell: (request) => (
                  <span className="text-[10px] text-slate-400">
                    {request.username || (request.requestedBy ? `用户 #${request.requestedBy}` : "未知用户")}
                  </span>
                ),
              },
              {
                key: "reason",
                header: "原因",
                className: "max-w-[320px]",
                cell: (request) => (
                  <span className="line-clamp-1 text-[10px] text-slate-500">{request.reason || "未填写原因"}</span>
                ),
              },
              {
                key: "time",
                header: "提交时间",
                cell: (request) => (
                  <span className="whitespace-nowrap text-[10px] tabular-nums text-slate-500">
                    {request.createdAt?.slice(0, 16).replace("T", " ") || "—"}
                  </span>
                ),
              },
              {
                key: "action",
                header: "操作",
                className: "text-right",
                cell: (request) => (
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="success" onClick={() => void reviewRequest(request.id, true)}>批准删除</Button>
                    <Button size="sm" variant="ghost" onClick={() => void reviewRequest(request.id, false)}>拒绝</Button>
                  </div>
                ),
              },
            ]}
          />
        </section>
      )}

      <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="flex max-h-[calc(100vh-220px)] min-h-[320px] flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between gap-2 px-2.5 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
            <span className="flex items-center gap-1.5"><Archive size={11} /> 存档列表</span>
            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] tabular-nums text-slate-400">{filteredItems.length}</span>
          </div>
          <div className="px-2 pb-2">
            <div className="relative">
              <Search size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索标题、站点、作者"
                style={{ paddingLeft: 27 }}
              />
            </div>
          </div>
          <div className="admin-scrollbar min-h-0 flex-1 overflow-y-auto px-1.5 pb-1.5">
            {loading ? (
              <AdminLoading label="加载存档…" />
            ) : filteredItems.length === 0 ? (
              <AdminEmptyState
                title="没有匹配的存档"
                description={superAdmin ? "可以从右上角导入链接。" : "等待超级管理员授权。"}
              />
            ) : (
              <div className="space-y-0.5">
                {pagedItems.map((item) => {
                  const active = selected?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => void open(item)}
                      aria-current={active ? "true" : undefined}
                      className={`flex w-full flex-col gap-0.5 rounded-lg px-2 py-1.5 text-left transition ${
                        active
                          ? "bg-indigo-500/15 ring-1 ring-inset ring-indigo-400/30"
                          : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className={`truncate text-[11px] font-bold ${active ? "text-white" : "text-slate-200"}`}>
                        {item.sourceTitle}
                      </span>
                      <span className="flex items-center gap-1 truncate text-[9px] text-slate-500">
                        <span className="truncate">{item.sourceSite || "未知站点"}</span>
                        <span className="text-slate-700">·</span>
                        <span className="shrink-0 tabular-nums">{item.importedAt?.slice(0, 10) || "—"}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {pageCount > 1 && (
            <div className="flex items-center justify-between border-t border-white/10 px-2 py-1.5 text-[10px] text-slate-500">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((value) => Math.max(0, value - 1))}
                className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 font-bold transition hover:bg-white/5 disabled:opacity-30"
              >
                <ChevronLeft size={11} /> 上一页
              </button>
              <span className="tabular-nums">{page + 1} / {pageCount}</span>
              <button
                type="button"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
                className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 font-bold transition hover:bg-white/5 disabled:opacity-30"
              >
                下一页 <ChevronRight size={11} />
              </button>
            </div>
          )}
        </aside>

        {busy && !selected ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02]">
            <AdminLoading label="读取存档…" />
          </div>
        ) : !selected ? (
          <AdminEmptyState
            title="选择一篇内部存档"
            description="从左侧列表选择存档，查看正文、授权与访问记录。"
            action={
              superAdmin && !showImport ? (
                <Button variant="secondary" onClick={() => setShowImport(true)}>
                  <Plus size={13} /> 导入链接
                </Button>
              ) : undefined
            }
          />
        ) : (
          <article aria-busy={busy} className="flex min-h-[480px] flex-col rounded-xl border border-white/10 bg-white/[0.02]">
            <header className="border-b border-white/10 px-3 py-2.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <h2 className="min-w-0 flex-1 truncate text-sm font-bold text-white">{selected.sourceTitle}</h2>
                    <span className="shrink-0"><ArchiveStatusBadge status={selected.status} /></span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-slate-500">
                    <span className="truncate">{selected.sourceSite || "未知站点"}</span>
                    <span className="text-slate-700">·</span>
                    <span>{selected.sourceAuthor || "未知作者"}</span>
                    <span className="text-slate-700">·</span>
                    <span>{selected.sourcePublishedAt || "发布时间未知"}</span>
                    <span className="text-slate-700">·</span>
                    <span className="tabular-nums">导入 {selected.importedAt?.slice(0, 10) || "—"}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className={ghostLink}>
                    <ExternalLink size={12} /> 原文
                  </a>
                  {superAdmin && (
                    <Button variant="ghost" onClick={() => void downloadSnapshot()}>
                      <Download size={12} /> 原始快照
                    </Button>
                  )}
                  {superAdmin && (
                    <Button variant="ghost" onClick={() => void refreshArchive()} disabled={busy}>
                      <RefreshCw size={12} /> 重新抓取
                    </Button>
                  )}
                  {superAdmin && !editing && (
                    <Button variant="ghost" onClick={startEdit}>
                      <Pencil size={12} /> 编辑
                    </Button>
                  )}
                  {superAdmin && <Button variant="danger" onClick={() => void remove()}><Trash2 size={12} /> 删除</Button>}
                  {!superAdmin && (
                    <Button variant="ghost" onClick={() => void requestDelete()}>申请删除</Button>
                  )}
                </div>
              </div>
              <p className="mt-2 rounded-md bg-amber-500/10 px-2 py-1 text-[10px] leading-relaxed text-amber-300/90">
                {selected.copyrightNote || "版权归原作者所有，仅限内部存档查阅，请勿外传。"}
              </p>
            </header>

            {superAdmin && (
              <section className="border-b border-white/10 px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    <UserRound size={11} /> 授权查阅
                  </span>
                  <div className="w-44">
                    <Select
                      value={adminId}
                      onChange={setAdminId}
                      options={adminOptions}
                      placeholder="选择 ADMIN 账号"
                      ariaLabel="选择授权 ADMIN 账号"
                    />
                  </div>
                  <Button onClick={() => void grant()} disabled={!adminId || busy}>授权</Button>
                  <span className="ml-auto hidden text-[9px] text-slate-600 sm:inline">授权有效期 30 天</span>
                </div>
                {grants.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    <span className="text-[9px] text-slate-600">已授权</span>
                    {grants.map((grantItem) => (
                      <span
                        key={grantItem.id}
                        title={grantItem.expiresAt ? `有效期至 ${grantItem.expiresAt.slice(0, 10)}` : undefined}
                        className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 py-0.5 pl-2 pr-1 text-[10px] text-indigo-200"
                      >
                        {grantItem.nickname || grantItem.username || `#${grantItem.adminUserId}`}
                        <button
                          type="button"
                          onClick={() => void revoke(grantItem.adminUserId)}
                          title="撤销授权"
                          className="rounded-full p-0.5 text-indigo-300 transition hover:bg-indigo-500/20 hover:text-white"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </section>
            )}

            {editing ? (
              <div className="space-y-2.5 p-3">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <Input label="标题" value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
                  <Input label="作者" value={editAuthor} onChange={(event) => setEditAuthor(event.target.value)} />
                </div>
                <Input label="版权说明" value={editCopyright} onChange={(event) => setEditCopyright(event.target.value)} />
                <label className="block text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  正文 HTML（仅保留安全标签）
                  <textarea
                    value={editContent}
                    onChange={(event) => setEditContent(event.target.value)}
                    className="control-field mt-1 w-full resize-y font-mono leading-relaxed"
                    style={{ minHeight: 360, fontSize: 12 }}
                    spellCheck={false}
                  />
                </label>
                <div className="flex justify-end gap-1.5">
                  <Button variant="ghost" onClick={() => setEditing(false)}>取消</Button>
                  <Button onClick={() => void saveEdit()} disabled={busy}>保存</Button>
                </div>
              </div>
            ) : (
              <div className="p-2">
                <div
                  className="archive-reader admin-scrollbar max-h-[calc(100vh-420px)] min-h-[260px] overflow-y-auto rounded-lg bg-white p-4 text-slate-800 md:p-6"
                  dangerouslySetInnerHTML={{ __html: safeContent }}
                />
              </div>
            )}

            {superAdmin && accessLogs.length > 0 && (
              <section className="border-t border-white/10 px-3 py-2">
                <div className="mb-1 flex items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  <span>最近访问记录</span>
                  <span className="tabular-nums text-slate-600">{accessLogs.length}</span>
                </div>
                <div className="admin-scrollbar max-h-36 divide-y divide-white/[0.04] overflow-y-auto">
                  {accessLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-center justify-between gap-2 py-1 text-[10px]">
                      <span className="shrink-0 font-bold text-slate-300">{log.action}</span>
                      <span className="min-w-0 flex-1 truncate text-slate-500">{log.username || `#${log.userId}`}</span>
                      <span className="shrink-0 tabular-nums text-slate-600">
                        {log.createdAt?.slice(0, 19).replace("T", " ") || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>
        )}
      </div>
    </AdminPageShell>
  );
}
