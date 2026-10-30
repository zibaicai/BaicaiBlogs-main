"use client";

import { SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import type { DirectoryFilter } from "./DirectoryExplorer";
import { ARCHIVE_VIEWS, type ArchiveViewMode } from "./DirectoryView";
import Select from "./ui/Select";

export interface SortOption {
  value: string;
  label: string;
}

export default function ArchiveToolbar({
  filters,
  activeFilter,
  onFilter,
  mode,
  onMode,
  views,
  sort,
  sortOptions,
  onSort,
  onOpenFilters,
  activeFilterCount,
  showFilters = true,
  extra,
}: {
  filters: DirectoryFilter[];
  activeFilter: string;
  onFilter: (value: string) => void;
  mode: ArchiveViewMode;
  onMode: (mode: ArchiveViewMode) => void;
  views: ArchiveViewMode[];
  sort: string;
  sortOptions: SortOption[];
  onSort: (value: string) => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
  showFilters?: boolean;
  extra?: ReactNode;
}) {
  return (
    <div className="directory-toolbar">
      <div className="directory-tab-scroll">
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
      </div>

      <div className="directory-toolbar-actions">
        {extra}
        <Select
          value={sort}
          onChange={onSort}
          ariaLabel="排序方式"
          size="sm"
          width="compact"
          tone="subtle"
          menuTone="glass"
          options={sortOptions}
        />
        {showFilters && (
          <button
            type="button"
            onClick={onOpenFilters}
            className={`directory-filter-trigger ${activeFilterCount > 0 ? "is-active" : ""}`}
            aria-label="打开筛选"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">筛选</span>
            {activeFilterCount > 0 && <span className="directory-filter-count">{activeFilterCount}</span>}
          </button>
        )}
        {views.length > 1 && (
          <div className="directory-view-toggle" role="group" aria-label="视图模式">
            {views.map((key) => {
              const view = ARCHIVE_VIEWS[key];
              if (!view) return null;
              const Icon = view.icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onMode(key)}
                  aria-pressed={mode === key}
                  className={`directory-view-toggle-button ${mode === key ? "directory-view-toggle-active" : ""}`}
                >
                  <Icon size={15} />
                  <span className="hidden sm:inline">{view.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
