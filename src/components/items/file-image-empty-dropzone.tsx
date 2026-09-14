"use client";

import React, { useState, useRef, useCallback } from "react";
import { Plus, UploadCloud, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemTypeIcon } from "@/lib/icons";
import { CreateItemDialog } from "@/components/items/create-item-dialog";
import {
  IMAGE_CONSTRAINTS,
  FILE_CONSTRAINTS,
  validateFileConstraints,
} from "@/lib/file-constraints";
import { cn } from "cn";
import type { ItemDetail } from "@/lib/db/items";

export interface FileImageEmptyDropzoneProps {
  type: "file" | "image";
  displayName: string;
  singularName: string;
  icon: string;
  color: string;
  className?: string;
  onSuccess?: (item: ItemDetail) => void;
}

export function FileImageEmptyDropzone({
  type,
  displayName,
  singularName,
  icon,
  color,
  className,
  onSuccess,
}: FileImageEmptyDropzoneProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dragCounterRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isImage = type === "image";
  const constraints = isImage ? IMAGE_CONSTRAINTS : FILE_CONSTRAINTS;

  const acceptString = isImage
    ? IMAGE_CONSTRAINTS.allowedExtensions.join(",") +
      "," +
      IMAGE_CONSTRAINTS.allowedMimeTypes.join(",")
    : FILE_CONSTRAINTS.allowedExtensions.join(",") +
      "," +
      FILE_CONSTRAINTS.allowedMimeTypes.join(",");

  const handleStageFile = useCallback(
    (file: File) => {
      setErrorMessage(null);
      const validation = validateFileConstraints(
        { name: file.name, size: file.size, type: file.type },
        type
      );

      if (!validation.valid) {
        setErrorMessage(validation.error || `Invalid ${type} file.`);
        return;
      }

      setStagedFile(file);
      setIsOpen(true);
    },
    [type]
  );

  const handleBoxClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleStageFile(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleStageFile(files[0]);
    }
  };

  const handleOpenManualDialog = () => {
    setErrorMessage(null);
    setStagedFile(null);
    setIsOpen(true);
  };

  const handleDialogClose = (nextOpen: boolean) => {
    setIsOpen(nextOpen);
    if (!nextOpen) {
      setStagedFile(null);
    }
  };

  return (
    <>
      <div
        onClick={handleBoxClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-label={`Upload or create ${singularName}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center p-10 sm:p-12 text-center rounded-xl border-2 border-dashed transition-all duration-200 select-none gap-4 overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          isDragging
            ? "border-primary bg-primary/5 scale-[0.995] ring-2 ring-primary/20"
            : "border-border/80 bg-muted/10 hover:bg-muted/20 hover:border-border dark:bg-zinc-950/30 dark:hover:bg-zinc-900/40",
          className
        )}
        style={
          isDragging
            ? {
                borderColor: color,
                backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)`,
              }
            : undefined
        }
      >
        {/* Hidden File Input for Native File Manager */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptString}
          onChange={handleFileInputChange}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />

        {/* Type Icon */}
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-xl border transition-all duration-200",
            isDragging && "scale-110 shadow-lg"
          )}
          style={{
            backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
            borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
          }}
        >
          {isDragging ? (
            <UploadCloud className="size-6" style={{ color }} />
          ) : (
            <ItemTypeIcon
              name={icon}
              className="size-6"
              style={{ color }}
            />
          )}
        </div>

        {/* Title & Guidance */}
        <div className="space-y-1 max-w-md">
          <p className="font-semibold text-foreground text-base sm:text-lg">
            {isDragging
              ? `Drop your ${singularName.toLowerCase()} to upload`
              : `No ${displayName.toLowerCase()} found yet`}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            <span className="text-foreground font-medium underline underline-offset-2 hover:text-primary transition-colors">
              Click to browse
            </span>{" "}
            or drag and drop your {singularName.toLowerCase()} here, or create one manually.
          </p>
        </div>

        {/* Single Primary Action Button */}
        <Button
          type="button"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenManualDialog();
          }}
          className="cursor-pointer shadow-xs gap-1.5 font-medium bg-foreground text-background hover:bg-foreground/90 h-9 px-4 text-xs"
        >
          <Plus className="size-3.5" />
          <span>Create your first {singularName}</span>
        </Button>

        {/* File Constraints Info */}
        <p className="text-[11px] text-muted-foreground/80">
          {isImage
            ? `Supports PNG, JPG, GIF, WebP, SVG up to ${constraints.maxSizeLabel}`
            : `Supports PDF, TXT, MD, JSON, YAML, CSV up to ${constraints.maxSizeLabel}`}
        </p>

        {/* Validation Error Alert */}
        {errorMessage && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 max-w-md w-full p-2.5 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs animate-in fade-in slide-in-from-top-1"
          >
            <AlertCircle className="size-4 shrink-0" />
            <span className="flex-1 text-left">{errorMessage}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setErrorMessage(null);
              }}
              className="p-1 hover:opacity-80 cursor-pointer"
              title="Dismiss error"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      <CreateItemDialog
        open={isOpen}
        onOpenChange={handleDialogClose}
        defaultType={type}
        initialFile={stagedFile}
        onSuccess={onSuccess}
      />
    </>
  );
}
