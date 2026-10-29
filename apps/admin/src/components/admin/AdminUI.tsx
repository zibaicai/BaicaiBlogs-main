"use client";

import type { ReactNode } from "react";

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
