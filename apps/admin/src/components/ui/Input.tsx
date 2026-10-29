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
          className={`control-field h-8 rounded-lg text-[11px] ${error ? "!border-red-400/60" : ""} ${className}`}
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
          className={`control-field control-textarea ${error ? "!border-red-400/60" : ""} ${className}`}
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
