"use client";

import { useMemo, useState, type ReactNode } from "react";
import { LayoutGrid, ListTree, Search } from "lucide-react";
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
  searchPlaceholder = "搜索目录...",
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
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [mode, setMode] = useState<DirectoryViewMode>(initialMode);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (activeFilter !== "all" && !(item.filterValues || []).includes(activeFilter)) return false;
      if (!q) return true;
      return item.searchText.toLowerCase().includes(q);
    });
  }, [items, query, activeFilter]);

  return (
    <>
      <DirectoryHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        count={count}
      />

      <div className="mb-6 flex w-full justify-center">
        <div className="relative w-full max-w-lg group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="directory-search"
          />
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
        </div>
      </div>

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
