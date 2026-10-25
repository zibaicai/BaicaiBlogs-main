import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  padded?: boolean;
}

export function Card({ title, description, actions, padded = true, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/10 ${className}`}
      {...props}
    >
      {(title || description || actions) && (
        <div className="flex items-start justify-between gap-4 border-b border-white/5 px-5 py-4">
          <div className="min-w-0">
            {title && <div className="text-sm font-black text-white">{title}</div>}
            {description && <div className="mt-1 text-[11px] font-medium text-slate-400">{description}</div>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </div>
  );
}
