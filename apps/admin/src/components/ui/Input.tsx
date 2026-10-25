"use client";

import { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className = "", id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id || autoId;
    return (
      <label htmlFor={inputId} className="flex w-full flex-col gap-1.5">
        {label && <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</span>}
        <input
          ref={ref}
          id={inputId}
          className={`h-11 w-full rounded-2xl border bg-black/25 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${
            error ? "border-red-400/60" : "border-white/10"
          } ${className}`}
          {...props}
        />
        {error ? (
          <span className="text-[10px] font-bold text-red-400">{error}</span>
        ) : hint ? (
          <span className="text-[10px] text-slate-500">{hint}</span>
        ) : null}
      </label>
    );
  }
);
Input.displayName = "Input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className = "", id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id || autoId;
    return (
      <label htmlFor={inputId} className="flex w-full flex-col gap-1.5">
        {label && <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</span>}
        <textarea
          ref={ref}
          id={inputId}
          className={`w-full resize-none rounded-2xl border bg-black/25 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${
            error ? "border-red-400/60" : "border-white/10"
          } ${className}`}
          {...props}
        />
        {error ? (
          <span className="text-[10px] font-bold text-red-400">{error}</span>
        ) : hint ? (
          <span className="text-[10px] text-slate-500">{hint}</span>
        ) : null}
      </label>
    );
  }
);
Textarea.displayName = "Textarea";
