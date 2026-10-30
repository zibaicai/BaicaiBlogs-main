"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, SlidersHorizontal, X } from "lucide-react";
import ArchiveHeader from "./ArchiveHeader";
import ArchiveToolbar, { type SortOption } from "./ArchiveToolbar";
import DirectoryView, { type ArchiveGridSurface, type ArchiveGridVariant, type ArchiveViewMode } from "./DirectoryView";

export interface DirectoryItem {
  key: string;
  node: ReactNode;
  searchText: string;
  filterValues?: string[];
  title?: string;
  tags?: string[];
  date?: string;
  updatedAt?: string;
}

export interface DirectoryFilter {
  value: string;
  label: string;
  count?: number;
}

type TimeRange = "all" | "7d" | "30d" | "365d";

const TIME_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "all", label: "全部时间" },
  { value: "7d", label: "近 7 天" },
  { value: "30d", label: "近 30 天" },
  { value: "365d", label: "近一年" },
];

function timestamp(value?: string): number | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function timeCutoff(range: TimeRange): number | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 365;
  return Date.now() - days * 24 * 60 * 60 * 1000;
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
  gridVariant = "profile",
  surface,
  gridStyle,
  gridClassName = "",
  pageSize = 0,
  initialPage = 1,
  empty = "暂无内容",
  masonryColumns = 4,
  defaultSort = "default",
  enableTimeFilter = true,
  enableTagFilter = true,
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
  gridVariant?: ArchiveGridVariant;
  surface?: ArchiveGridSurface;
  gridStyle?: CSSProperties;
  gridClassName?: string;
  pageSize?: number;
  initialPage?: number;
  empty?: ReactNode;
  masonryColumns?: number;
  defaultSort?: string;
  enableTimeFilter?: boolean;
  enableTagFilter?: boolean;
}) {
  const pathname = usePathname();
  const [activeFilter, setActiveFilter] = useState("all");
  const [mode, setMode] = useState<ArchiveViewMode>(initialMode);
  const [page, setPage] = useState(Math.max(1, initialPage));
  const [sort, setSort] = useState(defaultSort);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const hasDates = useMemo(
    () => enableTimeFilter && items.some((item) => timestamp(item.date) !== null),
    [enableTimeFilter, items]
  );
  const hasTags = useMemo(
    () => enableTagFilter && items.some((item) => (item.tags || []).length > 0),
    [enableTagFilter, items]
  );
  const hasUpdated = useMemo(
    () => items.some((item) => timestamp(item.updatedAt) !== null),
    [items]
  );

  const sortOptions = useMemo<SortOption[]>(() => {
    const options: SortOption[] = [{ value: "default", label: "默认排序" }];
    if (hasDates) {
      options.push({ value: "newest", label: "最新优先" });
      options.push({ value: "oldest", label: "最早优先" });
    }
    if (hasUpdated) options.push({ value: "updated", label: "最近更新" });
    options.push({ value: "title", label: "标题 A-Z" });
    return options;
  }, [hasDates, hasUpdated]);

  useEffect(() => {
    if (!sortOptions.some((option) => option.value === sort)) setSort(sortOptions[0]?.value || "default");
  }, [sort, sortOptions]);

  const scoped = useMemo(() => {
    const cutoff = timeCutoff(timeRange);
    return items.filter((item) => {
      if (activeFilter !== "all" && !(item.filterValues || []).includes(activeFilter)) return false;
      if (cutoff === null) return true;
      const value = timestamp(item.date);
      return value !== null && value >= cutoff;
    });
  }, [items, activeFilter, timeRange]);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    scoped.forEach((item) => {
      (item.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
      .map(([tag, value]) => ({ tag, count: value }));
  }, [scoped]);

  const filtered = useMemo(() => {
    const tagFiltered = scoped.filter((item) =>
      selectedTags.every((tag) => (item.tags || []).includes(tag))
    );
    const sorted = [...tagFiltered];
    if (sort === "newest" || sort === "oldest") {
      const direction = sort === "newest" ? -1 : 1;
      sorted.sort((a, b) => (timestamp(a.date) || 0) - (timestamp(b.date) || 0) || 0);
      if (direction === -1) sorted.reverse();
    } else if (sort === "updated") {
      sorted.sort((a, b) => (timestamp(b.updatedAt) || timestamp(b.date) || 0) - (timestamp(a.updatedAt) || timestamp(a.date) || 0));
    } else if (sort === "title") {
      sorted.sort((a, b) => (a.title || "").localeCompare(b.title || "", "zh-CN"));
    }
    return sorted;
  }, [scoped, selectedTags, sort]);

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1;
  const currentPage = Math.min(page, totalPages);
  const visible = pageSize > 0
    ? filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filtered;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const activeFilterCount = (timeRange === "all" ? 0 : 1) + selectedTags.length;

  const goToPage = (next: number) => {
    setPage(next);
    const href = next <= 1 ? pathname : `${pathname}?page=${next}`;
    window.history.replaceState(null, "", href);
  };

  const clearFilters = () => {
    setTimeRange("all");
    setSelectedTags([]);
    setPage(1);
  };

  return (
    <>
      <ArchiveHeader eyebrow={eyebrow} title={title} subtitle={subtitle} count={count} />

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
        sort={sort}
        sortOptions={sortOptions}
        onSort={(value) => {
          setSort(value);
          setPage(1);
        }}
        onOpenFilters={() => setFilterOpen(true)}
        activeFilterCount={activeFilterCount}
        showFilters={hasDates || hasTags}
      />

      {activeFilterCount > 0 && (
        <div className="archive-active-filters">
          {timeRange !== "all" && (
            <button type="button" onClick={() => { setTimeRange("all"); setPage(1); }} className="archive-filter-chip">
              {TIME_OPTIONS.find((option) => option.value === timeRange)?.label}
              <X size={11} />
            </button>
          )}
          {selectedTags.map((tag) => (
            <button
              type="button"
              key={tag}
              onClick={() => { setSelectedTags((current) => current.filter((item) => item !== tag)); setPage(1); }}
              className="archive-filter-chip"
            >
              #{tag}
              <X size={11} />
            </button>
          ))}
          <button type="button" onClick={clearFilters} className="archive-filter-clear">清除全部</button>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="directory-empty">{empty}</div>
      ) : (
        <DirectoryView
          items={visible.map((item) => item.node)}
          mode={mode}
          featuredFirst={featuredFirst}
          compact={compact}
          gridVariant={gridVariant}
          surface={surface}
          gridStyle={gridStyle}
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

      {filterOpen && (
        <div className="archive-filter-backdrop" onClick={() => setFilterOpen(false)}>
          <div
            className="archive-filter-panel"
            role="dialog"
            aria-modal="true"
            aria-label="筛选内容"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="archive-filter-head">
              <div>
                <div className="archive-filter-eyebrow"><SlidersHorizontal size={13} /> FILTERS</div>
                <h2>筛选内容</h2>
              </div>
              <button type="button" onClick={() => setFilterOpen(false)} aria-label="关闭筛选" className="archive-filter-close">
                <X size={17} />
              </button>
            </div>

            {hasDates && (
              <section className="archive-filter-section">
                <h3>时间</h3>
                <div className="archive-filter-time-grid">
                  {TIME_OPTIONS.map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => { setTimeRange(option.value); setPage(1); }}
                      className={`archive-filter-option ${timeRange === option.value ? "is-selected" : ""}`}
                    >
                      {option.label}
                      {timeRange === option.value && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {hasTags && (
              <section className="archive-filter-section">
                <h3>标签</h3>
                <div className="archive-filter-tag-list">
                  {tagCounts.map(({ tag, count: tagCount }) => {
                    const checked = selectedTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => {
                          setSelectedTags((current) => checked ? current.filter((item) => item !== tag) : [...current, tag]);
                          setPage(1);
                        }}
                        className={`archive-filter-tag ${checked ? "is-selected" : ""}`}
                      >
                        <span>#{tag}</span>
                        <span className="archive-filter-tag-count">{tagCount}</span>
                      </button>
                    );
                  })}
                  {tagCounts.length === 0 && <p className="archive-filter-note">当前条件下没有可用标签。</p>}
                </div>
              </section>
            )}

            <div className="archive-filter-foot">
              <button type="button" onClick={clearFilters} className="archive-filter-reset">清除全部</button>
              <button type="button" onClick={() => setFilterOpen(false)} className="archive-filter-apply">完成</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
