"use client";

import type { InputHTMLAttributes } from "react";

const BASE =
  "w-full rounded-xl border border-white/40 bg-white/60 px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-500 outline-none transition focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/15 dark:border-white/10 dark:bg-slate-900/55 dark:text-slate-100 dark:placeholder:text-slate-400";

export default function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${BASE} ${className}`.trim()} />;
}
