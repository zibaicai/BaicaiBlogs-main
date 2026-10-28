"use client";

import {
  Bot,
  Check,
  Clock3,
  Cpu,
  ImagePlus,
  Link2,
  MessageSquareText,
  Save,
  Send,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Tag,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

/** Central icon registry for the admin app. Change this map to switch families. */
export const ADMIN_ICONS = {
  bot: Bot,
  check: Check,
  clock: Clock3,
  close: X,
  cpu: Cpu,
  image: ImagePlus,
  link: Link2,
  message: MessageSquareText,
  save: Save,
  send: Send,
  sliders: SlidersHorizontal,
  smile: Smile,
  sparkles: Sparkles,
  tag: Tag,
  trash: Trash2,
  upload: UploadCloud,
} satisfies Record<string, ComponentType<SVGProps<SVGSVGElement>>>;

export type AdminIconName = keyof typeof ADMIN_ICONS;

export function AppIcon({
  name,
  size = 16,
  strokeWidth = 2,
  ...props
}: { name: AdminIconName; size?: number } & Omit<SVGProps<SVGSVGElement>, "name">) {
  const Glyph = ADMIN_ICONS[name];
  return <Glyph width={size} height={size} strokeWidth={strokeWidth} {...props} />;
}
