"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileCode,
  FileSpreadsheet,
} from "lucide-react";
import {
  IMAGE_CONSTRAINTS,
  FILE_CONSTRAINTS,
  validateFileConstraints,
  formatFileSize,
  getFileExtension,
} from "@/lib/file-constraints";
import { cn } from "cn";

export interface UploadedFileData {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  previewUrl?: string;
}

interface FileUploadProps {
  type: "file" | "image";
  value: UploadedFileData | null;
  onChange: (file: UploadedFileData | null) => void;
  disabled?: boolean;
  initialFile?: File | null;
}

export function FileUpload({
  type,
  value,
  onChange,
  disabled = false,
  initialFile = null,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeXhrRef = useRef<XMLHttpRequest | null>(null);
  const handledInitialFileRef = useRef<File | null>(null);

  const isImage = type === "image";
  const constraints = isImage ? IMAGE_CONSTRAINTS : FILE_CONSTRAINTS;

  const acceptString = isImage
    ? IMAGE_CONSTRAINTS.allowedExtensions.join(",") +
      "," +
      IMAGE_CONSTRAINTS.allowedMimeTypes.join(",")
    : FILE_CONSTRAINTS.allowedExtensions.join(",") +
      "," +
      FILE_CONSTRAINTS.allowedMimeTypes.join(",");

  const handleClear = useCallback(() => {
    if (activeXhrRef.current) {
      activeXhrRef.current.abort();
      activeXhrRef.current = null;
    }
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
    handledInitialFileRef.current = null;
    setIsUploading(false);
    setUploadProgress(0);
    setErrorMessage(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [localPreviewUrl, onChange]);

  const uploadFile = useCallback(
    (file: File) => {
      setErrorMessage(null);

      // 1. Client-side pre-validation
      const validation = validateFileConstraints(
        { name: file.name, size: file.size, type: file.type },
        type
      );

      if (!validation.valid) {
        setErrorMessage(validation.error || "Invalid file.");
        return;
      }

      // 2. Image local preview while uploading (only for raster images, never for raw SVGs)
      if (isImage) {
        const isSvg = file.name.toLowerCase().endsWith(".svg") || file.type.includes("svg");
        if (!isSvg) {
          const preview = URL.createObjectURL(file);
          setLocalPreviewUrl(preview);
        }
      }

      // 3. Initiate XMLHttpRequest for progress tracking
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const xhr = new XMLHttpRequest();
      activeXhrRef.current = xhr;
      setIsUploading(true);
      setUploadProgress(0);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        setIsUploading(false);
        activeXhrRef.current = null;

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success) {
              onChange({
                fileUrl: data.fileUrl,
                fileName: data.fileName,
                fileSize: data.fileSize,
                mimeType: data.mimeType,
                storageKey: data.storageKey,
                previewUrl: data.previewUrl,
              });
              setErrorMessage(null);
            } else {
              setErrorMessage(data.error || "Upload failed.");
              if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
              setLocalPreviewUrl(null);
            }
          } catch {
            setErrorMessage("Failed to parse server response.");
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            setErrorMessage(errorData.error || `Upload failed (status ${xhr.status}).`);
          } catch {
            setErrorMessage(`Upload failed with status code ${xhr.status}.`);
          }
          if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
          setLocalPreviewUrl(null);
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        activeXhrRef.current = null;
        setErrorMessage("Network error occurred during file upload.");
        if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
        setLocalPreviewUrl(null);
      };

      xhr.onabort = () => {
        setIsUploading(false);
        activeXhrRef.current = null;
      };

      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    },
    [isImage, type, onChange, localPreviewUrl]
  );

  React.useEffect(() => {
    if (
      initialFile &&
      initialFile !== handledInitialFileRef.current &&
      !value &&
      !isUploading
    ) {
      handledInitialFileRef.current = initialFile;
      uploadFile(initialFile);
    }
  }, [initialFile, value, isUploading, uploadFile]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  // Helper for file icon based on extension
  const renderFileTypeIcon = (filename: string) => {
    const ext = getFileExtension(filename);
    if ([".csv", ".xml"].includes(ext)) {
      return <FileSpreadsheet className="size-6 text-emerald-500 shrink-0" />;
    }
    if ([".json", ".yaml", ".yml", ".toml", ".ini"].includes(ext)) {
      return <FileCode className="size-6 text-amber-500 shrink-0" />;
    }
    return <FileText className="size-6 text-blue-400 shrink-0" />;
  };

  return (
    <div className="space-y-2">
      {/* Uploaded View */}
      {value ? (
        <div className="rounded-xl border border-border/80 bg-background/60 dark:bg-zinc-950/60 p-3.5 sm:p-4 transition-all">
          {isImage ? (
            <div className="space-y-3">
              {/* Image Preview */}
              <div className="relative rounded-lg overflow-hidden border border-border/70 bg-zinc-900 flex items-center justify-center max-h-56">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={localPreviewUrl || value.previewUrl || value.fileUrl}
                  alt={value.fileName}
                  className="max-h-56 w-auto object-contain"
                />
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={disabled}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-zinc-950/80 hover:bg-zinc-900 border border-border/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Info Row */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <div className="flex items-center gap-2 min-w-0">
                  <ImageIcon className="size-4 text-pink-500 shrink-0" />
                  <span className="font-medium text-foreground truncate max-w-[220px]">
                    {value.fileName}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="tabular-nums font-mono">
                    {formatFileSize(value.fileSize)}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-muted/60 text-muted-foreground uppercase font-mono">
                    {value.mimeType.split("/")[1] || "IMAGE"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* File Preview Card */
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-muted/50 border border-border/60 shrink-0">
                  {renderFileTypeIcon(value.fileName)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {value.fileName}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="tabular-nums font-mono">
                      {formatFileSize(value.fileSize)}
                    </span>
                    {value.mimeType && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[140px]">
                          {value.mimeType}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-emerald-500 text-xs flex items-center gap-1 font-medium">
                  <CheckCircle2 className="size-4" />
                  <span className="hidden sm:inline">Uploaded</span>
                </span>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={disabled}
                  className="p-1.5 rounded-md hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : isUploading ? (
        /* Progress Indicator View */
        <div className="rounded-xl border border-dashed border-border/90 bg-muted/20 p-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Uploading to Backblaze B2...</span>
            </div>
            <span className="text-muted-foreground font-mono tabular-nums font-semibold">
              {uploadProgress}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-150 rounded-full",
                isImage ? "bg-pink-500" : "bg-primary"
              )}
              style={{ width: `${uploadProgress}%` }}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
            >
              Cancel upload
            </button>
          </div>
        </div>
      ) : (
        /* Dropzone / Upload Trigger View */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
          className={cn(
            "relative flex flex-col items-center justify-center p-6 rounded-xl border border-dashed text-center cursor-pointer transition-all duration-150 select-none",
            isDragging
              ? isImage
                ? "border-pink-500 bg-pink-500/10 scale-[0.99]"
                : "border-primary bg-primary/10 scale-[0.99]"
              : "border-border/80 hover:border-border hover:bg-muted/30 bg-background/40 dark:bg-zinc-950/40",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptString}
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled}
          />

          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-lg mb-2.5 transition-colors",
              isImage
                ? "bg-pink-500/15 text-pink-500"
                : "bg-muted/60 text-muted-foreground"
            )}
          >
            {isImage ? (
              <ImageIcon className="size-5" />
            ) : (
              <UploadCloud className="size-5" />
            )}
          </div>

          <p className="text-xs sm:text-sm font-medium text-foreground">
            <span className="text-primary font-semibold hover:underline">
              Click to browse
            </span>{" "}
            or drag and drop {isImage ? "an image" : "a file"}
          </p>

          <p className="text-[11px] text-muted-foreground mt-1">
            {isImage
              ? `Supports PNG, JPG, GIF, WebP, SVG up to ${constraints.maxSizeLabel}`
              : `Supports PDF, TXT, MD, JSON, YAML, CSV up to ${constraints.maxSizeLabel}`}
          </p>
        </div>
      )}

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs">
          <AlertCircle className="size-4 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 hover:opacity-80 cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
