"use client";

import type { ComponentType, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Columns3, LayoutGrid, ListTree, MessageCircle, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

export type ArchiveViewMode = "grid" | "timeline" | "masonry" | "thread";

export interface ArchiveViewDefinition {
  label: string;
  icon: LucideIcon;
  component: ComponentType<ArchiveLayoutProps>;
}

export interface ArchiveLayoutProps {
  items: ReactNode[];
  featuredFirst?: boolean;
  compact?: boolean;
  gridClassName?: string;
  masonryColumns?: number;
}

export function ArchiveTimeline({ items }: ArchiveLayoutProps) {
  return (
    <div className="archive-timeline relative overflow-hidden p-2 md:p-10">
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

export function ArchiveGrid({
  items,
  featuredFirst = false,
  compact = false,
  gridClassName = "",
}: ArchiveLayoutProps) {
  return (
    <div className={`directory-grid ${compact ? "directory-grid-compact" : ""} ${gridClassName}`}>
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: Math.min(index, 7) * 0.035, ease: [0.22, 1, 0.36, 1] }}
          className={`${compact ? "self-start" : "h-full"} ${featuredFirst && !compact && index === 0 ? "directory-featured" : ""}`}
        >
          {item}
        </motion.div>
      ))}
    </div>
  );
}

export function ArchiveMasonry({ items, masonryColumns = 4 }: ArchiveLayoutProps) {  const [columnCount, setColumnCount] = useState(masonryColumns);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth <= 640) setColumnCount(1);
      else if (window.innerWidth <= 900) setColumnCount(Math.min(2, masonryColumns));
      else setColumnCount(masonryColumns);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [masonryColumns]);

  const columns: ReactNode[][] = Array.from({ length: columnCount }, () => []);
  items.forEach((item, index) => columns[index % columnCount].push(item));

  return (
    <div className="archive-masonry">
      {columns.map((column, columnIndex) => (
        <div className="archive-masonry-column" key={columnIndex}>
          {column.map((item, index) => (
            <motion.div
              key={`${columnIndex}-${index}`}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.3, delay: Math.min(index, 5) * 0.04, ease: [0.22, 1, 0.36, 1] }}
            >
              {item}
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ArchiveThread({ items }: ArchiveLayoutProps) {
  return (
    <div className="moment-thread">
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.03, ease: [0.22, 1, 0.36, 1] }}
          className="moment-row"
          data-side={index % 2 === 0 ? "left" : "right"}
        >
          {item}
        </motion.div>
      ))}
    </div>
  );
}

export const ARCHIVE_VIEWS: Record<ArchiveViewMode, ArchiveViewDefinition> = {
  grid: { label: "网格", icon: LayoutGrid, component: ArchiveGrid },
  timeline: { label: "时间线", icon: ListTree, component: ArchiveTimeline },
  masonry: { label: "瀑布流", icon: Columns3, component: ArchiveMasonry },
  thread: { label: "交错对话", icon: MessageCircle, component: ArchiveThread },
};

export default function DirectoryView({
  items,
  mode,
  featuredFirst = false,
  compact = false,
  gridClassName = "",
  masonryColumns = 4,
}: ArchiveLayoutProps & { mode: ArchiveViewMode }) {
  const view = ARCHIVE_VIEWS[mode] || ARCHIVE_VIEWS.grid;
  const Layout = view.component;
  return (
    <Layout
      items={items}
      featuredFirst={featuredFirst}
      compact={compact}
      gridClassName={gridClassName}
      masonryColumns={masonryColumns}
    />
  );
}
