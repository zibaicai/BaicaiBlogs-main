"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ArchiveHeader from "./ArchiveHeader";
import ArchiveToolbar from "./ArchiveToolbar";
import DirectoryView, { type ArchiveViewMode } from "./DirectoryView";

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
  initialMode = "grid",
  views = ["grid", "timeline"],
  featuredFirst = false,
  compact = false,
  gridClassName = "",
  pageSize = 0,
  initialPage = 1,
  empty = "暂无内容",
  masonryColumns = 4,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  count?: string | number;
  items: DirectoryItem[];
  filters?: DirectoryFilter[];
  searchPlaceholder?: string;
  initialMode?: ArchiveViewMode;
  views?: ArchiveViewMode[];
  featuredFirst?: boolean;
  compact?: boolean;
  gridClassName?: string;
  pageSize?: number;
  initialPage?: number;
  empty?: ReactNode;
  masonryColumns?: number;
}) {
  const pathname = usePathname();
  const [activeFilter, setActiveFilter] = useState("all");
  const [mode, setMode] = useState<ArchiveViewMode>(initialMode);
  const [page, setPage] = useState(Math.max(1, initialPage));

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (activeFilter !== "all" && !(item.filterValues || []).includes(activeFilter)) return false;
      return true;
    });
  }, [items, activeFilter]);

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1;
  const currentPage = Math.min(page, totalPages);
  const visible = pageSize > 0
    ? filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filtered;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const goToPage = (next: number) => {
    setPage(next);
    const href = next <= 1 ? pathname : `${pathname}?page=${next}`;
    window.history.replaceState(null, "", href);
  };

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
        onFilter={(value) => {
          setActiveFilter(value);
          setPage(1);
        }}
        mode={mode}
        onMode={setMode}
        views={views}
      />

      {visible.length === 0 ? (
        <div className="directory-empty">{empty}</div>
      ) : (
        <DirectoryView
          items={visible.map((item) => item.node)}
          mode={mode}
          featuredFirst={featuredFirst}
          compact={compact}
          gridClassName={gridClassName}
          masonryColumns={masonryColumns}
        />
      )}

      {pageSize > 0 && totalPages > 1 && (
        <nav className="archive-pagination" aria-label="分页">
          {currentPage > 1 ? (
            <Link
              href={currentPage - 1 <= 1 ? pathname : `${pathname}?page=${currentPage - 1}`}
              scroll={false}
              onClick={(event) => { event.preventDefault(); goToPage(currentPage - 1); }}
            >
              上一页
            </Link>
          ) : <span className="is-disabled">上一页</span>}
          <span className="archive-pagination-current">{currentPage} / {totalPages}</span>
          {currentPage < totalPages ? (
            <Link
              href={`${pathname}?page=${currentPage + 1}`}
              scroll={false}
              onClick={(event) => { event.preventDefault(); goToPage(currentPage + 1); }}
            >
              下一页
            </Link>
          ) : <span className="is-disabled">下一页</span>}
        </nav>
      )}
    </>
  );
}
