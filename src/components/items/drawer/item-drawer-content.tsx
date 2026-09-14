"use client";

import React from "react";
import {
  Tag,
  Folder,
  Calendar,
  ExternalLink,
  Download,
  Maximize2,
  FileSpreadsheet,
  FileCode,
  FileText,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { isMarkdownItemType, isCodeItemType } from "@/lib/markdown";
import { formatFileSize, getFileExtension } from "@/lib/file-constraints";
import type { ItemDetail } from "@/lib/db/items";
import { cn } from "cn";

export interface ItemDrawerContentProps {
  item: ItemDetail | null;
  isLoading: boolean;
  displayDescription: string | null;
  displayTags: string[];
  lowerType: string;
  displayId?: string;
  onOpenImageModal: () => void;
}

export function ItemDrawerContent({
  item,
  isLoading,
  displayDescription,
  displayTags,
  lowerType,
  onOpenImageModal,
}: ItemDrawerContentProps) {
  return (
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
          isCodeItemType(lowerType) ? (
            <CodeEditor
              value={item.content}
              language={item.language}
              readOnly={true}
              minHeight={70}
              maxHeight={400}
            />
          ) : isMarkdownItemType(lowerType) ? (
            <MarkdownEditor
              value={item.content}
              readOnly={true}
              minHeight={70}
              maxHeight={400}
            />
          ) : (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 font-mono text-xs whitespace-pre-wrap text-foreground leading-relaxed">
              {item.content}
            </div>
          )
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
        ) : (lowerType === "image" || item?.mimeType?.startsWith("image/")) && (item?.fileUrl || item?.storageKey) ? (() => {
          const isSvg =
            Boolean(item.fileName && item.fileName.toLowerCase().endsWith(".svg")) ||
            Boolean(item.mimeType && item.mimeType.toLowerCase().includes("svg")) ||
            Boolean(item.fileUrl && item.fileUrl.toLowerCase().includes(".svg")) ||
            Boolean(item.storageKey && item.storageKey.toLowerCase().endsWith(".svg"));

          const previewParam = isSvg ? "preview=true" : "inline=true";

          const imageSrc = item.fileUrl
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
            <div className="space-y-3 rounded-xl border border-border/80 bg-zinc-950/80 p-3.5 sm:p-4 overflow-hidden">
              {/* Image Preview Canvas - Click to open full image modal */}
              <div
                role="button"
                tabIndex={0}
                onClick={onOpenImageModal}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpenImageModal();
                  }
                }}
                className="group/img relative rounded-lg overflow-hidden border border-border/60 bg-zinc-900/90 flex items-center justify-center min-h-[180px] max-h-[420px] cursor-zoom-in transition-all hover:border-border select-none"
                title="Click to view full image"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt={item.title || item.fileName || "Image preview"}
                  className="max-h-[420px] w-auto max-w-full object-contain transition-transform duration-200 group-hover/img:scale-[1.01]"
                  loading="lazy"
                />

                {/* Hover Overlay with Expand Icon */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-xs border border-white/20 text-white text-xs font-medium shadow-lg">
                    <Maximize2 className="size-3.5" />
                    <span>Click to expand</span>
                  </div>
                </div>
              </div>

              {/* Metadata & Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                    {item.fileName || item.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatFileSize(item.fileSize)}
                    {item.mimeType ? ` • ${item.mimeType}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onOpenImageModal}
                    className="h-8 px-3 gap-1.5 text-xs font-medium cursor-pointer"
                  >
                    <Maximize2 className="size-3.5" />
                    <span>View Full</span>
                  </Button>

                  <a
                    href={downloadUrl}
                    download={item.fileName || "image"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-8 px-3 gap-1.5 text-xs font-medium shrink-0 cursor-pointer"
                    )}
                  >
                    <Download className="size-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })() : item?.fileName ? (
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border/80 bg-muted/30 text-xs sm:text-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-muted/60 border border-border/60 shrink-0">
                {(() => {
                  const ext = getFileExtension(item.fileName || "");
                  if ([".csv", ".xml"].includes(ext)) {
                    return (
                      <FileSpreadsheet className="size-5 text-emerald-500 shrink-0" />
                    );
                  }
                  if (
                    [".json", ".yaml", ".yml", ".toml", ".ini"].includes(
                      ext
                    )
                  ) {
                    return (
                      <FileCode className="size-5 text-amber-500 shrink-0" />
                    );
                  }
                  return (
                    <FileText className="size-5 text-blue-400 shrink-0" />
                  );
                })()}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">
                  {item.fileName}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {formatFileSize(item.fileSize)}
                  {item.mimeType ? ` • ${item.mimeType}` : ""}
                </p>
              </div>
            </div>

            <a
              href={
                item.fileUrl ||
                `/api/files/download?key=${encodeURIComponent(
                  item.storageKey || ""
                )}&filename=${encodeURIComponent(
                  item.fileName || "download"
                )}`
              }
              download={item.fileName || "download"}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-8 px-3 gap-1.5 text-xs font-medium shrink-0 cursor-pointer"
              )}
            >
              <Download className="size-3.5" />
              <span>Download</span>
            </a>
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
  );
}
