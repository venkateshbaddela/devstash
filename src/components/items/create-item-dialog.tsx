"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link as LinkIcon,
  Loader2,
  AlertCircle,
  Plus,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createItemAction } from "@/actions/items";
import { useOptionalItemDrawer } from "@/components/items/item-drawer-context";
import {
  CreationItemType,
  CREATION_ITEM_TYPES,
} from "@/lib/validations/items";
import { cn } from "cn";
import { CodeEditor } from "@/components/ui/code-editor";
import type { ItemDetail } from "@/lib/db/items";

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: CreationItemType;
  onSuccess?: (item: ItemDetail) => void;
}

const TYPE_CONFIG: Record<
  CreationItemType,
  {
    name: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    color: string;
    description: string;
    contentPlaceholder: string;
  }
> = {
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
};

export function CreateItemDialog({
  open,
  onOpenChange,
  defaultType = "snippet",
  onSuccess,
}: CreateItemDialogProps) {
  const router = useRouter();
  const drawerContext = useOptionalItemDrawer();

  const [selectedType, setSelectedType] =
    React.useState<CreationItemType>(defaultType);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [content, setContent] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [language, setLanguage] = React.useState("");
  const [tagsInput, setTagsInput] = React.useState("");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const resetForm = React.useCallback(() => {
    setTitle("");
    setDescription("");
    setContent("");
    setUrl("");
    setLanguage("");
    setTagsInput("");
    setError(null);
    setIsSubmitting(false);
  }, []);

  const [prevOpen, setPrevOpen] = React.useState(open);
  const [prevDefaultType, setPrevDefaultType] = React.useState(defaultType);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSelectedType(defaultType);
      resetForm();
    }
  }

  if (defaultType !== prevDefaultType) {
    setPrevDefaultType(defaultType);
    if (open) {
      setSelectedType(defaultType);
    }
  }

  const activeConfig = TYPE_CONFIG[selectedType];
  const isLink = selectedType === "link";
  const isCodeOrCommand = selectedType === "snippet" || selectedType === "command";

  const isFormValid =
    title.trim().length > 0 &&
    (!isLink || (url.trim().length > 0 && (url.startsWith("http://") || url.startsWith("https://"))));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const parsedTags = Array.from(
      new Set(
        tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
      )
    );

    try {
      const res = await createItemAction({
        type: selectedType,
        title: title.trim(),
        description: description.trim() || null,
        content: isLink ? null : (content.trim() || null),
        url: isLink ? url.trim() : null,
        language: isCodeOrCommand ? (language.trim() || null) : null,
        tags: parsedTags,
      });

      if (!res.success || !res.data) {
        setError(res.error || "Failed to create item.");
        setIsSubmitting(false);
        return;
      }

      onOpenChange(false);
      resetForm();

      if (drawerContext?.showToast) {
        drawerContext.showToast("success", res.message || "Item created successfully.");
      }

      onSuccess?.(res.data);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSubmitting) {
          onOpenChange(nextOpen);
          if (!nextOpen) resetForm();
        }
      }}
    >
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border/80 shadow-2xl">
        <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="size-8 rounded-lg flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: `color-mix(in srgb, ${activeConfig.color} 15%, transparent)`,
                borderColor: `color-mix(in srgb, ${activeConfig.color} 35%, transparent)`,
                color: activeConfig.color,
              }}
            >
              <activeConfig.icon
                className="size-4"
                style={{ color: activeConfig.color }}
              />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-semibold text-foreground">
                Create New Item
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {activeConfig.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {/* Type Selector Dropdown */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Item Type
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger
                  type="button"
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-border/70 bg-background/60 dark:bg-input/30 hover:bg-muted/40 transition-colors cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="size-6 rounded-md flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${activeConfig.color} 15%, transparent)`,
                        borderColor: `color-mix(in srgb, ${activeConfig.color} 35%, transparent)`,
                        color: activeConfig.color,
                      }}
                    >
                      <activeConfig.icon
                        className="size-3.5"
                        style={{ color: activeConfig.color }}
                      />
                    </div>
                    <span className="font-semibold text-xs sm:text-sm text-foreground">
                      {activeConfig.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground hidden sm:inline truncate">
                      — {activeConfig.description}
                    </span>
                  </div>
                  <ChevronDown className="size-4 text-muted-foreground shrink-0 ml-1.5" />
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="start"
                  className="w-(--anchor-width) min-w-[280px] max-h-72 overflow-y-auto p-1.5 rounded-lg border border-border/80 bg-popover text-popover-foreground shadow-xl"
                >
                  <DropdownMenuLabel className="px-2 py-1 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                    Select Item Type
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-1 bg-border/60" />

                  {CREATION_ITEM_TYPES.map((typeKey) => {
                    const config = TYPE_CONFIG[typeKey];
                    const Icon = config.icon;
                    const isSelected = selectedType === typeKey;

                    return (
                      <DropdownMenuItem
                        key={typeKey}
                        onClick={() => {
                          setSelectedType(typeKey);
                          setError(null);
                        }}
                        className={cn(
                          "flex items-center justify-between gap-3 p-2 rounded-lg cursor-pointer transition-colors text-xs",
                          isSelected
                            ? "bg-accent text-accent-foreground font-medium"
                            : "hover:bg-muted/50 text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="size-7 rounded-md flex items-center justify-center shrink-0 border"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)`,
                              borderColor: `color-mix(in srgb, ${config.color} 35%, transparent)`,
                              color: config.color,
                            }}
                          >
                            <Icon
                              className="size-3.5"
                              style={{ color: config.color }}
                            />
                          </div>
                          <div className="min-w-0 flex flex-col text-left">
                            <span className="font-semibold text-xs text-foreground">
                              {config.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground line-clamp-1">
                              {config.description}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="size-4 text-primary shrink-0 ml-2" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Title Field (Required) */}
            <div>
              <label
                htmlFor="item-title"
                className="text-xs font-medium text-foreground flex items-center justify-between mb-1.5"
              >
                <span>Title <span className="text-destructive">*</span></span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  {title.length}/255
                </span>
              </label>
              <Input
                id="item-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  selectedType === "link"
                    ? "e.g., Next.js Documentation"
                    : selectedType === "command"
                    ? "e.g., Docker Production Build"
                    : "e.g., useAuth Hook"
                }
                maxLength={255}
                required
                className="h-9 text-xs sm:text-sm bg-background/60 border-border/70 rounded-lg"
                autoFocus
              />
            </div>

            {/* Link URL (Required for link type) */}
            {isLink && (
              <div>
                <label
                  htmlFor="item-url"
                  className="text-xs font-medium text-foreground flex items-center gap-1 mb-1.5"
                >
                  <span>URL</span>
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  id="item-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://nextjs.org/docs"
                  required
                  className="h-9 text-xs sm:text-sm font-mono bg-background/60 border-border/70 rounded-lg"
                />
              </div>
            )}

            {/* Language for Snippet and Command */}
            {isCodeOrCommand && (
              <div>
                <label
                  htmlFor="item-language"
                  className="text-xs font-medium text-foreground block mb-1.5"
                >
                  Language
                </label>
                <Input
                  id="item-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder={
                    selectedType === "command"
                      ? "bash, zsh, sh, powershell"
                      : "typescript, javascript, python, rust, go"
                  }
                  maxLength={50}
                  className="h-9 text-xs sm:text-sm font-mono bg-background/60 border-border/70 rounded-lg"
                />
              </div>
            )}

            {/* Content Field for Non-Link Types */}
            {!isLink && (
              <div>
                <label
                  htmlFor="item-content"
                  className="text-xs font-medium text-foreground block mb-1.5"
                >
                  {selectedType === "command"
                    ? "Command"
                    : selectedType === "prompt"
                    ? "Prompt"
                    : selectedType === "note"
                    ? "Note Content"
                    : "Code Snippet"}
                </label>
                {isCodeOrCommand ? (
                  <CodeEditor
                    value={content}
                    onChange={setContent}
                    language={language}
                    readOnly={false}
                    minHeight={140}
                    maxHeight={400}
                    placeholder={activeConfig.contentPlaceholder}
                  />
                ) : (
                  <textarea
                    id="item-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={activeConfig.contentPlaceholder}
                    rows={5}
                    className="w-full min-h-[140px] rounded-lg border border-border/70 bg-background/60 dark:bg-input/30 p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 resize-y transition-colors"
                  />
                )}
              </div>
            )}

            {/* Description (Optional) */}
            <div>
              <label
                htmlFor="item-description"
                className="text-xs font-medium text-foreground block mb-1.5"
              >
                Description
              </label>
              <textarea
                id="item-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional summary or notes about this item..."
                rows={2}
                maxLength={2000}
                className="w-full min-h-[76px] rounded-lg border border-border/70 bg-background/60 dark:bg-input/30 p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 resize-y transition-colors"
              />
            </div>

            {/* Tags (Optional) */}
            <div>
              <label
                htmlFor="item-tags"
                className="text-xs font-medium text-foreground block mb-1.5"
              >
                Tags
              </label>
              <Input
                id="item-tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="react, auth, hook, utils (comma separated)"
                className="h-9 text-xs sm:text-sm font-mono bg-background/60 border-border/70 rounded-lg"
              />
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <p className="leading-tight">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 sm:p-5 border-t border-border/60 bg-muted/20 shrink-0 gap-2 sm:gap-2">
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  className="text-xs h-8 px-3 cursor-pointer"
                />
              }
            >
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="text-xs h-8 px-3 gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  <span>Create {activeConfig.name}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
