"use client";

import type { DirectoryFilter } from "./DirectoryExplorer";
import { ARCHIVE_VIEWS, type ArchiveViewMode } from "./DirectoryView";

export default function ArchiveToolbar({
  filters,
  activeFilter,
  onFilter,
  mode,
  onMode,
  views,
}: {
  filters: DirectoryFilter[];
  activeFilter: string;
  onFilter: (value: string) => void;
  mode: ArchiveViewMode;
  onMode: (mode: ArchiveViewMode) => void;
  views: ArchiveViewMode[];
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
  );
}
