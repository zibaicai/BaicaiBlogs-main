"use client";

import { useMemo, useState, type ReactNode } from "react";
import ArchiveHeader from "./ArchiveHeader";
import ArchiveToolbar from "./ArchiveToolbar";
import DirectoryView, { type DirectoryViewMode } from "./DirectoryView";

export interface DirectoryItem {
  key: string;
  node: ReactNode;
  searchText: string;
  filterValues?: string[];
}

export interface DirectoryFilter {
  value: string;
  label: string;
  count?: number;
}

export default function DirectoryExplorer({
  eyebrow,
  title,
  subtitle,
  count,
  items,
  filters = [{ value: "all", label: "全部" }],
  initialMode = "card",
  featuredFirst = false,
  compact = false,
  showTimeline = true,
  empty = "暂无内容",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  count?: string | number;
  items: DirectoryItem[];
  filters?: DirectoryFilter[];
  searchPlaceholder?: string;
  initialMode?: DirectoryViewMode;
  featuredFirst?: boolean;
  compact?: boolean;
  showTimeline?: boolean;
  empty?: ReactNode;
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [mode, setMode] = useState<DirectoryViewMode>(initialMode);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (activeFilter !== "all" && !(item.filterValues || []).includes(activeFilter)) return false;
      return true;
    });
  }, [items, activeFilter]);

  return (
    <>
      <ArchiveHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        count={count}
      />

      <ArchiveToolbar
        filters={filters}
        activeFilter={activeFilter}
        onFilter={setActiveFilter}
        mode={mode}
        onMode={setMode}
        showTimeline={showTimeline}
      />

      {filtered.length === 0 ? (
        <div className="directory-empty">{empty}</div>
      ) : (
        <DirectoryView items={filtered.map((item) => item.node)} mode={mode} featuredFirst={featuredFirst} compact={compact} />
      )}
    </>
  );
}
