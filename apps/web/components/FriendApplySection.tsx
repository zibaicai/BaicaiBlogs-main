"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Clipboard, Link2, Loader2, Send, X } from "lucide-react";

import Textarea from "./ui/Textarea";
import { useAuth } from "../lib/auth";
import type { SiteInfo } from "../lib/site-config";
import {
  FRIEND_LINK_TEMPLATE,
  formatFriendLinkFields,
  parseFriendLinkText,
} from "../lib/friend-link";
import { useFriendsVerification } from "./friends/FriendsVerificationProvider";
import GlassSurface from "./ui/glass/GlassSurface";

type Application = { id: number; name: string; url: string; avatar?: string; description?: string; contact?: string; status: string; bound?: boolean };

export default function FriendApplySection({ siteInfo }: { siteInfo: SiteInfo }) {
  const { user } = useAuth();
  const { ensureVerified, requestVerification, refreshStatus } = useFriendsVerification();
  const [panelOpen, setPanelOpen] = useState(false);
  const [isSheet, setIsSheet] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [applicationText, setApplicationText] = useState("");
  const [hasBacklink, setHasBacklink] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [application, setApplication] = useState<Application | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setIsSheet(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!panelOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPanelOpen(false);
        fabRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [panelOpen]);

  useEffect(() => {
    if (!panelOpen || !isSheet) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [panelOpen, isSheet]);

  useEffect(() => {
    if (panelOpen) panelRef.current?.focus();
  }, [panelOpen]);

  useEffect(() => {
    if (!user) {
      setApplication(null);
      return;
    }
    fetch("/api/user/friend-application", { credentials: "include" })
      .then((response) => response.json())
      .then((json) => setApplication(json?.data || null))
      .catch(() => setApplication(null));
  }, [user]);

  const siteName = siteInfo.navAfter || siteInfo.title || "云端小屋";
  const siteUrl = "https://www.zibaicai.cn";
  const siteAvatar = siteInfo.avatarUrl?.startsWith("http") ? siteInfo.avatarUrl : `${siteUrl}${siteInfo.avatarUrl || "/avatar.jpg"}`;
  const copyAll = `名称：${siteName}\n网址：${siteUrl}\n头像：${siteAvatar}\n简介：${siteInfo.bio || ""}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyAll);
      setMessage("友链信息已复制");
    } catch {
      setMessage("复制失败，请手动选择");
    }
  };

  const copyFormat = async () => {
    try {
      await navigator.clipboard.writeText(FRIEND_LINK_TEMPLATE);
      setMessage("申请格式已复制");
    } catch {
      setMessage("复制失败，请手动输入");
    }
  };

  const parsed = parseFriendLinkText(applicationText);

  const startEdit = () => {
    if (!application) return;
    setApplicationText(
      formatFriendLinkFields({
        name: application.name,
        url: application.url,
        avatar: application.avatar || "",
        description: application.description || "",
        contact: application.contact || "",
      })
    );
    setEditing(true);
    setOpen(true);
  };

  const bind = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/user/friend-application/bind", { method: "POST", credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "绑定失败");
      setApplication(json.data);
      setMessage("已绑定之前提交的申请");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "绑定失败");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    const parsedApplication = parseFriendLinkText(applicationText);
    if (parsedApplication.errors.length > 0) {
      setMessage(parsedApplication.errors.join("；"));
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const verified = await ensureVerified();
      if (!verified) {
        setBusy(false);
        setMessage("请完成人机验证");
        return;
      }
      const res = await fetch(editing ? "/api/user/friend-application" : "/api/public/friend-applications", {
        method: editing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsedApplication.name,
          url: parsedApplication.url,
          avatar: parsedApplication.avatar,
          description: parsedApplication.description,
          contact: parsedApplication.contact,
          hasBacklink: String(hasBacklink),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "提交失败");
      setMessage(editing ? "资料已更新" : "申请已提交，管理员核验后会展示");
      if (json.data?.bound || editing) setApplication(json.data);
      setOpen(false);
      setEditing(false);
      setApplicationText("");
      setHasBacklink(false);
      await refreshStatus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交失败");
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  };

  const openApplication = () => {
    setEditing(false);
    setPanelOpen(false);
    setApplicationText("");
    setMessage("");
    setOpen(true);
  };

  const panel = (compact: boolean, withClose: boolean) => (
    <GlassSurface as="div" variant="card" className={`friend-link-card ${compact ? "friend-link-card--compact" : ""}`}>
      <div className="friend-link-card-head">
        <h2>本站友链</h2>
        <div className="friend-link-card-actions">
          {withClose && (
            <button
              type="button"
              className="friend-link-close"
              aria-label="关闭本站友链"
              onClick={() => {
                setPanelOpen(false);
                fabRef.current?.focus();
              }}
            >
              <X size={15} />
            </button>
          )}
          <button type="button" onClick={() => void copy()} className="friend-link-copy">
            <Clipboard size={11} /> 复制全部
          </button>
        </div>
      </div>

      {compact ? (
        <p className="friend-link-summary">
          {siteName} · {siteUrl.replace(/^https?:\/\//, "")}
        </p>
      ) : (
        <div className="friend-link-lines">
          <p><span>名称</span><b title={siteName}>{siteName}</b></p>
          <p><span>网址</span><b title={siteUrl}>{siteUrl}</b></p>
          <p><span>头像</span><b title={siteAvatar}>{siteAvatar}</b></p>
          <p><span>简介</span><b title={siteInfo.bio || ""}>{siteInfo.bio || ""}</b></p>
        </div>
      )}

      <button type="button" onClick={openApplication} className="friend-link-apply">
        申请友链
      </button>

      {message && <p className="friend-link-message">{message}</p>}

      {user && (
        <div className="friend-link-status">
          {application ? (
            <div>
              {application.name} ·{" "}
              {application.status === "APPROVED"
                ? "已通过"
                : application.status === "REJECTED"
                  ? "未通过"
                  : "审核中"}
              <button
                type="button"
                onClick={() => {
                  startEdit();
                  setPanelOpen(false);
                }}
              >
                编辑
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => void bind()} disabled={busy}>
              绑定之前提交的申请
            </button>
          )}
        </div>
      )}
    </GlassSurface>
  );

  return (
    <>
      <div className="friend-link-inline" aria-label="本站友链">
        {panel(false, false)}
      </div>

      <div className="friend-link-rail" aria-label="本站友链">
        {panel(false, false)}
      </div>

      <button
        ref={fabRef}
        type="button"
        className="friend-link-fab"
        aria-label="打开本站友链"
        aria-haspopup="dialog"
        aria-expanded={panelOpen}
        aria-controls="friend-link-panel"
        onClick={() => setPanelOpen((current) => !current)}
      >
        <Link2 size={19} />
      </button>

      {panelOpen && typeof document !== "undefined" && createPortal(
        <>
          <div className="friend-link-overlay" aria-hidden="true" onClick={() => { setPanelOpen(false); fabRef.current?.focus(); }} />
          <div
            ref={panelRef}
            id="friend-link-panel"
            className={`friend-link-panel ${isSheet ? "is-sheet" : "is-popover"}`}
            role="dialog"
            aria-modal={isSheet || undefined}
            aria-labelledby="friend-link-panel-title"
            tabIndex={-1}
          >
            <span id="friend-link-panel-title" className="sr-only">本站友链</span>
            {panel(true, true)}
          </div>
        </>,
        document.body
      )}

      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[10010] flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 pt-24 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/40 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">{editing ? "编辑友链资料" : "申请友链"}</h3>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={16} /></button>
            </div>
            <div className="friend-apply-editor">
              <div className="friend-apply-editor-head">
                <span>粘贴友链信息</span>
                <button type="button" onClick={() => void copyFormat()}>复制格式</button>
              </div>
              <Textarea
                value={applicationText}
                onChange={(event) => setApplicationText(event.target.value)}
                onFocus={requestVerification}
                rows={7}
                className="mt-1"
                placeholder={FRIEND_LINK_TEMPLATE}
              />
              <p className="friend-apply-hint">
                支持名称、网址、头像、简介四行，顺序不限，冒号可用中文或英文。
              </p>
            </div>

            {(parsed.name || parsed.url || parsed.description) && (
              <div className="friend-apply-preview">
                <div className="friend-apply-preview-avatar">
                  {parsed.avatar && /^https?:\/\//i.test(parsed.avatar) ? (
                    <img src={parsed.avatar} alt="" />
                  ) : (
                    (parsed.name || "友").slice(0, 1)
                  )}
                </div>
                <div className="friend-apply-preview-copy">
                  <strong>{parsed.name || "未识别名称"}</strong>
                  {parsed.url && /^https?:\/\//i.test(parsed.url) ? (
                    <a href={parsed.url} target="_blank" rel="noopener noreferrer">{parsed.url}</a>
                  ) : (
                    <span>未识别网址</span>
                  )}
                  {parsed.description && <p>{parsed.description}</p>}
                </div>
              </div>
            )}

            {parsed.errors.length > 0 && applicationText.trim() && (
              <ul className="friend-apply-errors">
                {parsed.errors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            )}

            <label className="mt-3 flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={hasBacklink} onChange={(e) => setHasBacklink(e.target.checked)} /> 我已在本站添加贵站友链</label>
            <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-meta leading-5 text-amber-700 dark:text-amber-300">
              提交前请确认网站可访问、信息准确。提交后进入人工审核，审核期间请勿重复提交。
            </div>
            {message && <p className="friend-apply-message">{message}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="hv-button">取消</button>
              <button type="button" onClick={() => void submit()} disabled={busy} className="hv-button hv-button-primary inline-flex items-center gap-2 disabled:opacity-50">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} 提交
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
