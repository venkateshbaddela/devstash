"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useItemDrawer } from "@/components/items/item-drawer-context";
import { DeleteItemDialog } from "@/components/items/delete-item-dialog";
import { updateItemAction } from "@/actions/items";
import { cn } from "cn";
import {
  ItemDrawerHeader,
  ItemDrawerActions,
  ItemDrawerEditForm,
  ItemDrawerContent,
  ItemDrawerImageModal,
} from "./drawer";

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
    showToast,
  } = useItemDrawer();

  const router = useRouter();

  const [copied, setCopied] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeImageModalId, setActiveImageModalId] = useState<string | null>(null);

  // Form states for edit mode
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("");
  const [url, setUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");

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

  // Derived states: automatically reset when a different item is selected without effects or render-phase mutations
  const isEditing = editingItemId === displayId && !!displayId;
  const isImageModalOpen = activeImageModalId === displayId && !!displayId;
  const activeLanguage = isEditing ? (language.trim() || null) : displayLanguage;

  const lowerType = displayType.toLowerCase();
  const showContentField = ["snippet", "prompt", "command", "note"].includes(lowerType);
  const showLanguageField = ["snippet", "command"].includes(lowerType);
  const showUrlField = ["link"].includes(lowerType);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEditingItemId(null);
      setActiveImageModalId(null);
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
    setEditingItemId(displayId);
  };

  const handleCancel = () => {
    setEditingItemId(null);
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
        setEditingItemId(null);
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
    <>
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent
          side="right"
          className={cn(
            "w-full sm:max-w-xl md:max-w-2xl data-[side=right]:w-full data-[side=right]:sm:max-w-xl data-[side=right]:md:max-w-2xl",
            "p-0 gap-0 overflow-hidden bg-card text-foreground border-l border-border flex flex-col h-full"
          )}
        >
          {/* Accessible Dialog Header */}
          <ItemDrawerHeader
            displayTitle={displayTitle}
            activeHeaderTitle={activeHeaderTitle}
            displayDescription={displayDescription}
            displayTypeIcon={displayTypeIcon}
            displayTypeColor={displayTypeColor}
            displayTypeDisplayName={displayTypeDisplayName}
            activeLanguage={activeLanguage}
            isLoading={isLoading}
            displayType={displayType}
          />

          {/* Action Bar */}
          <ItemDrawerActions
            isEditing={isEditing}
            isSaving={isSaving}
            canSave={Boolean(title.trim())}
            onCancel={handleCancel}
            onSave={handleSave}
            isFavorite={isFavorite}
            isPinned={isPinned}
            copied={copied}
            isLoading={isLoading}
            item={item}
            previewItem={previewItem}
            lowerType={lowerType}
            onToggleFavorite={toggleFavorite}
            onTogglePin={togglePin}
            onCopy={handleCopy}
            onEnterEdit={enterEditMode}
            onOpenDelete={() => setIsDeleteDialogOpen(true)}
          />

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
              <ItemDrawerEditForm
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                content={content}
                setContent={setContent}
                language={language}
                setLanguage={setLanguage}
                url={url}
                setUrl={setUrl}
                tagsInput={tagsInput}
                setTagsInput={setTagsInput}
                isSaving={isSaving}
                showContentField={showContentField}
                showLanguageField={showLanguageField}
                showUrlField={showUrlField}
                lowerType={lowerType}
                item={item}
                onSave={handleSave}
              />
            ) : (
              <ItemDrawerContent
                item={item}
                isLoading={isLoading}
                displayDescription={displayDescription}
                displayTags={displayTags}
                lowerType={lowerType}
                displayId={displayId}
                onOpenImageModal={() => setActiveImageModalId(displayId)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {displayId && (
        <DeleteItemDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          item={{ id: displayId, title: displayTitle }}
          onSuccess={() => {
            closeDrawer();
            showToast("success", "Item deleted successfully.");
            router.refresh();
          }}
        />
      )}

      {/* Full Image Modal */}
      <ItemDrawerImageModal
        isOpen={isImageModalOpen}
        onClose={() => setActiveImageModalId(null)}
        item={item}
      />
    </>
  );
}
