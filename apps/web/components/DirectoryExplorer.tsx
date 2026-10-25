"use client";

import { useMemo, useState, type ReactNode } from "react";
import { LayoutGrid, ListTree } from "lucide-react";
import DirectoryHeader from "./DirectoryHeader";
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
      <DirectoryHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        count={count}
      />

      <div className="directory-toolbar">
        <div className="directory-tabs">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              className={`directory-tab ${
                activeFilter === filter.value ? "directory-tab-active" : ""
              }`}
            >
              {filter.label}
              {filter.count !== undefined && (
                <span className="ml-1 opacity-50">{filter.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="directory-view-toggle" role="group" aria-label="视图模式">
          <button
            type="button"
            onClick={() => setMode("timeline")}
            aria-pressed={mode === "timeline"}
            className={`directory-view-toggle-button ${
              mode === "timeline" ? "directory-view-toggle-active" : ""
            }`}
          >
            <ListTree size={15} />
            <span className="hidden sm:inline">中枢链路</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("card")}
            aria-pressed={mode === "card"}
            className={`directory-view-toggle-button ${
              mode === "card" ? "directory-view-toggle-active" : ""
            }`}
          >
            <LayoutGrid size={15} />
            <span className="hidden sm:inline">矩阵网格</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="directory-empty">{empty}</div>
      ) : (
        <DirectoryView items={filtered.map((item) => item.node)} mode={mode} />
      )}
    </>
  );
}
