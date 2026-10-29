"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "success" | "warning" | "ghost";
type Size = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: "bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/20",
  secondary: "border border-white/10 bg-white/10 text-slate-200 hover:border-indigo-400/40 hover:bg-white/15",
  danger: "bg-red-500/90 text-white hover:bg-red-400 shadow-lg shadow-red-500/15",
  success: "bg-emerald-500/90 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/15",
  warning: "bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-lg shadow-amber-500/15",
  ghost: "text-slate-400 hover:bg-white/10 hover:text-slate-100",
};

const sizes: Record<Size, string> = {
  sm: "h-8 rounded-lg px-2.5 text-[10px]",
  md: "h-10 rounded-xl px-4 text-xs",
  lg: "h-12 rounded-2xl px-6 text-sm",
  icon: "h-7 w-7 rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "sm", type = "button", disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-black transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.98] ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
);

Button.displayName = "Button";
