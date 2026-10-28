"use client";

import type { ReactNode } from "react";

export const inputClass = "control-field";

export function SettingsCard({
  title,
  description,
  icon,
  action,
  children,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[30px] border border-white/50 bg-white/40 p-7 shadow-xl backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/40">
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4 border-b border-white/30 pb-5 dark:border-slate-700/50">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-800 dark:text-white">
            {icon}
            {title}
          </h2>
          {description && (
            <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function SettingsField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </span>
      {children}
      {hint && <span className="mt-2 block text-[10px] leading-5 text-slate-400">{hint}</span>}
    </label>
  );
}

export function SettingsSaveButton({
  onClick,
  children = "保存修改",
}: {
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl bg-indigo-500 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-600"
    >
      {children}
    </button>
  );
}
