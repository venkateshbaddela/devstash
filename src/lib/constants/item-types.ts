import React from "react";
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link as LinkIcon,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import type { CreationItemType } from "@/lib/validations/items";

export interface ItemTypeConfig {
  name: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  description: string;
  contentPlaceholder: string;
}

export const TYPE_CONFIG: Record<CreationItemType, ItemTypeConfig> = {
  snippet: {
    name: "Snippet",
    icon: Code,
    color: "#3b82f6",
    description: "Source code snippets with language syntax",
    contentPlaceholder: "// Paste your code snippet here...",
  },
  prompt: {
    name: "Prompt",
    icon: Sparkles,
    color: "#8b5cf6",
    description: "LLM prompts, system instructions, or templates",
    contentPlaceholder: "Enter your AI prompt or system instructions...",
  },
  command: {
    name: "Command",
    icon: Terminal,
    color: "#f97316",
    description: "Terminal commands, shell one-liners, or scripts",
    contentPlaceholder: "docker run -d -p 3000:3000 --name my-app...",
  },
  note: {
    name: "Note",
    icon: StickyNote,
    color: "#fde047",
    description: "Quick notes, thoughts, or documentation",
    contentPlaceholder: "Write your thoughts, ideas, or markdown notes...",
  },
  link: {
    name: "Link",
    icon: LinkIcon,
    color: "#10b981",
    description: "Bookmarks, references, or documentation links",
    contentPlaceholder: "",
  },
  file: {
    name: "File",
    icon: FileText,
    color: "#6b7280",
    description: "Documents, configuration files, and data attachments",
    contentPlaceholder: "",
  },
  image: {
    name: "Image",
    icon: ImageIcon,
    color: "#ec4899",
    description: "Screenshots, architecture diagrams, and image references",
    contentPlaceholder: "",
  },
};
