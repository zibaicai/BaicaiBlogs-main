"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import type { ArchiveGridProps } from "./types";

/**
 * Grid skeleton. It only arranges card nodes; it does not know what kind of
 * resource a card represents.
 */
export default function ArchiveGrid({
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
}: ArchiveGridProps) {
  const columnStyle: CSSProperties = {};
  if (columns === "auto") {
    columnStyle["--grid-columns-mode" as string] = "auto";
  } else if (typeof columns === "number") {
    columnStyle["--grid-cols-base" as string] = String(columns);
  } else if (columns) {
    if (columns.base !== undefined) columnStyle["--grid-cols-base" as string] = String(columns.base);
    if (columns.sm !== undefined) columnStyle["--grid-cols-sm" as string] = String(columns.sm);
    if (columns.md !== undefined) columnStyle["--grid-cols-md" as string] = String(columns.md);
    if (columns.lg !== undefined) columnStyle["--grid-cols-lg" as string] = String(columns.lg);
    if (columns.xl !== undefined) columnStyle["--grid-cols-xl" as string] = String(columns.xl);
  }
  if (minCardWidth !== undefined) columnStyle["--grid-card-min" as string] = `${minCardWidth}px`;

  return (
    <div
      className={`directory-grid ${compact ? "directory-grid-compact" : ""} ${
        gridVariant === "cover"
          ? "cover-grid"
          : gridVariant === "row"
            ? "row-grid"
            : gridVariant === "album"
              ? "album-grid"
              : "profile-grid"
      } ${surface ? `archive-grid-surface--${surface}` : ""} ${gridClassName}`}
      data-grid-variant={gridVariant}
      data-grid-columns={columns ? (columns === "auto" ? "auto" : "custom") : undefined}
      data-grid-gap={gap}
      data-card-size={cardSize}
      data-grid-density={density}
      data-card-ratio={cardRatio}
      data-grid-surface={surface}
      style={{ ...columnStyle, ...gridStyle }}
    >
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: Math.min(index, 7) * 0.035, ease: [0.22, 1, 0.36, 1] }}
          className={`${compact ? "self-start" : "h-full"} ${featuredFirst && !compact && index === 0 ? "directory-featured" : ""}`}
        >
          {item}
        </motion.div>
      ))}
    </div>
  );
}

export const ArchiveGridShell = ArchiveGrid;
