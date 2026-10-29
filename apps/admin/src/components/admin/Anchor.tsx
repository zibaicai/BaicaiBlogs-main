"use client";

import { useEffect, useState } from "react";

export type AnchorItem = { id: string; text: string; level: number };

export function Anchor({ items, title = "目录" }: { items: AnchorItem[]; title?: string }) {
  const [active, setActive] = useState(items[0]?.id || "");

  useEffect(() => {
    if (!items.length) return;
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-90px 0px -70% 0px", threshold: [0, 1] }
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;

  return (
    <nav className="space-y-1" aria-label={title}>
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{title}</p>
      <div className="border-l border-white/10">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`block border-l-2 py-1 text-[10px] leading-4 transition ${
              active === item.id ? "border-indigo-400 text-indigo-300" : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
            style={{ paddingLeft: 8 + Math.max(0, item.level - 1) * 10 }}
          >
            {item.text}
          </a>
        ))}
      </div>
    </nav>
  );
}
