"use client";

import { useEffect, useRef, useState } from "react";
import { Clipboard, Link2, Loader2, Send, X } from "lucide-react";

import Input from "./ui/Input";
import Textarea from "./ui/Textarea";
import { useAuth } from "../lib/auth";
import type { SiteInfo } from "../lib/site-config";

interface TurnstileOptions {
  sitekey: string;
  callback: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
}
interface TurnstileInstance {
  render: (element: HTMLElement, options: TurnstileOptions) => string;
  remove: (id: string) => void;
  reset: (id: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileInstance;
  }
}

type Application = { id: number; name: string; url: string; avatar?: string; description?: string; contact?: string; status: string; bound?: boolean };

export default function FriendApplySection({ siteInfo }: { siteInfo: SiteInfo }) {
  const { user } = useAuth();
  const [panelOpen, setPanelOpen] = useState(false);
  const [isSheet, setIsSheet] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [avatar, setAvatar] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [hasBacklink, setHasBacklink] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [application, setApplication] = useState<Application | null>(null);
  const [editing, setEditing] = useState(false);
  const [turnstileConfig, setTurnstileConfig] = useState<{ enabled: boolean; siteKey: string } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);

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
    fetch("/api/auth/config", { credentials: "include" })
      .then((response) => response.json())
      .then((json) => setTurnstileConfig({ enabled: Boolean(json?.data?.turnstileEnabled), siteKey: json?.data?.turnstileSiteKey || "" }))
      .catch(() => setTurnstileConfig({ enabled: false, siteKey: "" }));
  }, []);

  useEffect(() => {
    if (!open || !turnstileConfig?.enabled || !turnstileConfig.siteKey) return;
    if (window.turnstile) {
      setTurnstileReady(true);
      return;
    }
    const script = document.querySelector<HTMLScriptElement>('script[data-friend-turnstile="true"]') || document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.friendTurnstile = "true";
    script.onload = () => setTurnstileReady(true);
    if (!script.parentElement) document.head.appendChild(script);
  }, [open, turnstileConfig]);

  useEffect(() => {
    if (!open || !turnstileReady || !turnstileConfig?.siteKey || !turnstileRef.current) return;
    const widget = window.turnstile?.render(turnstileRef.current, {
      sitekey: turnstileConfig.siteKey,
      callback: setTurnstileToken,
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    });
    widgetRef.current = widget || null;
    return () => {
      if (widgetRef.current && window.turnstile) window.turnstile.remove(widgetRef.current);
      widgetRef.current = null;
    };
  }, [open, turnstileReady, turnstileConfig]);

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

  const startEdit = () => {
    if (!application) return;
    setName(application.name);
    setUrl(application.url);
    setAvatar(application.avatar || "");
    setDescription(application.description || "");
    setContact(application.contact || "");
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
    if (!agreed) { setMessage("请先确认信息无误"); return; }
    if (turnstileConfig?.enabled && !turnstileToken && !editing) { setMessage("请完成人机验证"); return; }
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(editing ? "/api/user/friend-application" : "/api/public/friend-applications", {
        method: editing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, avatar, description, contact, hasBacklink: String(hasBacklink), turnstileToken }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "提交失败");
      setMessage(editing ? "资料已更新" : "申请已提交，管理员核验后会展示");
      if (json.data?.bound || editing) setApplication(json.data);
      setOpen(false);
      setEditing(false);
      setAgreed(false);
      setTurnstileToken("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交失败");
    } finally {
      setBusy(false);
    }
  };

  const openApplication = () => {
    setEditing(false);
    setPanelOpen(false);
    setOpen(true);
  };

  const panel = (compact: boolean, withClose: boolean) => (
    <div className={`friend-link-card ${compact ? "friend-link-card--compact" : ""}`}>
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
        <pre className="friend-link-pre">{copyAll}</pre>
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
    </div>
  );

  return (
    <>
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

      {panelOpen && (
        <>
          <div className="friend-link-overlay" aria-hidden="true" onClick={() => setPanelOpen(false)} />
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
        </>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 pt-24 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/40 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">{editing ? "编辑友链资料" : "申请友链"}</h3>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={16} /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-meta font-bold text-slate-400">称谓<Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></label>
              <label className="text-meta font-bold text-slate-400">网站地址<Input value={url} onChange={(e) => setUrl(e.target.value)} disabled={application?.status === "APPROVED"} className="mt-1" /></label>
              <label className="text-meta font-bold text-slate-400">头像地址<Input value={avatar} onChange={(e) => setAvatar(e.target.value)} className="mt-1" /></label>
              <label className="text-meta font-bold text-slate-400">联系方式（仅管理员可见）<Input value={contact} onChange={(e) => setContact(e.target.value)} className="mt-1" /></label>
              <label className="text-meta font-bold text-slate-400 sm:col-span-2">简介<Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1" /></label>
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={hasBacklink} onChange={(e) => setHasBacklink(e.target.checked)} /> 我已在本站添加贵站友链</label>
            <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-meta leading-5 text-amber-700 dark:text-amber-300">
              提交前请确认网站可访问、信息准确。提交后进入人工审核，审核期间请勿重复提交。
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /> 我已确认以上信息无误</label>
            {turnstileConfig?.enabled && <div ref={turnstileRef} className="mt-3 min-h-[65px]" />}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="hv-button">取消</button>
              <button type="button" onClick={() => void submit()} disabled={busy} className="hv-button hv-button-primary inline-flex items-center gap-2 disabled:opacity-50">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} 提交
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
