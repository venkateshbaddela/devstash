"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useTransition,
} from "react";
import type { DashboardItem, ItemDetail } from "@/lib/db/items";

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
  const [, startTransition] = useTransition();

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
      }}
    >
      {children}
    </ItemDrawerContext.Provider>
  );
}

/**
 * Client wrapper component alias for managing drawer state in page layouts.
 */
export function ItemDrawerWrapper({ children }: { children: React.ReactNode }) {
  return <ItemDrawerProvider>{children}</ItemDrawerProvider>;
}
