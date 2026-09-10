"use client";

import * as React from "react";
import { Camera, Upload, Trash2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { updateAvatarAction } from "@/actions/profile";

interface AvatarUploadDialogProps {
  currentImage: string | null;
  userName: string;
  userEmail: string;
}

function resizeImageFile(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to process image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function AvatarUploadDialog({
  currentImage,
  userName,
  userEmail,
}: AvatarUploadDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedPreview, setSelectedPreview] = React.useState<string | null | undefined>(undefined);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const displayPreview = selectedPreview !== undefined ? selectedPreview : currentImage;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelectedPreview(undefined);
      setSelectedFile(null);
      setError(null);
      setSuccessMessage(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setError("Please select a JPEG, PNG, WEBP, or GIF image file.");
      return;
    }

    // Validate size: 2MB max
    if (file.size > 2 * 1024 * 1024) {
      setError("Image size exceeds 2MB. Please choose a smaller image.");
      return;
    }

    setSelectedFile(file);

    try {
      const resized = await resizeImageFile(file, 256);
      setSelectedPreview(resized);
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!selectedPreview) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await updateAvatarAction(selectedPreview);
      if (res.success) {
        setSuccessMessage("Profile photo updated successfully!");
        setTimeout(() => {
          handleOpenChange(false);
        }, 1000);
      } else {
        setError(res.error || "Failed to update avatar.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await updateAvatarAction(null);
      if (res.success) {
        setSelectedPreview(null);
        setSelectedFile(null);
        setSuccessMessage("Avatar removed successfully.");
        setTimeout(() => {
          handleOpenChange(false);
        }, 1000);
      } else {
        setError(res.error || "Failed to remove avatar.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="group relative flex size-16 sm:size-20 shrink-0 cursor-pointer items-center justify-center rounded-full overflow-hidden border-2 border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Change profile photo"
          />
        }
      >
        <UserAvatar
          name={userName}
          email={userEmail}
          image={currentImage}
          size="lg"
          className="size-full text-xl"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="size-5 text-white" />
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Profile Avatar</DialogTitle>
          <DialogDescription>
            Upload a custom avatar image. Recommended size is 256x256 pixels (max 2MB).
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="my-2 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="my-2 flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          <UserAvatar
            name={userName}
            email={userEmail}
            image={displayPreview}
            size="lg"
            className="size-24 text-2xl border-2 border-border shadow-md"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="gap-2 text-xs cursor-pointer"
            >
              <Upload className="size-3.5" />
              <span>Choose Image</span>
            </Button>

            {currentImage && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={isLoading}
                className="gap-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                <span>Remove</span>
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose
            render={
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                className="cursor-pointer text-xs"
              />
            }
          >
            Cancel
          </DialogClose>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading || !selectedFile}
            className="bg-foreground text-background hover:bg-foreground/90 font-medium text-xs cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Avatar</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
