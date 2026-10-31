import { Columns3, LayoutGrid, ListTree, MessageCircle, type LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import ArchiveGrid from "./ArchiveGrid";
import ArchiveMasonry from "./ArchiveMasonry";
import ArchiveThread from "./ArchiveThread";
import ArchiveTimeline from "./ArchiveTimeline";
import type { ArchiveBaseProps, ArchiveViewMode } from "./types";

export interface ArchiveViewCapabilities {
  columns: boolean;
  masonryColumns: boolean;
  alternating: boolean;
  featured: boolean;
}

export interface ArchiveViewDefinition {
  label: string;
  icon: LucideIcon;
  component: ComponentType<ArchiveBaseProps>;
  capabilities: ArchiveViewCapabilities;
}

export const ARCHIVE_VIEWS: Record<ArchiveViewMode, ArchiveViewDefinition> = {
  grid: {
    label: "网格",
    icon: LayoutGrid,
    component: ArchiveGrid,
    capabilities: { columns: true, masonryColumns: false, alternating: false, featured: true },
  },
  timeline: {
    label: "时间线",
    icon: ListTree,
    component: ArchiveTimeline,
    capabilities: { columns: false, masonryColumns: false, alternating: true, featured: false },
  },
  masonry: {
    label: "瀑布流",
    icon: Columns3,
    component: ArchiveMasonry,
    capabilities: { columns: false, masonryColumns: true, alternating: false, featured: false },
  },
  thread: {
    label: "交错对话",
    icon: MessageCircle,
    component: ArchiveThread,
    capabilities: { columns: false, masonryColumns: false, alternating: false, featured: false },
  },
};
