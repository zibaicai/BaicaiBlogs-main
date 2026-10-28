"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { Archive, Download, ExternalLink, Loader2, Lock, Plus, ShieldCheck, Trash2, UserRound, X } from "lucide-react";
import { getAdminRole, getToken } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

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
type DeleteRequest = { id: number; archiveId: number; title?: string; username?: string; reason?: string; createdAt?: string };

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
  const [adminId, setAdminId] = useState("");
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

  const open = async (item: ArchiveItem) => {
    setBusy(true);
    try {
      const data = await archiveRequest<ArchiveItem>(`/internal/archives/${item.id}`);
      setSelected(data);
      if (superAdmin) {
        const list = await archiveRequest<Grant[]>(`/internal/archives/${item.id}/grants`);
        setGrants(list || []);
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

  return (
    <section className="px-4 py-6 md:px-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-400">INTERNAL ARCHIVE</p>
          <h1 className="mt-1 flex items-center gap-3 text-3xl font-black text-white">
            <Archive size={25} className="text-indigo-400" /> 内部存档
          </h1>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-400">
            仅内部查阅的外部文章快照。原文版权归原作者所有，请勿外传。
          </p>
        </div>
        {superAdmin && (
          <Button onClick={() => setShowImport((value) => !value)}>
            <Plus size={15} /> 导入链接
          </Button>
        )}
      </header>

      {showImport && superAdmin && (
        <div className="mb-5 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/article" />
            <Button onClick={() => void previewUrl()} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" size={15} /> : <ShieldCheck size={15} />} 预览
            </Button>
          </div>
          {preview && (
            <div className="mt-5 rounded-2xl border border-indigo-400/20 bg-slate-950/40 p-5">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-white">{preview.sourceTitle}</h2>
                  <p className="mt-1 text-[10px] text-slate-400">{preview.sourceSite} · {preview.sourceAuthor || "未知作者"}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setPreview(null)}>取消</Button>
                  <Button onClick={() => void savePreview()} disabled={busy}>确认存档</Button>
                </div>
              </div>
              <div className="archive-reader max-h-[420px] overflow-y-auto rounded-xl bg-white/90 p-5 text-slate-800" dangerouslySetInnerHTML={{ __html: safePreview }} />
            </div>
          )}
        </div>
      )}

      {superAdmin && deleteRequests.length > 0 && (
        <section className="mb-5 rounded-3xl border border-amber-400/20 bg-amber-500/5 p-4">
          <div className="mb-3 text-[10px] font-black uppercase tracking-widest text-amber-300">
            待处理删除申请 · {deleteRequests.length}
          </div>
          <div className="space-y-2">
            {deleteRequests.map((request) => (
              <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-black/20 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-slate-200">{request.title || `存档 #${request.archiveId}`}</div>
                  <div className="mt-1 text-[10px] text-slate-500">{request.username || `用户 #${request.requestedBy}`} · {request.reason || "未填写原因"}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="success" onClick={() => void reviewRequest(request.id, true)}>批准删除</Button>
                  <Button size="sm" variant="ghost" onClick={() => void reviewRequest(request.id, false)}>拒绝</Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-3">
          <div className="mb-2 flex items-center justify-between px-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <span>存档列表</span><span>{items.length}</span>
          </div>
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-500">加载中…</div>
          ) : items.length === 0 ? (
            <div className="px-3 py-16 text-center text-xs leading-relaxed text-slate-500">暂无可见存档。<br />{superAdmin ? "可以从右上角导入链接。" : "等待超级管理员授权。"}</div>
          ) : (
            <div className="space-y-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void open(item)}
                  className={`w-full rounded-2xl px-3 py-3 text-left transition ${selected?.id === item.id ? "bg-indigo-500/20 ring-1 ring-indigo-400/40" : "hover:bg-white/5"}`}
                >
                  <div className="line-clamp-2 text-xs font-bold text-slate-100">{item.sourceTitle}</div>
                  <div className="mt-1 truncate text-[10px] text-slate-500">{item.sourceSite} · {item.importedAt?.slice(0, 10)}</div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <article className="min-h-[520px] rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          {busy && !selected ? (
            <div className="flex h-80 items-center justify-center"><Loader2 className="animate-spin text-indigo-400" /></div>
          ) : !selected ? (
            <div className="flex h-80 flex-col items-center justify-center gap-3 text-slate-500">
              <Lock size={34} className="text-slate-600" />
              <p className="text-xs">选择一篇内部存档查看。</p>
            </div>
          ) : (
            <>
              <header className="mb-4 border-b border-white/10 pb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-white">{selected.sourceTitle}</h2>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400">
                      <span>{selected.sourceSite}</span>
                      <span>{selected.sourceAuthor || "未知作者"}</span>
                      <span>{selected.sourcePublishedAt || "发布时间未知"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-[10px] font-bold text-slate-300 hover:bg-white/5">
                      <ExternalLink size={12} /> 原文
                    </a>
                    {superAdmin && (
                      <button type="button" onClick={() => void downloadSnapshot()} className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-[10px] font-bold text-slate-300 hover:bg-white/5">
                        <Download size={12} /> 原始快照
                      </button>
                    )}
                    {superAdmin && <Button variant="danger" onClick={() => void remove()}><Trash2 size={13} /> 删除</Button>}
                    {!superAdmin && (
                      <Button variant="ghost" onClick={() => void requestDelete()}>申请删除</Button>
                    )}
                  </div>
                </div>
                <p className="mt-3 rounded-xl bg-amber-500/10 px-3 py-2 text-[10px] leading-relaxed text-amber-300">
                  {selected.copyrightNote || "版权归原作者所有，仅限内部存档查阅，请勿外传。"}
                </p>
              </header>

              {superAdmin && (
                <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><UserRound size={12} /> 授权查阅</div>
                  <div className="flex flex-wrap gap-2">
                    <select value={adminId} onChange={(event) => setAdminId(event.target.value)} className="control-field max-w-xs">
                      <option value="">选择 ADMIN 账号</option>
                      {admins.map((admin) => <option key={admin.id} value={admin.id}>{admin.nickname || admin.username}</option>)}
                    </select>
                    <Button onClick={() => void grant()} disabled={!adminId || busy}>授权</Button>
                  </div>
                  {grants.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {grants.map((g) => (
                        <span key={g.id} className="inline-flex items-center gap-2 rounded-full bg-indigo-500/15 px-3 py-1.5 text-[10px] text-indigo-200">
                          {g.nickname || g.username || `#${g.adminUserId}`}
                          <button type="button" onClick={() => void revoke(g.adminUserId)} className="text-indigo-300 hover:text-white"><X size={12} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="archive-reader max-h-[calc(100vh-430px)] overflow-y-auto rounded-2xl bg-white p-6 text-slate-800 md:p-8" dangerouslySetInnerHTML={{ __html: safeContent }} />
            </>
          )}
        </article>
      </div>
    </section>
  );
}
