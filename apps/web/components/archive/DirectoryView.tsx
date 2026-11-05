"use client";

import { cloneElement, isValidElement, type ReactElement } from "react";
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
  const withLayout = (layout: "cover" | "profile" | "timeline" | "masonry") =>
    items.map((item) =>
      isValidElement(item)
        ? cloneElement(item as ReactElement<{ layout?: string }>, { layout })
        : item
    );

  if (mode === "timeline") {
    return <ArchiveTimeline items={withLayout("timeline")} alternating={alternating} />;
  }

  if (mode === "masonry") {
    return <ArchiveMasonry items={withLayout("masonry")} masonryColumns={masonryColumns} />;
  }

  if (mode === "thread") {
    return <ArchiveThread items={items} />;
  }

  const gridLayout = gridVariant === "profile" ? "profile" : "cover";

  return (
    <ArchiveGrid
      items={withLayout(gridLayout)}
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
