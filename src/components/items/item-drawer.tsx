"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  Pin,
  Copy,
  Check,
  Pencil,
  Trash2,
  Tag,
  Folder,
  Calendar,
  ExternalLink,
  FileText,
  AlertCircle,
  RefreshCw,
  Loader2,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ItemTypeIcon } from "@/lib/icons";
import { useItemDrawer } from "@/components/items/item-drawer-context";
import { updateItemAction } from "@/actions/items";
import { cn } from "cn";

export function ItemDrawer() {
  const {
    isOpen,
    isLoading,
    item,
    previewItem,
    error,
    closeDrawer,
    toggleFavorite,
    togglePin,
    openItem,
    setItemDetail,
  } = useItemDrawer();

  const router = useRouter();

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states for edit mode
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("");
  const [url, setUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  // Toast notification state
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Active display data: prefer full item, fallback to previewItem during initial loading
  const displayTitle = item?.title ?? previewItem?.title ?? "";
  const displayDescription = item?.description ?? previewItem?.description ?? null;
  const displayType = item?.type ?? previewItem?.type ?? "snippet";
  const displayTypeDisplayName =
    item?.typeDisplayName ??
    (displayType.charAt(0).toUpperCase() + displayType.slice(1));
  const displayTypeIcon = item?.typeIcon ?? previewItem?.typeIcon ?? displayType;
  const displayTypeColor =
    item?.typeColor ?? previewItem?.typeColor ?? "#3b82f6";
  const isFavorite = item ? item.isFavorite : previewItem?.isFavorite ?? false;
  const isPinned = item ? item.isPinned : previewItem?.isPinned ?? false;
  const displayTags = item?.tags ?? previewItem?.tags ?? [];
  const displayId = item?.id ?? previewItem?.id ?? "";
  const displayLanguage = item?.language ?? previewItem?.language ?? null;
  const activeLanguage = isEditing ? (language.trim() || null) : displayLanguage;

  const lowerType = displayType.toLowerCase();
  const showContentField = ["snippet", "prompt", "command", "note"].includes(lowerType);
  const showLanguageField = ["snippet", "command"].includes(lowerType);
  const showUrlField = ["link"].includes(lowerType);

  const showToast = (type: "success" | "error", message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ type, message });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const [prevDisplayId, setPrevDisplayId] = useState(displayId);
  if (displayId !== prevDisplayId) {
    setPrevDisplayId(displayId);
    setIsEditing(false);
    setToast(null);
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsEditing(false);
      setToast(null);
      closeDrawer();
    }
  };

  const enterEditMode = () => {
    if (!item) return;
    setTitle(item.title || "");
    setDescription(item.description || "");
    setContent(item.content || "");
    setLanguage(item.language || "");
    setUrl(item.url || "");
    setTagsInput(item.tags && item.tags.length > 0 ? item.tags.join(", ") : "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (item) {
      setTitle(item.title || "");
      setDescription(item.description || "");
      setContent(item.content || "");
      setLanguage(item.language || "");
      setUrl(item.url || "");
      setTagsInput(item.tags && item.tags.length > 0 ? item.tags.join(", ") : "");
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isSaving || !displayId) return;

    setIsSaving(true);
    try {
      const parsedTags = Array.from(
        new Set(
          tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
        )
      );

      const res = await updateItemAction(displayId, {
        title: trimmedTitle,
        description: description.trim() || null,
        content: showContentField ? content : (item?.content ?? null),
        language: showLanguageField ? (language.trim() || null) : (item?.language ?? null),
        url: showUrlField ? (url.trim() || null) : (item?.url ?? null),
        tags: parsedTags,
      });

      if (res.success && res.data) {
        setItemDetail(res.data);
        setIsEditing(false);
        showToast("success", res.message || "Item updated successfully.");
        router.refresh();
      } else {
        showToast("error", res.error || "Failed to update item.");
      }
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    const textToCopy = item?.content ?? item?.url ?? previewItem?.content ?? "";
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const handleRetry = () => {
    if (displayId) {
      openItem(displayId, previewItem ?? undefined);
    }
  };

  const activeHeaderTitle = isEditing
    ? (title || "Untitled Item")
    : (displayTitle || "Item Details");

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "w-full sm:max-w-xl md:max-w-2xl data-[side=right]:w-full data-[side=right]:sm:max-w-xl data-[side=right]:md:max-w-2xl",
          "p-0 gap-0 overflow-hidden bg-card text-foreground border-l border-border flex flex-col h-full"
        )}
      >
        {/* Accessible Dialog Header */}
        <SheetHeader className="p-5 sm:p-6 pb-4 border-b border-border/60 shrink-0">
          <div className="flex items-start gap-3.5 pr-8">
            {/* Type Icon Container */}
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted/40 shrink-0 mt-0.5">
              <ItemTypeIcon
                name={displayTypeIcon}
                className="size-5"
                style={{ color: displayTypeColor }}
              />
            </div>

            {/* Title & Badges */}
            <div className="flex-1 min-w-0 space-y-1.5">
              {isLoading && !displayTitle ? (
                <div className="h-6 w-3/4 bg-muted/60 animate-pulse rounded" />
              ) : (
                <SheetTitle className="text-lg sm:text-xl font-semibold tracking-tight text-foreground truncate">
                  {activeHeaderTitle}
                </SheetTitle>
              )}

              <SheetDescription className="sr-only">
                {displayDescription || `Item detail view for ${displayTitle}`}
              </SheetDescription>

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {isLoading && !displayType ? (
                  <div className="h-4.5 w-16 bg-muted/60 animate-pulse rounded" />
                ) : (
                  <Badge
                    variant="secondary"
                    className="h-5 px-2 text-[11px] font-medium rounded-md border transition-colors"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${displayTypeColor} 12%, transparent)`,
                      borderColor: `color-mix(in srgb, ${displayTypeColor} 30%, transparent)`,
                      color: displayTypeColor,
                    }}
                  >
                    {displayTypeDisplayName}
                  </Badge>
                )}

                {activeLanguage && (
                  <Badge
                    variant="outline"
                    className="h-5 px-2 text-[11px] font-mono font-medium rounded-md border border-border/70 text-muted-foreground bg-muted/40"
                  >
                    {activeLanguage}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Action Bar */}
        {isEditing ? (
          <div className="flex items-center justify-between px-5 sm:px-6 py-2 border-b border-border/60 bg-muted/20 text-xs shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Pencil className="size-3.5 text-primary" />
              <span>Editing item</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
                className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleSave()}
                disabled={!title.trim() || isSaving}
                className="h-8 px-3 text-xs gap-1.5 font-medium shadow-xs"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="size-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-5 sm:px-6 py-2 border-b border-border/60 bg-muted/20 text-xs shrink-0">
            {/* Left Action Buttons: Favorite, Pin, Copy */}
            <div className="flex items-center gap-1">
              {/* Favorite Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFavorite}
                className={cn(
                  "h-8 px-2.5 gap-1.5 text-xs font-medium transition-colors",
                  isFavorite
                    ? "text-amber-400 hover:text-amber-300"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Star
                  className={cn(
                    "size-3.5",
                    isFavorite
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground"
                  )}
                />
                <span>Favorite</span>
              </Button>

              {/* Pin Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePin}
                className={cn(
                  "h-8 px-2.5 gap-1.5 text-xs font-medium transition-colors",
                  isPinned
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Pin
                  className={cn(
                    "size-3.5 rotate-45",
                    isPinned
                      ? "fill-muted-foreground text-foreground"
                      : "text-muted-foreground"
                  )}
                />
                <span>Pin</span>
              </Button>

              {/* Copy Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                disabled={isLoading || (!item?.content && !item?.url && !previewItem?.content)}
                className="h-8 px-2.5 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>

            {/* Right Action Buttons: Edit, Delete */}
            <div className="flex items-center gap-1">
              {/* Edit Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={enterEditMode}
                disabled={isLoading || !item}
                className="h-8 px-2.5 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              >
                <Pencil className="size-3.5" />
                <span>Edit</span>
              </Button>

              {/* Delete Button */}
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors"
                aria-label="Delete item"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className={cn(
              "mx-5 sm:mx-6 mt-3 px-3.5 py-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2 shrink-0",
              toast.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              {toast.type === "success" ? (
                <Check className="size-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="size-4 text-destructive shrink-0" />
              )}
              <span className="truncate font-medium">{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="p-1 rounded hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Global Error Message from Loading */}
          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-xs sm:text-sm text-destructive flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="size-4 shrink-0" />
                <span className="truncate">{error}</span>
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={handleRetry}
                className="shrink-0 gap-1 border-destructive/30 text-destructive hover:bg-destructive/20"
              >
                <RefreshCw className="size-3" />
                <span>Retry</span>
              </Button>
            </div>
          )}

          {isEditing ? (
            /* ================= EDIT MODE FORM ================= */
            <form onSubmit={handleSave} className="space-y-5">
              {/* Title (Required) */}
              <div className="space-y-1.5">
                <label
                  htmlFor="edit-item-title"
                  className="text-xs font-semibold text-foreground flex items-center justify-between"
                >
                  <span>
                    Title <span className="text-destructive">*</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    Required
                  </span>
                </label>
                <Input
                  id="edit-item-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter item title..."
                  disabled={isSaving}
                  required
                  className="h-9 text-sm"
                  autoFocus
                />
                {!title.trim() && (
                  <p className="text-[11px] text-destructive">
                    Title cannot be empty.
                  </p>
                )}
              </div>

              {/* Description (Optional) */}
              <div className="space-y-1.5">
                <label
                  htmlFor="edit-item-description"
                  className="text-xs font-semibold text-foreground flex items-center justify-between"
                >
                  <span>Description</span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    Optional
                  </span>
                </label>
                <textarea
                  id="edit-item-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a brief description..."
                  disabled={isSaving}
                  rows={3}
                  className="w-full min-h-[72px] rounded-lg border border-input bg-muted/20 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 outline-none resize-y transition-colors disabled:opacity-50"
                />
              </div>

              {/* Language (for Snippet & Command) */}
              {showLanguageField && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="edit-item-language"
                    className="text-xs font-semibold text-foreground flex items-center justify-between"
                  >
                    <span>Language</span>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      e.g. typescript, bash, python
                    </span>
                  </label>
                  <Input
                    id="edit-item-language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="e.g. typescript, python, bash..."
                    disabled={isSaving}
                    className="h-9 text-sm"
                  />
                </div>
              )}

              {/* Content (for Snippet, Prompt, Command, Note) */}
              {showContentField && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="edit-item-content"
                    className="text-xs font-semibold text-foreground flex items-center justify-between"
                  >
                    <span>Content</span>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      {lowerType === "snippet" || lowerType === "command"
                        ? "Code / Script"
                        : "Text"}
                    </span>
                  </label>
                  <textarea
                    id="edit-item-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={
                      lowerType === "snippet"
                        ? "Paste code snippet here..."
                        : lowerType === "command"
                        ? "Enter terminal command..."
                        : "Enter content here..."
                    }
                    disabled={isSaving}
                    rows={7}
                    className={cn(
                      "w-full min-h-[140px] rounded-xl border border-input p-3 text-xs outline-none resize-y transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50",
                      lowerType === "snippet" || lowerType === "command"
                        ? "bg-zinc-950/90 font-mono text-zinc-200 placeholder:text-zinc-500"
                        : "bg-muted/20 text-foreground placeholder:text-muted-foreground text-sm"
                    )}
                  />
                </div>
              )}

              {/* URL (for Link) */}
              {showUrlField && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="edit-item-url"
                    className="text-xs font-semibold text-foreground flex items-center justify-between"
                  >
                    <span>URL</span>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      Link destination
                    </span>
                  </label>
                  <Input
                    id="edit-item-url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    disabled={isSaving}
                    className="h-9 text-sm"
                  />
                </div>
              )}

              {/* Tags (Comma-separated text input) */}
              <div className="space-y-1.5">
                <label
                  htmlFor="edit-item-tags"
                  className="text-xs font-semibold text-foreground flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Tag className="size-3.5 text-muted-foreground" />
                    <span>Tags</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    Comma-separated
                  </span>
                </label>
                <Input
                  id="edit-item-tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="react, typescript, ui"
                  disabled={isSaving}
                  className="h-9 text-sm font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Separate tags with commas. Tags will be updated on save.
                </p>
              </div>

              {/* Non-Editable Collections */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Folder className="size-3.5" />
                    <span>Collections</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground italic">
                    Read-only
                  </span>
                </div>
                {item?.collections && item.collections.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 opacity-80">
                    {item.collections.map((col) => (
                      <span
                        key={col.id}
                        className="px-2.5 py-1 rounded-md text-xs bg-muted/40 border border-border/60 text-foreground flex items-center gap-1.5"
                      >
                        {col.color && (
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: col.color }}
                          />
                        )}
                        <span>{col.name}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Not in any collections
                  </p>
                )}
              </div>

              {/* Non-Editable Details */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span>Details</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground italic">
                    Read-only
                  </span>
                </div>
                <div className="space-y-2 text-xs sm:text-sm opacity-80">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Created</span>
                    <span className="text-foreground font-medium">
                      {item?.formattedCreatedAt || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Updated</span>
                    <span className="text-foreground font-medium">
                      {item?.formattedUpdatedAt || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* ================= VIEW MODE ================= */
            <>
              {/* Description */}
              {displayDescription ? (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Description
                  </h3>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {displayDescription}
                  </p>
                </div>
              ) : isLoading && !item ? (
                <div className="space-y-1.5">
                  <div className="h-3 w-20 bg-muted/60 animate-pulse rounded" />
                  <div className="h-4 w-full bg-muted/40 animate-pulse rounded" />
                </div>
              ) : null}

              {/* Content Section */}
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground">
                  Content
                </h3>

                {isLoading && !item ? (
                  <div className="rounded-xl border border-border/60 bg-zinc-950/80 p-4 space-y-2.5 animate-pulse">
                    <div className="h-3.5 w-3/4 bg-zinc-800 rounded" />
                    <div className="h-3.5 w-1/2 bg-zinc-800 rounded" />
                    <div className="h-3.5 w-5/6 bg-zinc-800 rounded" />
                    <div className="h-3.5 w-2/3 bg-zinc-800 rounded" />
                    <div className="h-3.5 w-1/3 bg-zinc-800 rounded" />
                  </div>
                ) : item?.content ? (
                  <div className="rounded-xl border border-border/60 bg-zinc-950/90 p-3.5 sm:p-4 font-mono text-xs overflow-x-auto">
                    <table className="w-full border-collapse">
                      <tbody>
                        {item.content.split("\n").map((line, idx) => (
                          <tr key={idx} className="leading-relaxed group/line">
                            <td className="w-8 select-none pr-3 sm:pr-4 text-right text-zinc-500/60 align-top tabular-nums text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="whitespace-pre text-zinc-200 font-mono align-top text-xs">
                              {line || " "}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : item?.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/50 transition-colors text-xs sm:text-sm text-foreground group"
                  >
                    <ExternalLink className="size-4 text-primary shrink-0 group-hover:scale-105 transition-transform" />
                    <span className="truncate text-primary hover:underline">
                      {item.url}
                    </span>
                  </a>
                ) : item?.fileName ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/30 text-xs sm:text-sm">
                    <FileText className="size-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">
                        {item.fileName}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {item.fileSize ? `${(item.fileSize / 1024).toFixed(1)} KB` : "File"}{" "}
                        {item.mimeType ? `• ${item.mimeType}` : ""}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
                    No content saved for this item.
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Tag className="size-3.5" />
                  <span>Tags</span>
                </div>

                {displayTags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {displayTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-md text-xs bg-muted/40 border border-border/60 text-foreground font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No tags</p>
                )}
              </div>

              {/* Collections */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Folder className="size-3.5" />
                  <span>Collections</span>
                </div>

                {isLoading && !item ? (
                  <div className="h-6 w-28 bg-muted/40 animate-pulse rounded-md" />
                ) : item?.collections && item.collections.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {item.collections.map((col) => (
                      <span
                        key={col.id}
                        className="px-2.5 py-1 rounded-md text-xs bg-muted/40 border border-border/60 text-foreground flex items-center gap-1.5"
                      >
                        {col.color && (
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: col.color }}
                          />
                        )}
                        <span>{col.name}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Not in any collections
                  </p>
                )}
              </div>

              {/* Details */}
              <div className="space-y-2.5 pt-2 border-t border-border/60">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Calendar className="size-3.5" />
                  <span>Details</span>
                </div>

                {isLoading && !item ? (
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted/40 animate-pulse rounded" />
                    <div className="h-4 w-full bg-muted/40 animate-pulse rounded" />
                  </div>
                ) : (
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Created</span>
                      <span className="text-foreground font-medium">
                        {item?.formattedCreatedAt || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Updated</span>
                      <span className="text-foreground font-medium">
                        {item?.formattedUpdatedAt || "—"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
