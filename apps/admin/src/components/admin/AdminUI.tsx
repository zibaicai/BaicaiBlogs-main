"use client";

import type { ReactNode } from "react";
import { Inbox, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export function AdminPageShell({ children }: { children: ReactNode }) {
  return <div className="w-full space-y-4">{children}</div>;
}

export function AdminPageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-indigo-400">{eyebrow}</p>}
        <h1 className="text-xl font-bold leading-tight text-white">{title}</h1>
        {description && <p className="mt-0.5 text-[11px] text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  PUBLISHED: { label: "已发布", className: "bg-emerald-500/10 text-emerald-300" },
  VISIBLE: { label: "显示中", className: "bg-emerald-500/10 text-emerald-300" },
  APPROVED: { label: "已通过", className: "bg-emerald-500/10 text-emerald-300" },
  DRAFT: { label: "草稿", className: "bg-amber-500/10 text-amber-300" },
  PENDING: { label: "待审核", className: "bg-amber-500/10 text-amber-300" },
  HIDDEN: { label: "已隐藏", className: "bg-red-500/10 text-red-300" },
  REJECTED: { label: "未通过", className: "bg-red-500/10 text-red-300" },
  DELETED: { label: "已删除", className: "bg-slate-500/10 text-slate-400" },
  ARCHIVED: { label: "已归档", className: "bg-slate-500/10 text-slate-400" },
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const style = STATUS_STYLE[status] || { label: status, className: "bg-white/10 text-slate-300" };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${style.className}`}>
      {label || style.label}
    </span>
  );
}

export function TagBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-slate-400">
      #{children}
    </span>
  );
}

export function AdminEmptyState({
  title = "暂无数据",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      <Inbox size={22} className="text-slate-600" />
      <p className="mt-2 text-xs font-bold text-slate-400">{title}</p>
      {description && <p className="mt-1 text-[10px] text-slate-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function AdminLoading({ label = "加载中…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-[11px] text-slate-500">
      <Loader2 size={15} className="animate-spin text-indigo-400" /> {label}
    </div>
  );
}

export function AdminBreadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="面包屑" className="flex items-center gap-1 text-[10px] text-slate-500">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1">
          {index > 0 && <span className="text-slate-700">/</span>}
          {item.to ? <Link to={item.to} className="hover:text-indigo-300">{item.label}</Link> : <span className="text-slate-400">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function Tabs({
  value,
  onChange,
  items,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  items: { value: string; label: string; count?: number }[];
  className?: string;
}) {
  return (
    <div className={`flex gap-0.5 overflow-x-auto rounded-lg bg-white/5 p-0.5 ${className}`}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={`shrink-0 rounded-md px-2.5 py-1.5 text-[10px] font-bold transition ${
            value === item.value ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          {item.label}
          {typeof item.count === "number" && <span className="ml-1 opacity-60">{item.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function FormField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-[10px] font-bold text-slate-400">
      {label}
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-[9px] font-normal text-slate-600">{hint}</span>}
    </label>
  );
}

export function FormActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>;
}

export function FilterTabs({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; count?: number }[];
}) {
  return (
    <div className="flex gap-0.5 rounded-lg bg-white/5 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-md px-2.5 py-1.5 text-[10px] font-bold transition ${
            value === option.value ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          {option.label}
          {typeof option.count === "number" && <span className="ml-1 opacity-60">{option.count}</span>}
        </button>
      ))}
    </div>
  );
}
