// components/layout/app-sidebar.tsx

"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";

import { BrushControls } from "./brush-controls";

export function AppSidebar() {
  return (
    <Sidebar variant="floating">
      <SidebarHeader className="border-b">
        <div className="px-2 py-2">
          <div className="flex h-12 w-full items-center overflow-hidden rounded-md">
            <img
              src="/fuderu.png"
              alt="Fuderu"
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <BrushControls />
      </SidebarContent>
    </Sidebar>
  );
}
