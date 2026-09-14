"use client";

import React from "react";
import { Download, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { formatFileSize } from "@/lib/file-constraints";
import type { ItemDetail } from "@/lib/db/items";
import { cn } from "cn";

export interface ItemDrawerImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemDetail | null;
}

export function ItemDrawerImageModal({
  isOpen,
  onClose,
  item,
}: ItemDrawerImageModalProps) {
  if (!item || (!item.fileUrl && !item.storageKey)) {
    return null;
  }

  const isSvg =
    Boolean(item.fileName && item.fileName.toLowerCase().endsWith(".svg")) ||
    Boolean(item.mimeType && item.mimeType.toLowerCase().includes("svg")) ||
    Boolean(item.fileUrl && item.fileUrl.toLowerCase().includes(".svg")) ||
    Boolean(item.storageKey && item.storageKey.toLowerCase().endsWith(".svg"));

  const previewParam = isSvg ? "preview=true" : "inline=true";

  const modalSrc = item.fileUrl
    ? item.fileUrl.includes("?")
      ? `${item.fileUrl}&${previewParam}`
      : `${item.fileUrl}?${previewParam}`
    : `/api/files/download?key=${encodeURIComponent(
        item.storageKey || ""
      )}&filename=${encodeURIComponent(
        item.fileName || "image"
      )}&${previewParam}`;

  const downloadUrl =
    item.fileUrl ||
    `/api/files/download?key=${encodeURIComponent(
      item.storageKey || ""
    )}&filename=${encodeURIComponent(
      item.fileName || "image"
    )}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-[95vw] sm:w-[90vw] md:max-w-5xl max-h-[92vh] p-0 overflow-hidden border-border/80 bg-zinc-950/95 backdrop-blur-xl shadow-2xl flex flex-col gap-0 z-[60]"
        showCloseButton={true}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border/60 bg-zinc-900/60 shrink-0">
          <div className="min-w-0 pr-8">
            <DialogTitle className="text-sm sm:text-base font-semibold text-foreground truncate">
              {item.title || item.fileName || "Image"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5 truncate">
              {item.fileName ? `${item.fileName} • ` : ""}
              {formatFileSize(item.fileSize)}
              {item.mimeType ? ` • ${item.mimeType}` : ""}
            </DialogDescription>
          </div>
        </div>

        {/* Centered Image Canvas */}
        <div className="flex-1 min-h-0 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/80 overflow-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={modalSrc}
            alt={item.title || item.fileName || "Full image"}
            className="max-h-[72vh] w-auto max-w-full object-contain rounded-md shadow-lg select-none"
          />
        </div>

        {/* Modal Footer with Actions */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-t border-border/60 bg-zinc-900/60 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted/60 text-[10px] font-mono border border-border/60">Esc</kbd> or click outside to close
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <a
              href={downloadUrl}
              download={item.fileName || "image"}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-8 px-3 gap-1.5 text-xs font-medium cursor-pointer"
              )}
            >
              <Download className="size-3.5" />
              <span>Download</span>
            </a>
            <a
              href={modalSrc}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }),
                "h-8 px-3 gap-1.5 text-xs font-medium cursor-pointer"
              )}
            >
              <ExternalLink className="size-3.5" />
              <span>Open in New Tab</span>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
