"use client";

import * as React from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleSidebar: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
  setIsMobileOpen: (open: boolean) => void;
  toggle: () => void;
  isTypesOpen: boolean;
  setIsTypesOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleTypes: () => void;
  isCollectionsOpen: boolean;
  setIsCollectionsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleCollections: () => void;
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(
  undefined
);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isTypesOpen, setIsTypesOpen] = React.useState(true);
  const [isCollectionsOpen, setIsCollectionsOpen] = React.useState(true);

  const toggleSidebar = React.useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const toggleMobile = React.useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const closeMobile = React.useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const toggleTypes = React.useCallback(() => {
    setIsTypesOpen((prev) => !prev);
  }, []);

  const toggleCollections = React.useCallback(() => {
    setIsCollectionsOpen((prev) => !prev);
  }, []);

  const toggle = React.useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isMobileOpen,
        toggleSidebar,
        toggleMobile,
        closeMobile,
        setIsMobileOpen,
        toggle,
        isTypesOpen,
        setIsTypesOpen,
        toggleTypes,
        isCollectionsOpen,
        setIsCollectionsOpen,
        toggleCollections,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
