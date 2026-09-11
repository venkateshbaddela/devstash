import * as React from "react";
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
  type LucideIcon,
} from "lucide-react";

export const ITEM_TYPE_ICONS: Record<string, LucideIcon> = {
  // Lucide icon name keys
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image: ImageIcon,
  Link: LinkIcon,

  // Lowercase system type name keys
  snippet: Code,
  prompt: Sparkles,
  command: Terminal,
  note: StickyNote,
  file: File,
  image: ImageIcon,
  link: LinkIcon,

  // Plural type name keys
  snippets: Code,
  prompts: Sparkles,
  commands: Terminal,
  notes: StickyNote,
  files: File,
  images: ImageIcon,
  links: LinkIcon,
};

// Backwards compatibility alias
export const ICON_MAP = ITEM_TYPE_ICONS;

/**
 * Returns the corresponding LucideIcon component for a given item type name or icon string.
 * Defaults to `Code` if no match is found. Safe to use in both Server and Client Components.
 */
export function getItemTypeIcon(iconOrName?: string | null): LucideIcon {
  if (!iconOrName) return Code;
  return (
    ITEM_TYPE_ICONS[iconOrName] ||
    ITEM_TYPE_ICONS[iconOrName.toLowerCase()] ||
    Code
  );
}

export interface ItemTypeIconProps {
  name?: string | null;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Static component to render an item type icon safely in Server and Client components
 * without triggering React Compiler's static-components lint rule.
 */
export function ItemTypeIcon({ name, className, style }: ItemTypeIconProps) {
  const icon = getItemTypeIcon(name);
  return React.createElement(icon, { className, style });
}
