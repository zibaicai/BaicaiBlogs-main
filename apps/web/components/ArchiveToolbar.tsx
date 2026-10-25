"use client";

import { LayoutGrid, ListTree } from "lucide-react";
import type { DirectoryFilter } from "./DirectoryExplorer";
import type { DirectoryViewMode } from "./DirectoryView";

export default function ArchiveToolbar({
  filters,
  activeFilter,
  onFilter,
  mode,
  onMode,
  showTimeline,
}: {
  filters: DirectoryFilter[];
  activeFilter: string;
  onFilter: (value: string) => void;
  mode: DirectoryViewMode;
  onMode: (mode: DirectoryViewMode) => void;
  showTimeline: boolean;
}) {
  return (
    <div className="directory-toolbar">
      <div className="directory-tabs">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => onFilter(filter.value)}
            className={`directory-tab ${activeFilter === filter.value ? "directory-tab-active" : ""}`}
          >
            {filter.label}
            {filter.count !== undefined && <span className="ml-1 opacity-50">{filter.count}</span>}
          </button>
        ))}
      </div>

      {showTimeline && (
        <div className="directory-view-toggle" role="group" aria-label="视图模式">
          <button
            type="button"
            onClick={() => onMode("timeline")}
            aria-pressed={mode === "timeline"}
            className={`directory-view-toggle-button ${mode === "timeline" ? "directory-view-toggle-active" : ""}`}
          >
            <ListTree size={15} />
            <span className="hidden sm:inline">中枢链路</span>
          </button>
          <button
            type="button"
            onClick={() => onMode("card")}
            aria-pressed={mode === "card"}
            className={`directory-view-toggle-button ${mode === "card" ? "directory-view-toggle-active" : ""}`}
          >
            <LayoutGrid size={15} />
            <span className="hidden sm:inline">矩阵网格</span>
          </button>
        </div>
      )}
    </div>
  );
}
