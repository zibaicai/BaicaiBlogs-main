import type { CSSProperties, ReactNode } from "react";

export type ArchiveViewMode = "grid" | "timeline" | "masonry" | "thread";
export type ArchiveGridVariant = "profile" | "cover" | "row" | "album";
export type ArchiveGridSurface = "glass" | "solid" | "ghost";
export type ArchiveGridGap = "sm" | "md" | "lg";
export type ArchiveCardSize = "sm" | "md" | "lg";
export type ArchiveGridDensity = "compact" | "comfortable";
export type ArchiveCardRatio = "auto" | "square" | "4/3" | "16/9";

export type ArchiveGridColumns =
  | "auto"
  | number
  | {
      base?: number;
      sm?: number;
      md?: number;
      lg?: number;
      xl?: number;
    };

/** The only contract every view needs: an ordered list of card nodes. */
export interface ArchiveBaseProps {
  items: ReactNode[];
}

export interface ArchiveGridProps extends ArchiveBaseProps {
  featuredFirst?: boolean;
  compact?: boolean;
  gridVariant?: ArchiveGridVariant;
  columns?: ArchiveGridColumns;
  minCardWidth?: number;
  gap?: ArchiveGridGap;
  cardSize?: ArchiveCardSize;
  density?: ArchiveGridDensity;
  cardRatio?: ArchiveCardRatio;
  surface?: ArchiveGridSurface;
  gridStyle?: CSSProperties;
  gridClassName?: string;
}

export interface ArchiveTimelineProps extends ArchiveBaseProps {
  alternating?: boolean;
}

export interface ArchiveMasonryProps extends ArchiveBaseProps {
  masonryColumns?: number;
}

export interface ArchiveThreadProps extends ArchiveBaseProps {}

/**
 * Compatibility shape for callers that pass the full grid option set through
 * the generic directory explorer. Each view still consumes only its own props.
 */
export type ArchiveLayoutProps = ArchiveGridProps &
  ArchiveTimelineProps &
  ArchiveMasonryProps &
  ArchiveThreadProps;
