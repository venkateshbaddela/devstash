import * as React from "react";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { getSidebarItemTypes } from "@/lib/db/items";
import { getSidebarCollections } from "@/lib/db/collections";

export async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [itemTypes, collections] = await Promise.all([
    getSidebarItemTypes(),
    getSidebarCollections(),
  ]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar
          itemTypes={itemTypes}
          collections={collections}
          user={{
            name: "Demo User",
            email: "demo@devstash.io",
          }}
        />
        <div className="flex flex-1 flex-col min-w-0">
          <TopBar />
          <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
