"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Link2,
  Music2,
  Palette,
  Pause,
  Play,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

/**
 * Central icon registry.
 *
 * To switch to another icon family later, change only the imports and entries
 * in this map. Feature components should use <AppIcon name="..." /> instead of
 * importing individual icons directly.
 */
export const ICONS = {
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  check: Check,
  chevronDown: ChevronDown,
  close: X,
  eye: Eye,
  eyeOff: EyeOff,
  image: ImageIcon,
  link: Link2,
  music: Music2,
  palette: Palette,
  pause: Pause,
  play: Play,
  plus: Plus,
  search: Search,
  settings: Settings2,
  sparkles: Sparkles,
  trash: Trash2,
  upload: Upload,
} satisfies Record<string, ComponentType<SVGProps<SVGSVGElement>>>;

export type AppIconName = keyof typeof ICONS;

interface AppIconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: AppIconName;
  size?: number;
}

export function AppIcon({ name, size = 16, strokeWidth = 2, ...props }: AppIconProps) {
  const Glyph = ICONS[name];
  return <Glyph width={size} height={size} strokeWidth={strokeWidth} {...props} />;
}
