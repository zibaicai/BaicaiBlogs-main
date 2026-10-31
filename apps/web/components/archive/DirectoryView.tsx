"use client";

import ArchiveGrid from "./ArchiveGrid";
import ArchiveMasonry from "./ArchiveMasonry";
import ArchiveThread from "./ArchiveThread";
import ArchiveTimeline from "./ArchiveTimeline";
import type { ArchiveLayoutProps, ArchiveViewMode } from "./types";

export default function DirectoryView({
  mode,
  items,
  featuredFirst = false,
  compact = false,
  gridVariant = "profile",
  columns,
  minCardWidth,
  gap,
  cardSize,
  density,
  cardRatio,
  surface,
  gridStyle,
  gridClassName = "",
  alternating = true,
  masonryColumns = 4,
}: ArchiveLayoutProps & { mode: ArchiveViewMode }) {
  if (mode === "timeline") {
    return <ArchiveTimeline items={items} alternating={alternating} />;
  }

  if (mode === "masonry") {
    return <ArchiveMasonry items={items} masonryColumns={masonryColumns} />;
  }

  if (mode === "thread") {
    return <ArchiveThread items={items} />;
  }

  return (
    <ArchiveGrid
      items={items}
      featuredFirst={featuredFirst}
      compact={compact}
      gridVariant={gridVariant}
      columns={columns}
      minCardWidth={minCardWidth}
      gap={gap}
      cardSize={cardSize}
      density={density}
      cardRatio={cardRatio}
      surface={surface}
      gridStyle={gridStyle}
      gridClassName={gridClassName}
    />
  );
}
