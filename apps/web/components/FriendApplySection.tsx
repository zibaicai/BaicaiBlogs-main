"use client";

import { useEffect, useRef, useState } from "react";
import { Clipboard, Loader2, Send, X } from "lucide-react";

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
  const [editingApplication, setEditingApplication] = useState(false);
  const [turnstileConfig, setTurnstileConfig] = useState<{ enabled: boolean; siteKey: string } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/config", { credentials: "include" })
      .then((response) => response.json())
      .then((json) => {
        const data = json?.data || {};
        setTurnstileConfig({
          enabled: Boolean(data.turnstileEnabled),
          siteKey: typeof data.turnstileSiteKey === "string" ? data.turnstileSiteKey : "",
        });
      })
      .catch(() => setTurnstileConfig({ enabled: false, siteKey: "" }));
  }, []);

  useEffect(() => {
    if (!open || !turnstileConfig?.enabled || !turnstileConfig.siteKey) return;
    const existing = document.querySelector<HTMLScriptElement>('script[data-friend-turnstile="true"]');
    if (window.turnstile) {
      setTurnstileReady(true);
      return;
    }
    const script = existing || document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.friendTurnstile = "true";
    script.onload = () => setTurnstileReady(true);
    if (!existing) document.head.appendChild(script);
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

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setMessage("已复制");
    } catch {
      setMessage("复制失败，请手动选择");
    }
  };

  const bind = async () => {
    setBusy(true);
    setMessage("");
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
    if (!agreed) {
      setMessage("请先确认信息无误");
      return;
    }
    if (turnstileConfig?.enabled && !turnstileToken && !editingApplication) {
      setMessage("请完成人机验证");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const payload = { name, url, avatar, description, contact, hasBacklink: String(hasBacklink), turnstileToken };
      const res = await fetch(editingApplication ? "/api/user/friend-application" : "/api/public/friend-applications", {
        method: editingApplication ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "提交失败");
      setMessage(editingApplication ? "资料已更新" : "申请已提交，管理员核验后会展示");
      if (json.data?.bound) setApplication(json.data);
      if (editingApplication) setApplication(json.data);
      setOpen(false);
      setEditingApplication(false);
      setName(""); setUrl(""); setAvatar(""); setDescription(""); setContact(""); setHasBacklink(false); setAgreed(false);
      if (widgetRef.current && window.turnstile) window.turnstile.reset(widgetRef.current);
      setTurnstileToken("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交失败");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = () => {
    if (!application) return;
    setName(application.name);
    setUrl(application.url);
    setAvatar(application.avatar || "");
    setDescription(application.description || "");
    setContact(application.contact || "");
    setEditingApplication(true);
    setOpen(true);
  };

  const siteName = siteInfo.navAfter || siteInfo.title || "云端小屋";
  const siteUrl = "https://www.zibaicai.cn";
  const siteAvatar = siteInfo.avatarUrl?.startsWith("http") ? siteInfo.avatarUrl : `${siteUrl}${siteInfo.avatarUrl || "/avatar.jpg"}`;
  const snippet = `<a href="${siteUrl}" target="_blank" rel="noopener">${siteName}</a>`;

  return (
    <section className="mt-10 rounded-3xl border border-white/50 bg-white/55 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-400">NEIGHBOR / APPLICATION</p>
          <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">本站友链信息</h2>
          <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-500">
            想交换友链的话，直接复制本站信息；发现这里之后，也可以留下你的小屋。
          </p>
        </div>
        {!open && <button type="button" onClick={() => setOpen(true)} className="hv-button hv-button-primary"><Send size={14} /> 申请友链</button>}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["名称", siteName],
          ["网址", siteUrl],
          ["头像", siteAvatar],
          ["简介", siteInfo.bio || ""],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/40 bg-white/50 p-3 dark:border-white/10 dark:bg-slate-900/40">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</div>
            <div className="mt-1 truncate text-xs font-bold text-slate-700 dark:text-slate-200">{value}</div>
            <button type="button" onClick={() => void copy(value)} className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-indigo-500 hover:underline"><Clipboard size={11} /> 复制</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => void copy(snippet)} className="mt-3 text-[10px] font-bold text-indigo-500 hover:underline">复制 HTML 友链代码</button>

      {user && (
        <div className="mt-5 rounded-2xl border border-white/40 bg-white/50 p-4 dark:border-white/10 dark:bg-slate-900/40">
          {application ? (
            <>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                你的友链申请：<strong>{application.name}</strong> · {application.status === "APPROVED" ? "已通过" : application.status === "REJECTED" ? "未通过" : "审核中"}
              </p>
              <button type="button" onClick={startEdit} className="mt-2 text-[10px] font-bold text-indigo-500 hover:underline">编辑资料</button>
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-slate-500">之前提交过友链？登录后可绑定到当前账户。</span>
              <button type="button" onClick={() => void bind()} disabled={busy} className="hv-button">绑定之前的申请</button>
            </div>
          )}
        </div>
      )}

      {message && <p className="mt-4 text-xs font-bold text-indigo-500">{message}</p>}

      {open && (
        <div className="mt-6 rounded-2xl border border-indigo-400/20 bg-slate-950/30 p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 dark:text-white">{editingApplication ? "编辑友链资料" : "申请友链"}</h3>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-white/10"><X size={16} /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] font-bold text-slate-400">称谓<Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" placeholder="你的名字或站点名" /></label>
            <label className="text-[10px] font-bold text-slate-400">网站地址<Input value={url} onChange={(e) => setUrl(e.target.value)} disabled={application?.status === "APPROVED"} className="mt-1" placeholder="https://..." /></label>
            <label className="text-[10px] font-bold text-slate-400">头像地址<Input value={avatar} onChange={(e) => setAvatar(e.target.value)} className="mt-1" placeholder="https://..." /></label>
            <label className="text-[10px] font-bold text-slate-400">联系方式（仅管理员可见）<Input value={contact} onChange={(e) => setContact(e.target.value)} className="mt-1" placeholder="邮箱 / QQ / 其他" /></label>
            <label className="text-[10px] font-bold text-slate-400 sm:col-span-2">简介<Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1" placeholder="一句话介绍你的小屋" /></label>
          </div>
          <label className="mt-4 flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={hasBacklink} onChange={(e) => setHasBacklink(e.target.checked)} /> 我已在本站添加贵站友链</label>
          <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-[10px] leading-5 text-amber-700 dark:text-amber-300">
            提交前请确认网站可访问、信息准确、已添加本站友链。提交后进入人工审核，审核期间请勿重复提交；如需修改可注册后绑定申请。
          </div>
          <label className="mt-3 flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /> 我已确认以上信息无误</label>
          {turnstileConfig?.enabled && <div ref={turnstileRef} className="mt-3 min-h-[65px]" />}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="hv-button">取消</button>
            <button type="button" onClick={() => void submit()} disabled={busy} className="hv-button hv-button-primary inline-flex items-center gap-2 disabled:opacity-50">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} 提交申请
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
