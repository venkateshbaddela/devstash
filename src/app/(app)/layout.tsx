import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ItemDrawerProvider } from "@/components/items/item-drawer-context";
import { ItemDrawer } from "@/components/items/item-drawer";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout>
      <ItemDrawerProvider>
        {children}
        <ItemDrawer />
      </ItemDrawerProvider>
    </DashboardLayout>
  );
}
