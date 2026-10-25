"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

export type DirectoryViewMode = "timeline" | "card";

function TimelineView({ items }: { items: ReactNode[] }) {
  return (
    <div className="relative overflow-hidden p-2 md:p-10">
      <div className="absolute left-1/2 h-full -translate-x-1/2 rounded-full border-2 border-indigo-500/20" />
      <div className="relative z-10 flex flex-col gap-6">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: Math.min(index, 6) * 0.04, ease: [0.22, 1, 0.36, 1] }}
            className={`timeline-row flex w-full items-center justify-between ${
              index % 2 === 0 ? "md:flex-row-reverse" : "flex-row"
            }`}
          >
            <div className="order-1 hidden w-5/12 md:block" />
            <div className="z-20 order-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-4 border-indigo-400 bg-white shadow-xl ring-4 ring-indigo-200/50 dark:bg-slate-900 dark:ring-indigo-900/30" />
            <div className="order-1 w-full md:w-5/12">{item}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function DirectoryView({
  items,
  mode,
  featuredFirst = false,
}: {
  items: ReactNode[];
  mode: DirectoryViewMode;
  featuredFirst?: boolean;
}) {
  if (mode === "timeline") return <TimelineView items={items} />;

  return (
    <div className="directory-grid">
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: Math.min(index, 7) * 0.035, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full ${featuredFirst && index === 0 ? "directory-featured" : ""}`}
        >
          {item}
        </motion.div>
      ))}
    </div>
  );
}
