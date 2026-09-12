"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useTransition,
  useRef,
  useEffect,
} from "react";
import { Check, AlertCircle, X } from "lucide-react";
import { cn } from "cn";
import type { DashboardItem, ItemDetail } from "@/lib/db/items";

export interface ToastState {
  id: string;
  type: "success" | "error";
  message: string;
}

interface ItemDrawerContextValue {
  isOpen: boolean;
  isLoading: boolean;
  item: ItemDetail | null;
  previewItem: DashboardItem | null;
  error: string | null;
  openItem: (itemId: string, preview?: DashboardItem) => Promise<void>;
  closeDrawer: () => void;
  toggleFavorite: () => void;
  togglePin: () => void;
  setItemDetail: (item: ItemDetail) => void;
  showToast: (type: "success" | "error", message: string) => void;
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);

export function useItemDrawer(): ItemDrawerContextValue {
  const context = useContext(ItemDrawerContext);
  if (!context) {
    throw new Error("useItemDrawer must be used within an ItemDrawerProvider");
  }
  return context;
}

/**
 * Optional hook variant that doesn't throw if outside provider.
 * Useful for components like ItemCard that can be used in or out of provider.
 */
export function useOptionalItemDrawer(): ItemDrawerContextValue | null {
  return useContext(ItemDrawerContext);
}

export function ItemDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [previewItem, setPreviewItem] = useState<DashboardItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [, startTransition] = useTransition();

  const showToast = useCallback((type: "success" | "error", message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    const id = Date.now().toString();
    setToast({ id, type, message });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const openItem = useCallback(
    async (itemId: string, preview?: DashboardItem) => {
      setIsOpen(true);
      setIsLoading(true);
      setError(null);
      setPreviewItem(preview ?? null);
      setItem(null);

      try {
        const res = await fetch(`/api/items/${encodeURIComponent(itemId)}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Error ${res.status}: Failed to load item`
          );
        }
        const data = (await res.json()) as { item: ItemDetail };
        startTransition(() => {
          setItem(data.item);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load item");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleFavorite = useCallback(() => {
    setItem((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    setPreviewItem((prev) =>
      prev ? { ...prev, isFavorite: !prev.isFavorite } : null
    );
  }, []);

  const togglePin = useCallback(() => {
    setItem((prev) => (prev ? { ...prev, isPinned: !prev.isPinned } : null));
    setPreviewItem((prev) =>
      prev ? { ...prev, isPinned: !prev.isPinned } : null
    );
  }, []);

  const setItemDetail = useCallback((updatedItem: ItemDetail) => {
    setItem(updatedItem);
    setPreviewItem((prev) =>
      prev
        ? {
            ...prev,
            title: updatedItem.title,
            description: updatedItem.description,
            content: updatedItem.content,
            url: updatedItem.url,
            language: updatedItem.language,
            tags: updatedItem.tags,
          }
        : null
    );
  }, []);

  return (
    <ItemDrawerContext.Provider
      value={{
        isOpen,
        isLoading,
        item,
        previewItem,
        error,
        openItem,
        closeDrawer,
        toggleFavorite,
        togglePin,
        setItemDetail,
        showToast,
      }}
    >
      {children}

      {/* Floating Toast Notification Container */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-[100] max-w-sm w-auto pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div
            className={cn(
              "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-xs font-sans backdrop-blur-md",
              toast.type === "success"
                ? "bg-emerald-950/95 border-emerald-500/30 text-emerald-100 shadow-emerald-950/50"
                : "bg-destructive/95 border-destructive/30 text-destructive-foreground shadow-destructive/50"
            )}
          >
            {toast.type === "success" ? (
              <Check className="size-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="size-4 shrink-0 text-rose-400" />
            )}
            <span className="font-medium leading-relaxed">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer p-0.5 rounded-md hover:bg-white/10 transition-colors ml-1"
              aria-label="Dismiss toast"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </ItemDrawerContext.Provider>
  );
}

/**
 * Client wrapper component alias for managing drawer state in page layouts.
 */
export function ItemDrawerWrapper({ children }: { children: React.ReactNode }) {
  return <ItemDrawerProvider>{children}</ItemDrawerProvider>;
}
